require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const Groq = require('groq-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const conversations = new Map();
const userRequestTimestamps = new Map(); // Track user request timestamps

// Get bot info (for mention detection)
let botUserId = null;
let botUsername = null;
let botDisplayName = null;

async function getBotInfo() {
  try {
    const profile = await client.getBotInfo();
    botUserId = profile.userId;
    botUsername = profile.basicId; // This is the @username
    botDisplayName = profile.displayName;

    console.log('✅ Bot User ID:', botUserId);
    console.log('✅ Bot Username:', botUsername);
    console.log('✅ Display Name:', botDisplayName);
  } catch (error) {
    console.error('Failed to get bot info:', error);
  }
}

// Initialize bot info on startup
getBotInfo();

app.get('/', (req, res) => {
  res.send('LINE Bot is running! 🤖');
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  console.log('📨 Webhook received');

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function handleEvent(event) {
  // Only handle text messages
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  // ✅ CHECK 1: In 1-on-1 chat, always respond
  if (event.source.type === 'user') {
    console.log(`👤 Direct message from ${userId}: ${userMessage}`);
    return await processMessage(event, userId, userMessage);
  }

  // ✅ CHECK 2: In group/room chat, only respond if mentioned
  if (event.source.type === 'group' || event.source.type === 'room') {
    const mention = event.message.mention;
    const groupId = event.source.groupId || event.source.roomId;

    let isBotMentioned = false;

    // Check if bot is mentioned
    if (mention && mention.mentionees) {
      isBotMentioned = mention.mentionees.some(
        mentionee => mentionee.userId === botUserId
      );
    }

    // Check for text mention (e.g., from computer clients that can't use @mention)
    if (userMessage.toLowerCase().includes(`@${botDisplayName}`.toLowerCase())) {
      isBotMentioned = true;
    }

    if (isBotMentioned) {
      console.log(`👥 Mentioned in group: ${userMessage}`);

      let cleanMessage = userMessage.replace(`@${botDisplayName}`, '').trim();
      if (cleanMessage.length === 0) {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: '幹嘛? 有事嗎你',
        });
      }

      cleanMessage = `${userId} says: ${cleanMessage}`;

      return await processMessage(event, groupId, cleanMessage);
    }

    // Not mentioned, ignore
    console.log(`🔇 Not mentioned in group, ignoring message`);
    return null;
  }

  return null;
}

async function processMessage(event, userId, userMessage) {
  // Check rate limit (10 requests per minute)
  const now = Date.now();
  const oneMinuteAgo = now - 60000; // 60 seconds

  if (!userRequestTimestamps.has(userId)) {
    userRequestTimestamps.set(userId, []);
  }

  const timestamps = userRequestTimestamps.get(userId);

  // Remove timestamps older than 1 minute
  const recentTimestamps = timestamps.filter(timestamp => timestamp > oneMinuteAgo);

  // Check if user has exceeded rate limit
  if (recentTimestamps.length >= 6) {
    console.log(`⚠️ Rate limit exceeded for user ${userId}`);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '你問題太多了!',
    });
  }

  // Add current timestamp
  recentTimestamps.push(now);
  userRequestTimestamps.set(userId, recentTimestamps);

  // Handle reset command
  if (userMessage.toLowerCase() === '/reset') {
    conversations.delete(userId);
    console.log('🔄 Chat reset');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🔄 Conversation history cleared!',
    });
  }

  // Handle help command
  if (userMessage.toLowerCase() === '/help') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🤖 Commands:\n/reset - Clear chat\n/help - Show this\n\n💡 In groups, mention me (@bot) to chat!',
    });
  }

  try {
    // Initialize conversation history
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }

    const history = conversations.get(userId);
    history.push({ role: 'user', content: userMessage });

    // Keep last 20 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    console.log('🤖 Calling AI...');

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
        ...history
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    history.push({ role: 'assistant', content: aiResponse });

    console.log('✅ Sending response');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiResponse,
    });

  } catch (error) {
    console.error('❌ AI Error:', error);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '😅 Sorry, something went wrong!',
    });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});