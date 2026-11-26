# LINE Bot AI

A well-structured LINE chatbot with AI capabilities, featuring image generation, text-to-speech, and Google search.

## 📁 Project Structure

```
line-bot-ai/
├── src/
│   ├── config/              # Configuration files
│   │   ├── line.js          # LINE Bot configuration
│   │   ├── openrouter.js    # OpenRouter AI configuration
│   │   ├── groq.js          # Groq AI configuration (legacy)
│   │   ├── cloudinary.js    # Cloudinary configuration
│   │   ├── storage.js       # Google Cloud Storage configuration
│   │   └── constants.js     # Application constants
│   ├── handlers/            # Event and command handlers
│   │   ├── eventHandler.js  # Main event handler
│   │   ├── chatHandler.js   # AI chat handler
│   │   ├── contextHandler.js # /reset, /system, /context
│   │   ├── imageHandler.js  # Image generation handler
│   │   ├── searchHandler.js # Google search handler
│   │   ├── ttsHandler.js    # Text-to-speech handler
│   │   └── helpHandler.js   # Help command handler
│   ├── services/            # External API services
│   │   ├── aiService.js     # OpenRouter AI service (Groq legacy function kept)
│   │   ├── contextService.js # Chat context: system prompt, recent messages, compaction
│   │   ├── autoSearchService.js # AI decides if a chat message needs a Google search first
│   │   ├── imageService.js  # Image generation service
│   │   ├── searchService.js # Google search service
│   │   └── ttsService.js    # Speechify TTS service
│   ├── middleware/          # Middleware functions
│   │   └── rateLimit.js     # Rate limiting middleware
│   ├── utils/               # Utility functions
│   │   ├── botInfo.js       # Bot information utilities
│   │   └── uploadUtils.js   # File upload utilities
│   └── server.js            # Main application entry point
├── scripts/                 # Utility scripts
│   └── test-groq.js        # Test Groq API
├── temp/                    # Temporary files
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
└── package.json            # Project dependencies

```

## 🚀 Features

- **AI Chat**: Powered by OpenRouter AI with per-chat context: system prompt, recent messages, and automatic history compaction
- **Auto Search**: The AI first checks whether it actually understands/knows the answer; if not, it searches Google and answers from the results
- **Image Generation**: Create AI images from text prompts
- **Text-to-Speech**: Convert text to audio with multiple voices
- **Google Search**: Search Google directly from LINE
- **Rate Limiting**: Prevents API abuse
- **Group Support**: Works in both 1-on-1 and group chats

## 🛠️ Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret

# AI Provider (openrouter or groq)
AI_PROVIDER=groq

# OpenRouter AI (Primary)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-oss-120b
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=line-bot-ai

# Groq AI (Optional legacy)
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b

# Pollinations AI (Optional - for image generation)
POLLINATIONS_API_KEY=your_pollinations_api_key
POLLINATIONS_MODEL=flux

# Google Search (optional)
GOOGLE_API_KEY=your_google_key
GOOGLE_CX=your_search_engine_id
# Auto search before AI chat answers (needs Google keys; set false to disable)
AUTO_SEARCH=true

# Speechify TTS (optional)
SPEECHIFY_API_KEY=your_speechify_key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud Storage (optional)
GCS_CREDENTIALS={"type":"service_account",...}
GCS_BUCKET_NAME=your_bucket_name

# Default AI system prompt (optional; per chat override via /system)
SYSTEM_PROMPT=You are a helpful assistant in a LINE chat.

# Server
PORT=3000
```

3. Run the bot:
```bash
npm start
```

## 📝 Commands

- `/image <prompt>` - Generate AI images
- `/google [-n num] <query>` - Search Google
- `/tts [-v voice] [-l lang] <text>` - Text to speech
- `/reset` - Clear conversation history and summary (keeps custom system prompt)
- `/system [prompt|reset]` - Show, set, or reset this chat's system prompt
- `/context` - Show chat memory status and summary
- `/help` - Show help message

## 🧠 Chat Context

Each chat (1-on-1, group, or room) keeps its own in-memory context, sent to the AI as:

1. **System message**: default prompt (`SYSTEM_PROMPT` or built-in) or the chat's `/system` override, a group-chat note, the current time, and the summary of older messages.
2. **Recent messages**: the latest user/assistant exchanges, verbatim.
3. **New user message**.

When recent messages exceed 20 messages or 12,000 characters, older messages are summarized in the background (after the reply is sent) and only the last 8 are kept verbatim. If summarization fails, the oldest messages are dropped so memory stays bounded. Limits live in `CONVERSATION` in `src/config/constants.js`. Context is in-memory and lost on restart.

## 🔍 Auto Search

Before answering a chat message, the bot asks the AI (with the summary and last 6 messages) whether it can answer correctly on its own. The AI returns JSON: whether the message asks what a term means, the slang/memes/buzzwords it spots, its confidence, a search flag, and a Google query. The bot searches when the AI asks to, **or** the message asks for a term's meaning, **or** contains slang (models often misread slang confidently), **or** confidence is below 0.8. It then searches Google (top 5 results) and adds the titles, snippets, and links to that turn's prompt, so the reply is based on the results. Conversation history stores only the original message.

- Runs only when `GOOGLE_API_KEY` and `GOOGLE_CX` are set and `AUTO_SEARCH` is not `false`.
- Costs one extra AI call per chat message (plus one Google query when searching).
- If the decision or the search fails, the bot answers without search.
- Settings live in `SEARCH` in `src/config/constants.js`.

## 🧪 Testing

Test Groq AI connection:
```bash
npm test
```

## 📦 Architecture

The project follows a modular architecture:

- **Config**: Centralized configuration management
- **Handlers**: Command-specific logic
- **Services**: External API integrations
- **Middleware**: Request processing (rate limiting, etc.)
- **Utils**: Shared utility functions

This structure makes the code:
- Easy to maintain
- Easy to test
- Easy to extend with new features
- Easy to understand

## 🔒 Security

- Environment variables for sensitive data
- Rate limiting to prevent abuse
- Webhook signature validation

## 📄 License

ISC
