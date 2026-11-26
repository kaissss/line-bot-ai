const { generateChatResponse } = require('./aiService');
const { CONVERSATION } = require('../config/constants');

/**
 * Per-room chat context:
 * - systemPrompt: room-specific override of CONVERSATION.DEFAULT_SYSTEM_PROMPT (null = default)
 * - summary: compacted memory of older messages
 * - messages: recent user/assistant messages, always committed in pairs
 * - compacting: true while a background compaction runs (one per room at a time)
 */
const contexts = new Map();

const GROUP_CHAT_NOTE = 'This is a LINE group chat. Each user message is prefixed with the sender\'s user ID and display name; '
  + 'keep track of who said what and address people by name when helpful.';

const SUMMARY_INSTRUCTIONS = [
  'You maintain the long-term memory of a chat assistant.',
  'Merge the existing summary and the new messages into one updated summary.',
  'Keep: who the participants are, their names, preferences and facts about them, decisions made, tasks and open questions, and anything needed to continue the conversation naturally.',
  'Drop small talk and details that will not matter later.',
  'Write concise bullet points in the language the conversation uses. Output only the summary.',
].join('\n');

function getContext(roomId) {
  let context = contexts.get(roomId);
  if (!context) {
    context = { systemPrompt: null, summary: '', messages: [], compacting: false };
    contexts.set(roomId, context);
  }
  return context;
}

function countChars(messages) {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

function buildSystemMessage(context, isGroup) {
  const sections = [context.systemPrompt || CONVERSATION.DEFAULT_SYSTEM_PROMPT];
  if (isGroup) {
    sections.push(GROUP_CHAT_NOTE);
  }
  sections.push(`Current time: ${new Date().toString()}`);
  if (context.summary) {
    sections.push(`Summary of the earlier conversation:\n${context.summary}`);
  }
  return { role: 'system', content: sections.join('\n\n') };
}

/** Full prompt for the next reply: system (prompt + summary) + recent messages + new user message. */
function buildPromptMessages(roomId, userEntry, { isGroup }) {
  const context = getContext(roomId);
  return [buildSystemMessage(context, isGroup), ...context.messages, userEntry];
}

/** Commit a finished exchange and compact in the background when the context is too large. */
function recordExchange(roomId, userEntry, assistantContent) {
  const context = getContext(roomId);
  context.messages.push(userEntry, { role: 'assistant', content: assistantContent });

  if (needsCompaction(context)) {
    compactContext(roomId, context);
  }
}

function needsCompaction(context) {
  return context.messages.length > CONVERSATION.MAX_RECENT_MESSAGES
    || countChars(context.messages) > CONVERSATION.MAX_CONTEXT_CHARS;
}

async function summarize(roomId, previousSummary, messages) {
  const transcript = messages
    .map(message => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n');

  const summary = await generateChatResponse([
    { role: 'system', content: SUMMARY_INSTRUCTIONS },
    {
      role: 'user',
      content: `Existing summary:\n${previousSummary || '(none)'}\n\nNew messages:\n${transcript}`,
    },
  ], `${roomId}-compact`, { maxTokens: CONVERSATION.SUMMARY_MAX_TOKENS, temperature: 0.2 });

  return summary.trim();
}

/**
 * Fold all but the last KEEP_RECENT_MESSAGES into the summary. Runs in the background; never throws.
 * If summarization fails, the oldest messages are dropped anyway so the context stays bounded.
 */
async function compactContext(roomId, context) {
  const count = context.messages.length - CONVERSATION.KEEP_RECENT_MESSAGES;
  if (context.compacting || count <= 0) {
    return;
  }

  context.compacting = true;
  // New exchanges are only appended, so the first `count` messages stay stable while awaiting.
  const toCompact = context.messages.slice(0, count);
  try {
    context.summary = await summarize(roomId, context.summary, toCompact);
    console.log(`🗜️ Compacted ${count} messages in room ${roomId} (summary ${context.summary.length} chars)`);
  } catch (error) {
    console.error(`❌ Context compaction failed for room ${roomId}, dropping ${count} oldest messages:`, error.message);
  } finally {
    context.messages.splice(0, count);
    context.compacting = false;
  }
}

function setSystemPrompt(roomId, prompt) {
  getContext(roomId).systemPrompt = prompt || null;
}

function getContextInfo(roomId) {
  const context = contexts.get(roomId);
  return {
    systemPrompt: context?.systemPrompt || CONVERSATION.DEFAULT_SYSTEM_PROMPT,
    isCustomPrompt: Boolean(context?.systemPrompt),
    summary: context?.summary || '',
    messageCount: context?.messages.length || 0,
    charCount: context ? countChars(context.messages) : 0,
  };
}

/** Clear summary and recent messages; the room's custom system prompt is kept. */
function resetContext(roomId) {
  const context = contexts.get(roomId);
  if (!context) {
    return;
  }
  if (context.systemPrompt) {
    contexts.set(roomId, { systemPrompt: context.systemPrompt, summary: '', messages: [], compacting: false });
  } else {
    contexts.delete(roomId);
  }
}

module.exports = {
  buildPromptMessages,
  recordExchange,
  setSystemPrompt,
  getContextInfo,
  resetContext,
};
