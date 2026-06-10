const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_CHAT_COMPLETIONS_URL = `${OPENROUTER_BASE_URL}/chat/completions`;

module.exports = {
  OPENROUTER_CHAT_COMPLETIONS_URL,
};