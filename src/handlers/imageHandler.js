const { generateImage } = require('../services/imageService');

async function handleImageCommand(client, event, userMessage) {
  const userPrompt = userMessage.substring(7).trim();

  if (!userPrompt) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide a prompt for image generation.',
    });
  }

  try {
    console.log(`🎨 Generating image for prompt: "${userPrompt}"`);

    const imageUrl = await generateImage(userPrompt);
    const replyMessages = [
      {
        type: 'text',
        text: `🎨 Generated: "${userPrompt}"`
      },
      {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      }
    ];

    return client.replyMessage(event.replyToken, replyMessages);
  } catch (error) {
    console.error('❌ Image generation error:', error.message);
    console.error('Error details:', error.response?.data || error);

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '😅 Failed to generate image. Please try again later.',
    });
  }
}

module.exports = { handleImageCommand };
