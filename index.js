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

// Store conversation history per user
const conversations = new Map();

app.post('/webhook-test', express.json(), async (req, res) => {
  console.log('📨 Test webhook');
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  console.log(`👤 User ${userId}: ${userMessage}`);

  if (userMessage.toLowerCase() === '/reset') {
    conversations.delete(userId);
    const msg = '🔄 Chat cleared!';
    
    if (event.replyToken === 'test-reply-token') {
      return { message: msg };
    }
    return client.replyMessage(event.replyToken, { type: 'text', text: msg });
  }

  try {
    // Initialize conversation history
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }

    const history = conversations.get(userId);
    history.push({ role: 'user', content: userMessage });

    // Keep last 10 messages
    if (history.length > 10) {
      history.splice(0, 2);
    }

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant in a LINE chat.' },
        ...history
      ],
      model: 'llama-3.3-70b-versatile', // Fast & smart model
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    history.push({ role: 'assistant', content: aiResponse });

    console.log(`🤖 AI: ${aiResponse}`);

    if (event.replyToken === 'test-reply-token') {
      return { message: aiResponse };
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiResponse,
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    const errorMsg = '😅 Sorry, something went wrong!';
    
    if (event.replyToken === 'test-reply-token') {
      return { error: error.message };
    }
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMsg,
    });
  }
}

app.get('/', (req, res) => {
  res.send('LINE Bot with Groq is running! 🤖');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server on port ${PORT}`);
});