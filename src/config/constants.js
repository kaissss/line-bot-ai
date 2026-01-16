module.exports = {
  RATE_LIMIT: {
    MAX_REQUESTS: 6,
    TIME_WINDOW: 60000, // 1 minute in milliseconds
  },
  CONVERSATION: {
    MAX_HISTORY: 20,
  },
  AI: {
    MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 500,
  },
  TTS: {
    DEFAULT_VOICE: 'henry',
    ESTIMATED_WPM: 150, // words per minute
  },
  SEARCH: {
    DEFAULT_RESULTS: 3,
    MAX_RESULTS: 10,
  },
};
