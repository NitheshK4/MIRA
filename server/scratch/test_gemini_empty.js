require('dotenv').config({ path: '/Users/nitheshkumar/Documents/acie/.env' });
const db = require('/Users/nitheshkumar/Documents/acie/server/src/db');
const axios = require('axios');

async function testGemini(oldText, newText, apiKey) {
  const systemPrompt = `You are a text change detector.`;
  const userPrompt = `Test`;
  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  await testGemini("", "test", apiKey);
}

run().then(() => process.exit(0));
