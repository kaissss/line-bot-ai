const line = require('@line/bot-sdk');
const lineConfig = require('../config/line');

const client = new line.Client(lineConfig);

// Get bot info (for mention detection)
let botUserId = null;
let botUsername = null;
let botDisplayName = null;
let botInfoPromise = null;

function hasBotInfo() {
  return Boolean(botUserId && botDisplayName);
}

async function getBotInfo(forceRefresh = false) {
  if (!forceRefresh && hasBotInfo()) {
    return {
      botUserId,
      botUsername,
      botDisplayName,
    };
  }

  if (!forceRefresh && botInfoPromise) {
    return botInfoPromise;
  }

  botInfoPromise = (async () => {
    try {
      const profile = await client.getBotInfo();
      botUserId = profile.userId;
      botUsername = profile.basicId;
      botDisplayName = profile.displayName;

      console.log('✅ Bot User ID:', botUserId);
      console.log('✅ Bot Username:', botUsername);
      console.log('✅ Display Name:', botDisplayName);

      return {
        botUserId,
        botUsername,
        botDisplayName,
      };
    } catch (error) {
      console.error('❌ Failed to get bot info:', error.message);
      console.error('Error details:', error.response?.data || error);
      throw error;
    } finally {
      botInfoPromise = null;
    }
  })();

  return botInfoPromise;
}

async function ensureBotInfo() {
  if (hasBotInfo()) {
    return {
      botUserId,
      botUsername,
      botDisplayName,
    };
  }

  return getBotInfo();
}

function getBotUserId() {
  return botUserId;
}

function getBotDisplayName() {
  return botDisplayName;
}

module.exports = {
  client,
  getBotInfo,
  ensureBotInfo,
  getBotUserId,
  getBotDisplayName,
};
