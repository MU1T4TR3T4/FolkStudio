import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.$connect();
        console.log("Connected successfully!");
    } catch (e: any) {
        console.error("Connection failed:", e);
        fs.writeFileSync('connection_error.log', JSON.stringify(e, null, 2) + "\n" + e.toString());
    } finally {
        await prisma.$disconnect();
    }
}
main();
