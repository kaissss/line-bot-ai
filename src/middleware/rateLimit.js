const { RATE_LIMIT } = require('../config/constants');

const userRequestTimestamps = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const timeWindowAgo = now - RATE_LIMIT.TIME_WINDOW;

  if (!userRequestTimestamps.has(userId)) {
    userRequestTimestamps.set(userId, []);
  }

  const timestamps = userRequestTimestamps.get(userId);

  // Remove timestamps older than time window
  const recentTimestamps = timestamps.filter(timestamp => timestamp > timeWindowAgo);

  // Check if user has exceeded rate limit
  if (recentTimestamps.length >= RATE_LIMIT.MAX_REQUESTS) {
    console.log(`⚠️ Rate limit exceeded for user ${userId}`);
    return false;
  }

  // Add current timestamp
  recentTimestamps.push(now);
  userRequestTimestamps.set(userId, recentTimestamps);

  return true;
}

module.exports = { checkRateLimit };
