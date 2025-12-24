// test-groq.js
require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  console.log('🧪 Testing Groq...\n');
  
  const start = Date.now();
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: 'Say hello!' }],
    model: 'llama-3.3-70b-versatile',
  });
  const elapsed = Date.now() - start;
  
  console.log('✅ Response:', completion.choices[0].message.content);
  console.log(`⚡ Speed: ${elapsed}ms`);
}

testGroq();