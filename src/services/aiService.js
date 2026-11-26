const { randomUUID } = require('crypto');
const groq = require('../config/groq');
const { OPENROUTER_CHAT_COMPLETIONS_URL } = require('../config/openrouter');
const { OPENCODE_CHAT_COMPLETIONS_URL } = require('../config/opencode');
const { AI } = require('../config/constants');

function normalizeProviderError(error, provider) {
  const wrappedError = error instanceof Error ? error : new Error(String(error));
  wrappedError.provider = provider;

  if (!wrappedError.status && wrappedError.response?.status) {
    wrappedError.status = wrappedError.response.status;
  }

  return wrappedError;
}

function emptyResponseError(provider) {
  const error = new Error(`${provider} returned an empty response.`);
  error.code = 'EMPTY_RESPONSE';
  return error;
}

function completionParams(options) {
  return {
    temperature: options.temperature ?? AI.TEMPERATURE,
    max_tokens: options.maxTokens ?? AI.MAX_TOKENS,
  };
}

// `messages` must be the full prompt, including any system message.
async function generateOpenRouterChatResponse(messages, sessionId, options = {}) {
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
        messages,
        model: AI.OPENROUTER_MODEL,
        ...completionParams(options),
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
      throw emptyResponseError('OpenRouter');
    }

    console.log('✅ OpenRouter AI response generated');
    return aiResponse;
  } catch (error) {
    throw normalizeProviderError(error, 'openrouter');
  }
}

async function generateGroqResponse(messages, sessionId, options = {}) {
  console.log('🤖 Calling Groq AI...');

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing.');
    }

    const completion = await groq.chat.completions.create({
      messages,
      model: AI.GROQ_MODEL,
      ...completionParams(options),
    });

    const aiResponse = completion?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw emptyResponseError('Groq');
    }

    console.log('✅ Groq AI response generated');
    return aiResponse;
  } catch (error) {
    throw normalizeProviderError(error, 'groq');
  }
}

async function generateOpencodeResponse(messages, sessionId, options = {}) {
  console.log('🤖 Calling Opencode AI...');

  try {
    const apiKey = process.env.OPENCODE_API_KEY;
    if (!apiKey) {
      throw new Error('OPENCODE_API_KEY is missing.');
    }

    if (typeof fetch !== 'function') {
      throw new Error('Global fetch is not available in this Node.js runtime.');
    }

    const response = await fetch(OPENCODE_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-opencode-session': sessionId || randomUUID(),
      },
      body: JSON.stringify({
        messages,
        model: AI.OPENCODE_MODEL,
        ...completionParams(options),
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      const error = new Error(`Opencode request failed (${response.status}): ${rawError}`);
      error.status = response.status;
      throw error;
    }

    const completion = await response.json();
    console.log('Opencode API response message object:', completion?.choices?.[0]?.message); // Log the message for debugging
    const aiResponse = completion?.choices?.[0]?.message?.content;
    if (!aiResponse) {
      throw emptyResponseError('Opencode');
    }

    console.log('✅ Opencode AI response generated');
    return aiResponse;
  } catch (error) {
    throw normalizeProviderError(error, 'opencode');
  }
}

const PROVIDER_SERVICES = {
  groq: generateGroqResponse,
  openrouter: generateOpenRouterChatResponse,
  opencode: generateOpencodeResponse,
};

async function generateChatResponse(messages, sessionId, options = {}) {
  const providerService = PROVIDER_SERVICES[AI.PROVIDER] || PROVIDER_SERVICES.groq;
  return providerService(messages, sessionId, options);
}

module.exports = {
  generateChatResponse,
  generateOpenRouterChatResponse,
  generateGroqResponse,
  generateOpencodeResponse,
};
