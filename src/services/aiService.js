const groq = require('../config/groq');
const { OPENROUTER_CHAT_COMPLETIONS_URL } = require('../config/openrouter');
const { AI } = require('../config/constants');

async function generateOpenRouterChatResponse(messages) {
  console.log('🤖 Calling OpenRouter AI...');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available in this Node.js runtime.');
  }

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
      'X-OpenRouter-Title': process.env.OPENROUTER_APP_NAME || 'line-bot-ai',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
        ...messages,
      ],
      model: AI.OPENROUTER_MODEL
    }),
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(`OpenRouter request failed (${response.status}): ${rawError}`);
  }

  const chatCompletion = await response.json();

  const aiResponse = chatCompletion?.choices?.[0]?.message?.content;
  if (!aiResponse) {
    throw new Error('OpenRouter returned an empty response.');
  }

  console.log('✅ OpenRouter AI response generated');

  return aiResponse;
}

// Legacy Groq function is intentionally kept but unused in the main flow.
async function generateGroqResponseLegacy(messages) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
      ...messages,
    ],
    model: AI.GROQ_MODEL,
    temperature: AI.TEMPERATURE,
    max_tokens: AI.MAX_TOKENS,
  });

  const aiResponse = chatCompletion.choices[0].message.content;
  return aiResponse;
}

module.exports = {
  generateChatResponse: generateOpenRouterChatResponse,
  generateOpenRouterChatResponse,
  generateGroqResponseLegacy,
};
