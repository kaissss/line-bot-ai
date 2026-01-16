const axios = require('axios');

async function generateSpeechifyTTS(text, voice = 'henry', language = null) {
  const SPEECHIFY_API_KEY = process.env.SPEECHIFY_API_KEY;

  if (!SPEECHIFY_API_KEY) {
    throw new Error('Speechify API key not configured');
  }

  console.log(`🎙️ Generating TTS with Speechify for text: "${text.substring(0, 50)}..."`);

  const requestBody = {
    input: text,
    voice_id: voice,
    audio_format: 'mp3'
  };

  // Add language if specified
  if (language) {
    requestBody.language = language;
  }

  const response = await axios.post(
    'https://api.sws.speechify.com/v1/audio/speech',
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${SPEECHIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    }
  );

  return response.data.audio_data; // base64 string
}

module.exports = { generateSpeechifyTTS };
