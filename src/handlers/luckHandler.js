function hashString(input) {
  let hash = 5381;

  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function toDailySeed(userId, topic = '') {
  const today = new Date().toISOString().slice(0, 10);
  return hashString(`${today}:${userId}:${topic}`);
}

function pickFromSeed(seed, list, offset = 0) {
  return list[(seed + offset) % list.length];
}

function scoreFromSeed(seed, min, max, offset = 0) {
  const range = max - min + 1;
  return min + ((seed + offset) % range);
}

function parseTopic(userMessage) {
  const text = userMessage.trim();

  if (text.toLowerCase().startsWith('/luck')) {
    return text.slice(5).trim();
  }

  return '';
}

function buildFortuneMessage(userId, userMessage) {
  const topic = parseTopic(userMessage);
  const seed = toDailySeed(userId, topic);

  const fortuneLevels = [
    { title: '大吉', vibe: '今天磁場很順，適合主動出擊。' },
    { title: '中吉', vibe: '整體運勢穩定，按計畫走就會有收穫。' },
    { title: '小吉', vibe: '有小驚喜，保持耐心會更順。' },
    { title: '平', vibe: '平穩的一天，先把基本盤顧好。' },
    { title: '小凶', vibe: '容易卡關，建議慢一點、少衝動。' },
    { title: '大凶', vibe: '今天不宜硬拼，先避開風險。' },
  ];

  const luckyColors = ['紅色', '藍色', '綠色', '黃色', '黑色', '白色', '橘色', '紫色'];
  const luckyActions = ['整理桌面', '先做最難的事', '早點回訊息', '散步 10 分鐘', '喝一杯水', '少滑手機 30 分鐘'];

  const fortune = pickFromSeed(seed, fortuneLevels);
  const luckyColor = pickFromSeed(seed, luckyColors, 11);
  const luckyAction = pickFromSeed(seed, luckyActions, 23);

  const overall = scoreFromSeed(seed, 40, 99, 7);
  const love = scoreFromSeed(seed, 30, 99, 13);
  const work = scoreFromSeed(seed, 30, 99, 17);
  const wealth = scoreFromSeed(seed, 30, 99, 19);
  const health = scoreFromSeed(seed, 30, 99, 29);
  const luckyNumber = scoreFromSeed(seed, 1, 99, 31);

  const title = topic ? `🔮 今日運勢（${topic}）` : '🔮 今日運勢';

  return [
    title,
    '',
    `吉凶：${fortune.title}`,
    `整體：${fortune.vibe}`,
    '',
    `總運：${overall}/100`,
    `感情：${love}/100`,
    `事業：${work}/100`,
    `財運：${wealth}/100`,
    `健康：${health}/100`,
    '',
    `幸運色：${luckyColor}`,
    `幸運數字：${luckyNumber}`,
    `開運行動：${luckyAction}`,
    '',
    '（同一帳號每天結果固定，明天再抽會更新）',
  ].join('\n');
}

function handleLuckCommand(client, event, userId, userMessage) {
  const text = buildFortuneMessage(userId, userMessage);

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text,
  });
}

module.exports = { handleLuckCommand };