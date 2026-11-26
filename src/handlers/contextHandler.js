const {
  setSystemPrompt,
  getContextInfo,
  resetContext,
} = require('../services/contextService');
const { CONVERSATION } = require('../config/constants');

const PREVIEW_LENGTH = 1500;

function reply(client, event, text) {
  return client.replyMessage(event.replyToken, { type: 'text', text });
}

function preview(text) {
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

function handleResetCommand(client, event, roomId) {
  resetContext(roomId);
  console.log(`🔄 Chat reset in room ${roomId}`);
  return reply(client, event, '🔄 Conversation history cleared!');
}

/** /system | /system <prompt> | /system reset */
function handleSystemCommand(client, event, roomId, userMessage) {
  const arg = userMessage.substring('/system'.length).trim();

  if (!arg) {
    const info = getContextInfo(roomId);
    return reply(client, event, [
      `🧠 SYSTEM PROMPT (${info.isCustomPrompt ? 'custom' : 'default'})`,
      '',
      preview(info.systemPrompt),
    ].join('\n'));
  }

  if (arg.toLowerCase() === 'reset') {
    setSystemPrompt(roomId, null);
    return reply(client, event, '🧠 System prompt restored to default.');
  }

  if (arg.length > CONVERSATION.MAX_SYSTEM_PROMPT_LENGTH) {
    return reply(client, event, `⚠️ System prompt too long (${arg.length}/${CONVERSATION.MAX_SYSTEM_PROMPT_LENGTH} chars).`);
  }

  setSystemPrompt(roomId, arg);
  return reply(client, event, '🧠 System prompt updated for this chat.');
}

function handleContextCommand(client, event, roomId) {
  const info = getContextInfo(roomId);
  return reply(client, event, [
    '📋 CHAT CONTEXT',
    '',
    `System prompt: ${info.isCustomPrompt ? 'custom' : 'default'}`,
    `Recent messages: ${info.messageCount}/${CONVERSATION.MAX_RECENT_MESSAGES} (${info.charCount} chars)`,
    '',
    '📝 Summary:',
    info.summary ? preview(info.summary) : '(empty)',
  ].join('\n'));
}

module.exports = {
  handleResetCommand,
  handleSystemCommand,
  handleContextCommand,
};
