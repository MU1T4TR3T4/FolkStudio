const dotenv = require('dotenv');
const Replicate = require("replicate");
const fs = require('fs');

// Tenta carregar .env.local
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
}

// Tenta carregar .env (se não sobrescrever, ou complementar)
if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

async function testReplicate() {
    console.log("Testing Replicate API connection...");

    if (!process.env.REPLICATE_API_TOKEN) {
        console.error("❌ Error: REPLICATE_API_TOKEN not found in process.env");
        console.log("Checked .env.local and .env");
        process.exit(1);
    }

    try {
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        console.log("Token found. Attempting to generate a test image...");

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "A futuristic t-shirt design, neon colors, dark background",
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 80,
                }
            }
        );

        console.log("✅ Replicate Test Success!");
        console.log("Output:", output);

    } catch (error) {
        console.error("❌ Replicate Test Failed:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testReplicate();
