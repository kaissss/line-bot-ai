require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');
const lineConfig = require('./config/line');
const { getBotInfo } = require('./utils/botInfo');
const { handleEvent } = require('./handlers/eventHandler');

const app = express();

// Serve static files (CSS, etc.)
app.use('/css', express.static(path.join(__dirname, 'views', 'css')));

// Initialize bot info on startup
getBotInfo();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Production webhook with signature validation
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  console.log('📨 Webhook received');

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test webhook without signature validation (for Postman/local testing)
app.post('/webhook/test', express.json(), async (req, res) => {
  console.log('🧪 Test webhook received');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).json({ success: true, message: 'Test webhook processed' });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
