const Replicate = require("replicate");
const fs = require('fs');
const dotenv = require('dotenv');

// Load envs
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });

async function main() {
    console.log("=== Testing Replicate API Only ===\n");

    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error("REPLICATE_API_TOKEN is missing.");
        }

        const token = process.env.REPLICATE_API_TOKEN;
        console.log(`Token loaded: ${token.substring(0, 4)}...${token.substring(token.length - 4)}`);

        const replicate = new Replicate({
            auth: token,
        });

        console.log("Attempting generation...");

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "A simple red circle on white background",
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 80,
                }
            }
        );

        const resultMsg = `✅ Replicate API is working!\nOutput: ${JSON.stringify(output)}`;
        console.log(resultMsg);
        fs.writeFileSync('replicate_result.txt', resultMsg);

    } catch (e) {
        const errorMsg = `❌ Replicate Test Failed: ${e.message}`;
        console.error(errorMsg);
        if (e.response) {
            console.error("   Status:", e.response.status);
        }
        fs.writeFileSync('replicate_result.txt', errorMsg);
    }
}

main();
