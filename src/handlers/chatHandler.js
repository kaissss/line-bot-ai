const { generateChatResponse } = require('../services/aiService');
const { buildPromptMessages, recordExchange } = require('../services/contextService');
const { findSearchContext } = require('../services/autoSearchService');

async function handleAIChat(client, event, roomId, userId, userMessage) {
  try {
    const isGroup = roomId !== userId;
    let content = userMessage;

    if (isGroup) {
      // Group chat, prefix user ID & name
      let userDisplayName = 'User';
      try {
        const profile = await client.getProfile(userId);
        userDisplayName = profile.displayName;
      } catch (error) {
        console.error('Failed to get user profile:', error.message);
      }
      content = `UserID ${userId}(${userDisplayName}) says: ${userMessage}`;
    }

    const userEntry = { role: 'user', content };
    // Search results only enrich this turn's prompt; history keeps the original message.
    const searchContext = await findSearchContext(roomId, content);
    const promptEntry = searchContext ? { role: 'user', content: `${content}\n\n${searchContext}` } : userEntry;
    const messages = buildPromptMessages(roomId, promptEntry, { isGroup });

    const aiResponse = await generateChatResponse(messages, roomId);
    // Only successful exchanges enter the context, so failed requests leave no dangling user turn.
    recordExchange(roomId, userEntry, aiResponse);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiResponse,
    });

  } catch (error) {
    console.error('❌ AI Error:', error.message);
    console.error('AI provider:', error.provider || 'unknown');

    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }

    let errorMessage = '😅 Sorry, something went wrong with AI!';
    const errorStatus = error.status || error.response?.status;

    const errorMessageText = error.message || '';

    if (error.code === 'EMPTY_RESPONSE') {
      errorMessage = '無言薯條😐';
    } else if (/api.*key|key.*api/i.test(errorMessageText)) {
      errorMessage = '⚙️ AI API configuration error. Please contact admin.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ AI request timed out. Please try again.';
    } else if (errorStatus === 429) {
      errorMessage = '🚦 Rate limit exceeded. Please try again in a moment.';
    } else if (errorStatus === 500 || errorStatus === 503) {
      errorMessage = '🔧 AI service is temporarily unavailable. Please try again later.';
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage,
    });
  }
}

module.exports = { handleAIChat };
