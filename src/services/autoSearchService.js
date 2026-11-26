const { generateChatResponse } = require('./aiService');
const { searchGoogle } = require('./searchService');
const { describeHistory } = require('./contextService');
const { SEARCH } = require('../config/constants');

const DECISION_INSTRUCTIONS = [
  'You are the routing step of a chat assistant. Decide whether the assistant can answer the latest message correctly WITHOUT a web search.',
  'Be honest about the limits of your knowledge: a confident wrong answer is much worse than a search. Models often think they know internet slang but get its meaning wrong.',
  'Search IS needed when the latest message:',
  '- asks what a word, phrase, slang, meme, abbreviation or term means (unless it is an everyday dictionary word);',
  '- contains internet slang, memes, buzzwords, neologisms, puns or colloquial expressions (e.g. Chinese/Taiwanese internet slang), names, products or events whose real meaning may differ from the literal reading, unless you are certain of the meaning;',
  '- asks about recent or time-sensitive facts (news, prices, weather, schedules, releases, scores, anything that may have changed after your training data);',
  '- asks for specific facts (numbers, dates, specs, quotes, people, places) you are not confident about.',
  'Search is NOT needed for greetings, small talk, opinions, creative writing, translation of plain text, math, coding, well-known general knowledge, or things answered by the conversation itself.',
  'When in doubt, search.',
  'Reply with compact JSON only, no other text:',
  '{"asksMeaning": <true if the message asks what a word, phrase, slang, meme, abbreviation or term means/refers to>,'
    + ' "slang": [<internet slang, memes, buzzwords, abbreviations or niche names in the message, even ones you think you know; [] if none>],'
    + ' "confidence": <0.0-1.0, how sure you are that you understand the message and know the facts needed to answer>, "search": <true|false>,'
    + ' "query": "<concise, self-contained Google query; resolve references from the conversation; use the language that gives the best results>"}',
  'Always fill "query", even when "search" is false.',
].join('\n');

function isAutoSearchEnabled() {
  return SEARCH.AUTO_SEARCH_ENABLED && Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CX);
}

/** Returns the search query, or null when the AI can answer on its own. Throws on unparseable output. */
function parseDecision(raw) {
  const json = raw.match(/\{[\s\S]*\}/);
  if (!json) {
    throw new Error(`no JSON in decision: ${raw}`);
  }
  const decision = JSON.parse(json[0]);
  const query = typeof decision.query === 'string' ? decision.query.trim() : '';
  const confidence = typeof decision.confidence === 'number' ? decision.confidence : 0;
  const slang = Array.isArray(decision.slang) ? decision.slang : [];
  console.log(`🧠 Search decision: search=${decision.search} asksMeaning=${decision.asksMeaning} confidence=${confidence} slang=${JSON.stringify(slang)}`);
  // Models overrate what they know (especially slang), so these observable signals force a search even if it said no.
  const needsSearch = decision.search === true
    || decision.asksMeaning === true
    || slang.length > 0
    || confidence < SEARCH.DECISION_MIN_CONFIDENCE;
  return needsSearch && query ? query : null;
}

async function decideSearchQuery(roomId, userContent) {
  const history = describeHistory(roomId, SEARCH.DECISION_HISTORY_MESSAGES);
  const raw = await generateChatResponse([
    { role: 'system', content: `${DECISION_INSTRUCTIONS}\n\nCurrent time: ${new Date().toString()}` },
    { role: 'user', content: `${history ? `${history}\n\n` : ''}Latest message:\n${userContent}` },
  ], `${roomId}-search-decision`, { maxTokens: SEARCH.DECISION_MAX_TOKENS, temperature: 0 });
  return parseDecision(raw);
}

function formatResults(query, items) {
  if (items.length === 0) {
    return `[Google search for "${query}" returned no results. If you still don't know the answer, say so instead of guessing.]`;
  }
  const lines = items.map((item, index) => `${index + 1}. ${item.title}\n${item.snippet || ''}\n${item.link}`);
  return [
    `[Google search results for "${query}". Use them to understand and answer the message above; ignore irrelevant results,`
      + ' do not invent facts beyond them. If you cite a source, write its plain URL (no markdown links or citation markers).]',
    ...lines,
  ].join('\n\n');
}

/**
 * Ask the AI whether it can answer the message by itself; if not, search Google.
 * Resolves to search-result text to attach to this turn's prompt, or null.
 * Never throws: any failure means answering without search.
 */
async function findSearchContext(roomId, userContent) {
  if (!isAutoSearchEnabled()) {
    return null;
  }

  let query;
  try {
    query = await decideSearchQuery(roomId, userContent);
  } catch (error) {
    console.error('⚠️ Search decision failed, answering without search:', error.message);
    return null;
  }

  if (!query) {
    console.log('🧠 AI can answer without search');
    return null;
  }

  try {
    const items = await searchGoogle(query, SEARCH.AUTO_SEARCH_RESULTS);
    console.log(`🔍 Auto search "${query}": ${items.length} results`);
    return formatResults(query, items);
  } catch (error) {
    console.error('⚠️ Auto search failed, answering without search:', error.message);
    return null;
  }
}

module.exports = { findSearchContext };
