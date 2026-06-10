# Project Architecture Documentation

## Overview
This LINE Bot AI project has been reorganized into a well-structured, modular architecture following industry best practices.

## Directory Structure

```
line-bot-ai/
├── src/                        # Source code
│   ├── config/                 # Configuration modules
│   │   ├── cloudinary.js       # Cloudinary SDK setup
│   │   ├── constants.js        # Application-wide constants
│   │   ├── groq.js            # Groq AI client setup
│   │   ├── line.js            # LINE Bot SDK configuration
│   │   └── storage.js         # Google Cloud Storage setup
│   │
│   ├── handlers/              # Request & command handlers
│   │   ├── eventHandler.js    # Main webhook event router
│   │   ├── chatHandler.js     # AI conversation logic
│   │   ├── helpHandler.js     # Help command responses
│   │   ├── imageHandler.js    # Image generation handler
│   │   ├── searchHandler.js   # Google search handler
│   │   └── ttsHandler.js      # Text-to-speech handler
│   │
│   ├── services/              # External API integrations
│   │   ├── aiService.js       # Groq AI API calls
│   │   ├── imageService.js    # Image generation API
│   │   ├── searchService.js   # Google Search API
│   │   └── ttsService.js      # Speechify TTS API
│   │
│   ├── middleware/            # Request processing middleware
│   │   └── rateLimit.js       # User rate limiting
│   │
│   ├── utils/                 # Utility functions
│   │   ├── botInfo.js         # Bot profile & client
│   │   └── uploadUtils.js     # Cloud storage uploads
│   │
│   └── server.js              # Application entry point
│
├── scripts/                   # Utility scripts
│   └── test-groq.js          # Test Groq API connection
│
├── backup/                    # Old project files (before refactor)
│   ├── index.js              # Original monolithic file
│   ├── test.js               # Original test file
│   └── README.md             # Backup documentation
│
├── temp/                      # Temporary files (auto-created)
├── .env                       # Environment variables (gitignored)
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
└── README.md                 # Project documentation
```

## Architecture Layers

### 1. Entry Point (`server.js`)
- Express server setup
- Webhook endpoints
- Minimal business logic
- Delegates to handlers

### 2. Configuration Layer (`config/`)
**Purpose**: Centralize all external service configurations
- **line.js**: LINE Bot SDK configuration
- **groq.js**: Groq AI client initialization
- **cloudinary.js**: Cloudinary setup
- **storage.js**: Google Cloud Storage bucket
- **constants.js**: Application constants (rate limits, defaults, etc.)

**Benefits**:
- Single source of truth for configs
- Easy to mock for testing
- Environment variable management

### 3. Handler Layer (`handlers/`)
**Purpose**: Process specific commands and events
- **eventHandler.js**: Routes LINE events to appropriate handlers
- **chatHandler.js**: Manages AI conversations with history
- **imageHandler.js**: Processes `/image` commands
- **searchHandler.js**: Processes `/google` commands
- **ttsHandler.js**: Processes `/tts` commands
- **helpHandler.js**: Provides command documentation

**Benefits**:
- Separation of concerns
- Easy to add new commands
- Testable in isolation

### 4. Service Layer (`services/`)
**Purpose**: Abstract external API calls
- **aiService.js**: Groq AI completions
- **imageService.js**: Image generation API
- **searchService.js**: Google Custom Search API
- **ttsService.js**: Speechify text-to-speech API

**Benefits**:
- API logic separation
- Easy to swap providers
- Centralized error handling
- Reusable across handlers

### 5. Middleware Layer (`middleware/`)
**Purpose**: Request preprocessing and validation
- **rateLimit.js**: User request throttling

**Benefits**:
- Cross-cutting concerns
- Reusable logic
- Security enforcement

### 6. Utilities Layer (`utils/`)
**Purpose**: Shared helper functions
- **botInfo.js**: Bot profile management, LINE client
- **uploadUtils.js**: Cloud storage file uploads

**Benefits**:
- Code reusability
- Single responsibility
- Easy to test

## Data Flow

```
User Message (LINE)
    ↓
server.js (webhook endpoint)
    ↓
eventHandler.js (route event)
    ↓
rateLimit.js (check user limits)
    ↓
[specific handler] (e.g., chatHandler.js)
    ↓
[service] (e.g., aiService.js)
    ↓
[external API] (e.g., Groq AI)
    ↓
Response back through chain
    ↓
LINE Bot sends reply
```

## Design Principles

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility.

### 2. **Modularity**
Components are independent and can be tested/modified without affecting others.

### 3. **DRY (Don't Repeat Yourself)**
Common logic is extracted into utilities and services.

### 4. **Single Responsibility**
Each file/function does one thing well.

### 5. **Dependency Injection**
Services and configs are passed as dependencies, making testing easier.

## Benefits of This Structure

### For Development
- ✅ Easy to find where specific logic lives
- ✅ Simple to add new features/commands
- ✅ Minimal code changes for updates
- ✅ Clear dependencies between modules

### For Testing
- ✅ Each module can be tested independently
- ✅ Easy to mock external dependencies
- ✅ Services can be tested without handlers
- ✅ Handlers can be tested without services

### For Maintenance
- ✅ Bug fixes are localized
- ✅ New developers can understand structure quickly
- ✅ Documentation is easy to maintain
- ✅ Code reviews are focused

### For Scaling
- ✅ Easy to add new commands/features
- ✅ Simple to swap API providers
- ✅ Can extract services to microservices if needed
- ✅ Performance bottlenecks are easy to identify

## Migration Notes

### What Changed
1. Monolithic `index.js` (782 lines) → Modular structure (20 files)
2. All logic in one file → Separated by responsibility
3. No clear organization → 6 distinct layers
4. Hard to test → Each module testable
5. Difficult to extend → Easy to add features

### What Stayed the Same
1. All features work exactly as before
2. Same environment variables
3. Same webhook endpoints
4. Same bot behavior
5. Same dependencies

### Backward Compatibility
- Old `index.js` and `test.js` preserved in `backup/`
- Entry point changed: `index.js` → `src/server.js`
- Package.json updated to point to new entry point
- All functionality preserved

## How to Add New Features

### Adding a New Command

1. **Create Service** (if external API needed)
   ```javascript
   // src/services/newService.js
   async function callNewAPI(params) {
     // API call logic
   }
   module.exports = { callNewAPI };
   ```

2. **Create Handler**
   ```javascript
   // src/handlers/newHandler.js
   const { callNewAPI } = require('../services/newService');
   
   async function handleNewCommand(client, event, message) {
     // Command logic
   }
   module.exports = { handleNewCommand };
   ```

3. **Register in Event Handler**
   ```javascript
   // src/handlers/eventHandler.js
   const { handleNewCommand } = require('./newHandler');
   
   if (userMessage.startsWith('/new ')) {
     return handleNewCommand(client, event, userMessage);
   }
   ```

4. **Update Help**
   ```javascript
   // src/handlers/helpHandler.js
   // Add new command to help text
   ```

## Testing Strategy

### Unit Tests (Recommended)
```javascript
// test/services/aiService.test.js
const { generateChatResponse } = require('../../src/services/aiService');

test('generates response from AI', async () => {
  const messages = [{ role: 'user', content: 'Hello' }];
  const response = await generateChatResponse(messages);
  expect(response).toBeDefined();
});
```

### Integration Tests
```javascript
// test/handlers/chatHandler.test.js
const { handleAIChat } = require('../../src/handlers/chatHandler');
// Mock LINE client and test handler
```

## Environment Setup

See `.env.example` for all required environment variables.

## Running the Application

```bash
# Development
npm run dev

# Production
npm start

# Test API connection
npm test
```

## Conclusion

This refactored structure provides:
- 📦 **Better organization**: Clear folder structure
- 🧪 **Easier testing**: Isolated, testable modules
- 🚀 **Faster development**: Quick feature additions
- 🔧 **Simpler maintenance**: Localized changes
- 📚 **Better documentation**: Self-documenting structure
- 👥 **Team-friendly**: Easy onboarding for new developers

The project is now production-ready and follows Node.js best practices!
