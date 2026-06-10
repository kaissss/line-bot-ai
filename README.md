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
│   │   ├── imageHandler.js  # Image generation handler
│   │   ├── searchHandler.js # Google search handler
│   │   ├── ttsHandler.js    # Text-to-speech handler
│   │   └── helpHandler.js   # Help command handler
│   ├── services/            # External API services
│   │   ├── aiService.js     # OpenRouter AI service (Groq legacy function kept)
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

- **AI Chat**: Powered by OpenRouter AI with conversation history
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

# OpenRouter AI (Primary)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-oss-120b
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=line-bot-ai

# Groq AI (Optional legacy)
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b

# Google Search (optional)
GOOGLE_API_KEY=your_google_key
GOOGLE_CX=your_search_engine_id

# Speechify TTS (optional)
SPEECHIFY_API_KEY=your_speechify_key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud Storage (optional)
GCS_CREDENTIALS={"type":"service_account",...}
GCS_BUCKET_NAME=your_bucket_name

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
- `/reset` - Clear conversation history
- `/help` - Show help message

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
