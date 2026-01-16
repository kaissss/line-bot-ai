function handleHelpCommand(client, event, userMessage) {
  const helpArg = userMessage.substring(5).trim().toLowerCase();

  // Detailed help for specific commands
  if (helpArg === '/image' || helpArg === 'image') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: [
        '🎨 IMAGE GENERATION',
        '',
        'Usage: /image <prompt>',
        '',
        'Generate AI images from text descriptions.',
        '',
        'Examples:',
        '  /image a beautiful sunset',
        '  /image cyberpunk city at night',
        '  /image cute cat wearing glasses',
        '',
        'Powered by Pollinations.ai'
      ].join('\n'),
    });
  }

  if (helpArg === '/google' || helpArg === 'google') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: [
        '🔍 GOOGLE SEARCH',
        '',
        'Usage: /google [-n <num>] <query>',
        '',
        'Search Google and get results.',
        '',
        'Options:',
        '  -n <num>  Number of results (1-10, default: 3)',
        '',
        'Examples:',
        '  /google latest AI news',
        '  /google -n 5 best restaurants',
        '  /google weather Tokyo',
      ].join('\n'),
    });
  }

  if (helpArg === '/tts' || helpArg === 'tts') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: [
        '🎙️ TEXT TO SPEECH',
        '',
        'Usage: /tts [-v <voice>] [-l <lang>] <text>',
        '',
        'Convert text to speech audio.',
        '',
        'Options:',
        '  -v <voice>  Voice name (default: henry)',
        '  -l <lang>   Language code',
        '',
        'Popular voices:',
        '  henry, mrbeast, snoop, morgan',
        '',
        'Languages:',
        '  en (English), zh-CN (Chinese)',
        '  ja-JP (Japanese), ko-KR (Korean)',
        '  es-ES (Spanish), fr-FR (French)',
        '  de-DE (German), pt-BR (Portuguese)',
        '',
        'Examples:',
        '  /tts Hello world',
        '  /tts -v mrbeast Hey everyone!',
        '  /tts -l zh-CN 你好世界',
        '  /tts -v snoop -l en What\'s up',
      ].join('\n'),
    });
  }

  if (helpArg === '/reset' || helpArg === 'reset') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: [
        '🔄 RESET CONVERSATION',
        '',
        'Usage: /reset',
        '',
        'Clear the conversation history for AI chat.',
        'Use this to start a fresh conversation.',
      ].join('\n'),
    });
  }

  // General help (default)
  const helpText = [
    '🤖 BOT COMMANDS',
    '',
    '/image - Generate AI images',
    '/google - Search Google',
    '/tts - Text to speech',
    '/reset - Clear chat history',
    '/help - Show this message',
    '',
    'ℹ️ For detailed help, use:',
    '/help/image, /help/google, /help/tts',
    '',
    '💡 In groups, mention me to chat!'
  ].join('\n');

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: helpText,
  });
}

module.exports = { handleHelpCommand };
