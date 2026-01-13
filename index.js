require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const Groq = require('groq-sdk');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const app = express();

// LINE Bot configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    console.error('❌ Failed to get bot info:', error.message);
    console.error('Error details:', error.response?.data || error);
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
    return await processMessage(event, userId, userId, userMessage);
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

      let cleanMessage = userMessage.replace(new RegExp(`@${botDisplayName}`, 'i'), '').trim();

      return await processMessage(event, groupId, userId, cleanMessage);
    }

    // Not mentioned, ignore
    console.log(`🔇 Not mentioned in group, ignoring message`);
    return null;
  }

  return null;
}

async function generateImage(prompt) {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    // Call it in advance to trigger generation
    await axios.get(imageUrl, { timeout: 30000 }); // 30 second timeout

    return imageUrl;
  } catch (error) {
    console.error('❌ Error triggering image generation:', error.message);
    // Still return the URL even if pre-fetch fails
    return `https://upload.wikimedia.org/wikipedia/commons/3/3b/Windows_9X_BSOD.png`;
  }
}
async function handleImageCommand(event, userMessage) {
  const userPrompt = userMessage.substring(7).trim();

  if (!userPrompt) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide a prompt for image generation.',
    });
  }

  try {
    console.log(`🎨 Generating image for prompt: "${userPrompt}"`);

    const imageUrl = await generateImage(userPrompt);
    const replyMessages = [
      {
        type: 'text',
        text: `🎨 Generated: "${userPrompt}"`
      },
      {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      }
    ];

    return client.replyMessage(event.replyToken, replyMessages);
  } catch (error) {
    console.error('❌ Image generation error:', error.message);
    console.error('Error details:', error.response?.data || error);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '😅 Failed to generate image. Please try again later.',
    });
  }
}


async function generateSpeechifyTTS(text, voice = 'henry') {
  try {
    const SPEECHIFY_API_KEY = process.env.SPEECHIFY_API_KEY;

    if (!SPEECHIFY_API_KEY) {
      throw new Error('Speechify API key not configured');
    }

    console.log(`🎙️ Generating TTS with Speechify for text: "${text.substring(0, 50)}..."`);

    const response = await axios.post(
      'https://api.sws.speechify.com/v1/audio/speech',
      {
        input: text,
        voice_id: voice,
        audio_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${SPEECHIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    );

    // Convert audio buffer to base64 or return the buffer
    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Speechify TTS error:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.status);
    }
    throw error;
  }
}
async function uploadAudioToCloudinary(audioBuffer, filename = `tts_${Date.now()}`) {
  const tempDir = path.join(__dirname, 'temp');
  const tempFilePath = path.join(tempDir, `${filename}.mp3`);
  
  try {
    console.log('💾 Saving audio file temporarily...');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save buffer to file
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log('✅ Audio file saved:', tempFilePath);
    
    console.log('☁️ Uploading to Cloudinary...');
    
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "video", // Required for audio files
      folder: "tts",
      public_id: filename,
      overwrite: true
    });
    
    console.log('✅ Upload successful:', result.secure_url);
    
    // Delete temp file
    fs.unlinkSync(tempFilePath);
    console.log('🗑️ Temp file deleted');
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    
    // Clean up temp file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    throw error;
  }
}
async function handleTTSCommand(event, userMessage) {
  const text = userMessage.substring(5).trim();

  if (!text) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide text to convert to speech. Usage: /tts <text>',
    });
  }

  try {
    console.log(`🎙️ Converting text to speech: "${text}"`);

    // Send initial message
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🎙️ Generating speech... Please wait.',
    });

    // Generate TTS audio
    const audioBuffer = await generateSpeechifyTTS(text);

    // Upload to Cloudinary
    const audioUrl = await uploadAudioToCloudinary(audioBuffer);

    // Calculate duration (estimate based on text length, ~150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60 * 1000); // in milliseconds

    // Send audio message to LINE
    const targetId = event.source.userId || event.source.groupId || event.source.roomId;
    return client.pushMessage(targetId, {
      type: 'audio',
      originalContentUrl: audioUrl,
      duration: estimatedDuration
    });

  } catch (error) {
    console.error('❌ TTS generation error:', error.message);

    let errorMessage = '😅 Failed to generate speech. Please try again later.';

    if (error.message.includes('API key not configured')) {
      errorMessage = '⚙️ Speechify TTS is not configured properly.';
    } else if (error.message.includes('Cloudinary')) {
      errorMessage = '☁️ Failed to upload audio. Please check Cloudinary configuration.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ TTS generation timed out. Please try again.';
    } else if (error.response?.status === 401) {
      errorMessage = '🔐 Invalid API key.';
    } else if (error.response?.status === 429) {
      errorMessage = '🚦 Rate limit exceeded. Please try again in a moment.';
    }

    const targetId = event.source.userId || event.source.groupId || event.source.roomId;
    return client.pushMessage(targetId, {
      type: 'text',
      text: errorMessage,
    });
  }
}

async function handleGoogleCommand(event, userMessage) {
  const args = userMessage.substring(8).trim();
  let searchQuery = args;
  let num = 3; // default

  // Check for -n flag
  const nFlagMatch = args.match(/-n\s+(\d+)/);
  if (nFlagMatch) {
    num = parseInt(nFlagMatch[1], 10);
    num = Math.min(Math.max(num, 1), 10); // clamp between 1-10
    searchQuery = args.replace(/-n\s+\d+/, '').trim();
  }

  if (!searchQuery) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide a search query.',
    });
  }

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CX = process.env.GOOGLE_CX;

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error('Google API credentials not configured');
    }

    console.log(`🔍 Searching Google for: "${searchQuery}"`);

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: searchQuery,
        num: num
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data.items && response.data.items.length > 0) {
      const results = response.data.items;
      let resultText = `🔍 Search results for "${searchQuery}":\n\n`;

      results.forEach((item, index) => {
        resultText += `${index + 1}. ${item.title}\n${item.link}\n${item.snippet}\n\n`;
      });

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: resultText.trim(),
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🤷 No results found for your search.',
      });
    }
  } catch (error) {
    console.error('❌ Google search error:', error.message);

    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error);
    }

    let errorMessage = '😅 Failed to perform search. Please try again later.';

    if (error.message.includes('credentials not configured')) {
      errorMessage = '⚙️ Google search is not configured properly.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ Search timed out. Please try again.';
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage,
    });
  }
}

async function handleGroqChat(event, roomId, userId, userMessage) {
  try {
    // Initialize conversation history
    if (!conversations.has(roomId)) {
      conversations.set(roomId, []);
    }

    const history = conversations.get(roomId);

    if (roomId === userId) {
      // 1-on-1 chat, no need to prefix user info
      history.push({ role: 'user', content: userMessage });
    } else {
      // Group chat, prefix user ID & name
      let userDisplayName = 'User';
      try {
        const profile = await client.getProfile(userId);
        userDisplayName = profile.displayName;
      } catch (error) {
        console.error('Failed to get user profile:', error.message);
      }
      history.push({ role: 'user', content: `UserID ${userId}(${userDisplayName}) says: ${userMessage}` });
    }

    // Keep last 20 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    console.log('🤖 Calling Groq AI...');

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
        ...history
      ],
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    history.push({ role: 'assistant', content: aiResponse });

    console.log('✅ AI response generated');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiResponse,
    });

  } catch (error) {
    console.error('❌ Groq AI Error:', error.message);

    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from Groq API');
    } else {
      console.error('Error details:', error);
    }

    let errorMessage = '😅 Sorry, something went wrong with AI!';

    if (error.message?.includes('API key') || error.message?.includes('api_key')) {
      errorMessage = '⚙️ Groq API configuration error. Please contact admin.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ AI request timed out. Please try again.';
    } else if (error.response?.status === 429) {
      errorMessage = '🚦 Rate limit exceeded. Please try again in a moment.';
    } else if (error.response?.status === 500 || error.response?.status === 503) {
      errorMessage = '🔧 AI service is temporarily unavailable. Please try again later.';
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage,
    });
  }
}

async function processMessage(event, roomId, userId, userMessage) {
  console.log(`💬 Processing message from ${userId} in room ${roomId}: '${userMessage}'`);

  if (!userMessage || userMessage.trim() === '') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '幹嘛? 有事嗎你',
    });
  }

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
    conversations.delete(roomId);
    console.log('🔄 Chat reset');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🔄 Conversation history cleared!',
    });
  }

  // Handle help command
  if (userMessage.toLowerCase() === '/help') {
    const helpText = [
      '🤖 Commands:',
      '/image - Generate an image',
      '/google - Search Google',
      '/tts - Text to speech',
      '/reset - Clear chat',
      '/help - Show this',
      '',
      '💡 In groups, mention me (@bot) to chat!'
    ].join('\n');

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: helpText,
    });
  }

  // Handle image generation command
  if (userMessage.toLowerCase().startsWith('/image ')) {
    return await handleImageCommand(event, userMessage);
  }

  // Handle google search command
  if (userMessage.toLowerCase().startsWith('/google ')) {
    return await handleGoogleCommand(event, userMessage);
  }

  // Handle TTS command
  if (userMessage.toLowerCase().startsWith('/tts ')) {
    return await handleTTSCommand(event, userMessage);
  }

  // Default: Handle with Groq AI chat
  return await handleGroqChat(event, roomId, userId, userMessage);
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});