const { client, getBotUserId, getBotDisplayName } = require('../utils/botInfo');
const { checkRateLimit } = require('../middleware/rateLimit');
const { handleImageCommand } = require('../handlers/imageHandler');
const { handleGoogleCommand } = require('../handlers/searchHandler');
const { handleTTSCommand } = require('../handlers/ttsHandler');
const { handleAIChat, resetConversation } = require('../handlers/chatHandler');
const { handleHelpCommand } = require('../handlers/helpHandler');
const { handleLuckCommand } = require('../handlers/luckHandler');

async function handleEvent(event) {
  console.log('🔔 Handling event:', JSON.stringify(event, null, 2));

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
        mentionee => mentionee.userId === getBotUserId()
      );
    }

    // Check for text mention (e.g., from computer clients that can't use @mention)
    if (userMessage.toLowerCase().includes(`@${getBotDisplayName()}`.toLowerCase())) {
      isBotMentioned = true;
    }

    if (isBotMentioned) {
      console.log(`👥 Mentioned in group: ${userMessage}`);

      let cleanMessage = userMessage.replace(new RegExp(`@${getBotDisplayName()}`, 'i'), '').trim();

      return await processMessage(event, groupId, userId, cleanMessage);
    }

    // Not mentioned, ignore
    console.log(`🔇 Not mentioned in group, ignoring message`);
    return null;
  }

  return null;
}

async function processMessage(event, roomId, userId, userMessage) {
  console.log(`💬 Processing message from ${userId} in room ${roomId}: '${userMessage}'`);

  if (!userMessage || userMessage.trim() === '') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '幹嘛? 有事嗎你',
    });
  }

  // Check rate limit
  if (!checkRateLimit(userId)) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '你問題太多了!',
    });
  }

  // Handle reset command
  if (userMessage.toLowerCase() === '/reset') {
    resetConversation(roomId);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🔄 Conversation history cleared!',
    });
  }

  // Handle help command
  if (userMessage.toLowerCase().startsWith('/help')) {
    return handleHelpCommand(client, event, userMessage);
  }

  // Handle image generation command
  if (userMessage.toLowerCase().startsWith('/image ')) {
    return await handleImageCommand(client, event, userMessage);
  }

  // Handle google search command
  if (userMessage.toLowerCase().startsWith('/google ')) {
    return await handleGoogleCommand(client, event, userMessage);
  }

  // Handle TTS command
  if (userMessage.toLowerCase().startsWith('/tts ')) {
    return await handleTTSCommand(client, event, userMessage);
  }

  // Handle daily luck command
  if (userMessage.toLowerCase().startsWith('/luck')) {
    return handleLuckCommand(client, event, userId, userMessage);
  }

  // Default: Handle with AI chat
  return await handleAIChat(client, event, roomId, userId, userMessage);
}

module.exports = { handleEvent };
