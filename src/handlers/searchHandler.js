const { searchGoogle } = require('../services/searchService');
const { SEARCH } = require('../config/constants');

async function handleGoogleCommand(client, event, userMessage) {
  const args = userMessage.substring(8).trim();
  let searchQuery = args;
  let num = SEARCH.DEFAULT_RESULTS;

  // Check for -n flag
  const nFlagMatch = args.match(/-n\s+(\d+)/);
  if (nFlagMatch) {
    num = parseInt(nFlagMatch[1], 10);
    num = Math.min(Math.max(num, 1), SEARCH.MAX_RESULTS); // clamp between 1-10
    searchQuery = args.replace(/-n\s+\d+/, '').trim();
  }

  if (!searchQuery) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Please provide a search query.',
    });
  }

  try {
    const results = await searchGoogle(searchQuery, num);

    if (results && results.length > 0) {
      let resultText = `🔍 Search results for "${searchQuery}":\n\n`;

      results.forEach((item, index) => {
        resultText += `${index + 1}. ${item.title}\n${item.link}\n${item.snippet}\n\n`;
      });

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: resultText.trim(),
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '🤷 No results found for your search.',
      });
    }
  } catch (error) {
    console.error('❌ Google search error:', error.message);

    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }

    let errorMessage = '😅 Failed to perform search. Please try again later.';

    if (error.message.includes('credentials not configured')) {
      errorMessage = '⚙️ Google search is not configured properly.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = '⏱️ Search timed out. Please try again.';
    }

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: errorMessage,
    });
  }
}

module.exports = { handleGoogleCommand };
