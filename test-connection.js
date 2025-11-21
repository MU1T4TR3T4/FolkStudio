const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting...");
        await prisma.$connect();
        console.log("Connected successfully!");
    } catch (e) {
        console.error("Connection failed:", e);
        fs.writeFileSync('connection_error.log', JSON.stringify(e, null, 2) + "\n" + e.toString());
    } finally {
        await prisma.$disconnect();
    }
}

main();
