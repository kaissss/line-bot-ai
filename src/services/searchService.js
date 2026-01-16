const axios = require('axios');

async function searchGoogle(query, numResults = 3) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CX;

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error('Google API credentials not configured');
  }

  console.log(`🔍 Searching Google for: "${query}"`);

  const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: query,
      num: numResults
    },
    timeout: 10000 // 10 second timeout
  });

  return response.data.items || [];
}

module.exports = { searchGoogle };
