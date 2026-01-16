const axios = require('axios');

async function generateImage(prompt) {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    // Call it in advance to trigger generation
    await axios.get(imageUrl, { timeout: 30000 }); // 30 second timeout

    return imageUrl;
  } catch (error) {
    console.error('❌ Error triggering image generation:', error.message);
    // Still return the URL even if pre-fetch fails
    return `https://upload.wikimedia.org/wikipedia/commons/3/3b/Windows_9X_BSOD.png`;
  }
}

module.exports = { generateImage };
