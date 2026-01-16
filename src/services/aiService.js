const groq = require('../config/groq');
const { AI } = require('../config/constants');

async function generateChatResponse(messages) {
  console.log('🤖 Calling Groq AI...');

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
      ...messages
    ],
    model: AI.MODEL,
    temperature: AI.TEMPERATURE,
    max_tokens: AI.MAX_TOKENS,
  });

  const aiResponse = chatCompletion.choices[0].message.content;
  console.log('✅ AI response generated');

  return aiResponse;
}

module.exports = { generateChatResponse };
