const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient();

    try {
        console.log('Testing database connection...');

        // Test connection by querying users
        const userCount = await prisma.user.count();
        console.log(`✅ Connection successful! Found ${userCount} users.`);

        // Test all tables
        const orderCount = await prisma.order.count();
        const stampCount = await prisma.stamp.count();
        const messageCount = await prisma.message.count();

        console.log(`✅ Orders: ${orderCount}`);
        console.log(`✅ Stamps: ${stampCount}`);
        console.log(`✅ Messages: ${messageCount}`);

        console.log('\n✅ All tables accessible!');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
