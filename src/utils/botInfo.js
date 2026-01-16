const line = require('@line/bot-sdk');
const lineConfig = require('../config/line');

const client = new line.Client(lineConfig);

// Get bot info (for mention detection)
let botUserId = null;
let botUsername = null;
let botDisplayName = null;

async function getBotInfo() {
  try {
    const profile = await client.getBotInfo();
    botUserId = profile.userId;
    botUsername = profile.basicId;
    botDisplayName = profile.displayName;

    console.log('✅ Bot User ID:', botUserId);
    console.log('✅ Bot Username:', botUsername);
    console.log('✅ Display Name:', botDisplayName);
  } catch (error) {
    console.error('❌ Failed to get bot info:', error.message);
    console.error('Error details:', error.response?.data || error);
  }
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
  getBotUserId,
  getBotDisplayName,
};
