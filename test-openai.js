// Test script to verify OpenAI API key
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
    try {
        console.log('Testing OpenAI API...');
        console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
        console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say hello!" }
            ],
            max_tokens: 50,
        });

        console.log('Success! Response:', completion.choices[0]?.message?.content);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Error details:', error);
    }
}

testOpenAI();
