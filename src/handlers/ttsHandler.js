const { generateSpeechifyTTS } = require('../services/ttsService');
const { uploadAudioToGCS } = require('../utils/uploadUtils');
const { TTS } = require('../config/constants');

async function handleTTSCommand(client, event, userMessage) {
  let args = userMessage.substring(5).trim();
  let voice = TTS.DEFAULT_VOICE;
  let language = null;
  let text = args;

  // Check for -v flag (voice)
  const vFlagMatch = args.match(/-v\s+(\S+)/);
  if (vFlagMatch) {
    voice = vFlagMatch[1];
    text = text.replace(/-v\s+\S+/, '').trim();
  }

  // Check for -l flag (language)
  const lFlagMatch = args.match(/-l\s+(\S+)/);
  if (lFlagMatch) {
    language = lFlagMatch[1];
    text = text.replace(/-l\s+\S+/, '').trim();
  }

  if (!text) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide text to convert to speech. Usage: /tts [-v voice] [-l lang] <text>',
    });
  }

  try {
    const voiceInfo = language ? `${voice}, ${language}` : voice;
    console.log(`🎙️ Converting text to speech with voice "${voice}"${language ? ` and language "${language}"` : ''}: "${text}"`);

    // Send initial message
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `🎙️ Generating speech (${voiceInfo})... Please wait.`,
    });

    // Generate TTS audio
    const base64Audio = await generateSpeechifyTTS(text, voice, language);

    // Upload to Google Cloud Storage
    const audioUrl = await uploadAudioToGCS(base64Audio);

    // Calculate duration (estimate based on text length)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / TTS.ESTIMATED_WPM) * 60 * 1000);

    // Send audio message to LINE
    const targetId = event.source.groupId || event.source.roomId || event.source.userId;
    return client.pushMessage(targetId, {
      type: 'audio',
      originalContentUrl: audioUrl,
      duration: estimatedDuration
    });

  } catch (error) {
    console.error('❌ TTS generation error:', error.message);

    let errorMessage = '😅 Failed to generate speech. Please try again later.';

    if (error.message.includes('API key not configured')) {
      errorMessage = '⚙️ Speechify TTS is not configured properly.';
    } else if (error.message.includes('Cloudinary') || error.message.includes('Google Cloud Storage')) {
      errorMessage = '☁️ Failed to upload audio. Please check cloud storage configuration.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ TTS generation timed out. Please try again.';
    } else if (error.response?.status === 401) {
      errorMessage = '🔐 Invalid API key.';
    } else if (error.response?.status === 429) {
      errorMessage = '🚦 Rate limit exceeded. Please try again in a moment.';
    }

    const targetId = event.source.userId || event.source.groupId || event.source.roomId;
    return client.pushMessage(targetId, {
      type: 'text',
      text: errorMessage,
    });
  }
}

module.exports = { handleTTSCommand };
