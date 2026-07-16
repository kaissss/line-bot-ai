const OPENCODE_BASE_URL = process.env.OPENCODE_BASE_URL || 'https://opencode.ai/zen/go/v1';
const OPENCODE_CHAT_COMPLETIONS_URL = `${OPENCODE_BASE_URL}/chat/completions`;

module.exports = {
  OPENCODE_CHAT_COMPLETIONS_URL,
};
