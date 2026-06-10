const groq = require('../config/groq');
const { OPENROUTER_CHAT_COMPLETIONS_URL } = require('../config/openrouter');
const { AI } = require('../config/constants');

function normalizeProviderError(error, provider) {
  const wrappedError = error instanceof Error ? error : new Error(String(error));
  wrappedError.provider = provider;

  if (!wrappedError.status && wrappedError.response?.status) {
    wrappedError.status = wrappedError.response.status;
  }

  return wrappedError;
}

async function generateOpenRouterChatResponse(messages) {
  console.log('🤖 Calling OpenRouter AI...');

  try {
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
        model: AI.OPENROUTER_MODEL,
        temperature: AI.TEMPERATURE,
        max_tokens: AI.MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      const error = new Error(`OpenRouter request failed (${response.status}): ${rawError}`);
      error.status = response.status;
      throw error;
    }

    const completion = await response.json();
    const aiResponse = completion?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('OpenRouter returned an empty response.');
    }

    console.log('✅ OpenRouter AI response generated');
    return aiResponse;
  } catch (error) {
    throw normalizeProviderError(error, 'openrouter');
  }
}

async function generateGroqResponse(messages) {
  console.log('🤖 Calling Groq AI...');

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing.');
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses concise and friendly.' },
        ...messages,
      ],
      model: AI.GROQ_MODEL,
      temperature: AI.TEMPERATURE,
      max_tokens: AI.MAX_TOKENS,
    });

    const aiResponse = completion?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Groq returned an empty response.');
    }

    console.log('✅ Groq AI response generated');
    return aiResponse;
  } catch (error) {
    throw normalizeProviderError(error, 'groq');
  }
}

const PROVIDER_SERVICES = {
  groq: generateGroqResponse,
  openrouter: generateOpenRouterChatResponse,
};

async function generateChatResponse(messages) {
  const providerService = PROVIDER_SERVICES[AI.PROVIDER] || PROVIDER_SERVICES.groq;
  return providerService(messages);
}

module.exports = {
  generateChatResponse,
  generateOpenRouterChatResponse,
  generateGroqResponse,
};
