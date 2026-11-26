const SUPPORTED_AI_PROVIDERS = new Set(['groq', 'openrouter', 'opencode']);
const rawProvider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
const provider = SUPPORTED_AI_PROVIDERS.has(rawProvider) ? rawProvider : 'groq';

module.exports = {
  RATE_LIMIT: {
    MAX_REQUESTS: 6,
    TIME_WINDOW: 60000, // 1 minute in milliseconds
  },
  CONVERSATION: {
    DEFAULT_SYSTEM_PROMPT: process.env.SYSTEM_PROMPT
      || 'You are a helpful assistant in a LINE chat. Keep responses concise and friendly, and reply in the user\'s language.',
    MAX_SYSTEM_PROMPT_LENGTH: 1000,
    MAX_RECENT_MESSAGES: 20, // compact when recent messages exceed this count
    MAX_CONTEXT_CHARS: 12000, // ...or when recent messages exceed this many characters
    KEEP_RECENT_MESSAGES: 8, // messages kept verbatim after auto-compaction (must be even)
    SUMMARY_MAX_TOKENS: 800,
  },
  AI: {
    PROVIDER: provider,
    GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free',
    OPENCODE_MODEL: process.env.OPENCODE_MODEL || 'deepseek-v4-flash',
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
    // AI chat: ask the AI whether it can answer alone; otherwise search Google first
    AUTO_SEARCH_ENABLED: process.env.AUTO_SEARCH !== 'false',
    AUTO_SEARCH_RESULTS: 5,
    DECISION_HISTORY_MESSAGES: 6, // recent messages shown to the decision step
    DECISION_MAX_TOKENS: 800, // includes reasoning tokens on reasoning models
    DECISION_MIN_CONFIDENCE: 0.8, // search when the AI rates its own understanding below this
  },
};
