const { generateChatResponse } = require('../services/aiService');
const { CONVERSATION } = require('../config/constants');

const conversations = new Map();

async function handleAIChat(client, event, roomId, userId, userMessage) {
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
    if (history.length > CONVERSATION.MAX_HISTORY) {
      history.splice(0, 2);
    }

    // Call AI service
    const aiResponse = await generateChatResponse(history);
    history.push({ role: 'assistant', content: aiResponse });

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiResponse,
    });

  } catch (error) {
    console.error('❌ AI Error:', error.message);

    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }

    let errorMessage = '😅 Sorry, something went wrong with AI!';

    const errorMessageText = error.message || '';

    if (/api.*key|key.*api/i.test(errorMessageText)) {
      errorMessage = '⚙️ AI API configuration error. Please contact admin.';
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

function resetConversation(roomId) {
  conversations.delete(roomId);
  console.log('🔄 Chat reset');
}

module.exports = { handleAIChat, resetConversation };
