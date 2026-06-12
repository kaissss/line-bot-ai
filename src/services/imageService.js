const axios = require('axios');

async function generateImage(prompt) {
  try {
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (!apiKey) {
      throw new Error('POLLINATIONS_API_KEY is missing.');
    }

    const model = process.env.POLLINATIONS_MODEL || 'flux';
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=${model}&width=1024&height=1024&seed=0&key=${apiKey}`;

    // Trigger generation by calling the URL
    await axios.get(imageUrl, { timeout: 60000 }); // 60 second timeout for new endpoint

    return imageUrl;
  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    throw error;
  }
}

module.exports = { generateImage };
