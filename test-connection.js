const { PrismaClient } = require('@prisma/client');
const Replicate = require("replicate");
const fs = require('fs');
const dotenv = require('dotenv');

// Load envs
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
    console.log("=== Starting System Check ===\n");

    // 1. Test Database
    try {
        console.log("1. Testing Database Connection...");
        await prisma.$connect();
        console.log("✅ Database Connected successfully!\n");
    } catch (e) {
        console.error("❌ Database Connection failed:", e.message);
        fs.writeFileSync('connection_error.log', JSON.stringify(e, null, 2) + "\n" + e.toString());
    } finally {
        await prisma.$disconnect();
    }

    // 2. Test Replicate
    try {
        console.log("2. Testing Replicate API...");
        if (!process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN === "CHANGE_ME") {
            throw new Error("REPLICATE_API_TOKEN is missing or set to placeholder 'CHANGE_ME'.");
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        console.log("   Token found. Attempting generation...");

        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "Test image",
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 80,
                }
            }
        );
        console.log("✅ Replicate API is working!");
        console.log("   Output:", output, "\n");
    } catch (e) {
        console.error("❌ Replicate Test Failed:", e.message);
        console.log("   Please check REPLICATE_API_TOKEN in .env.local\n");
    }

    console.log("=== System Check Complete ===");
}

main();
