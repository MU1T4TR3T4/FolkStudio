const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set DATABASE_URL directly
process.env.DATABASE_URL = 'postgresql://postgres:Mu1t4tr3t%40123@db.ylpddqiojsexncqvwkmc.supabase.co:5432/postgres';

console.log('🔧 Fixing Prisma Client Generation...\n');

// Create a temporary .env file with just DATABASE_URL
const tempEnvContent = `DATABASE_URL="postgresql://postgres:Mu1t4tr3t%40123@db.ylpddqiojsexncqvwkmc.supabase.co:5432/postgres"`;
fs.writeFileSync('.env.temp', tempEnvContent);

try {
    console.log('📦 Generating Prisma Client...');

    // Try to generate using the temp env file
    execSync('npx dotenv -e .env.temp -- prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'postgresql://postgres:Mu1t4tr3t%40123@db.ylpddqiojsexncqvwkmc.supabase.co:5432/postgres' }
    });

    console.log('\n✅ Prisma Client generated successfully!');
} catch (error) {
    console.log('\n⚠️  First attempt failed, trying alternative method...\n');

    try {
        // Alternative: use prisma binary directly
        const prismaBin = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
        execSync(`node "${prismaBin}" generate`, {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: 'postgresql://postgres:Mu1t4tr3t%40123@db.ylpddqiojsexncqvwkmc.supabase.co:5432/postgres' }
        });

        console.log('\n✅ Prisma Client generated successfully!');
    } catch (error2) {
        console.error('\n❌ Failed to generate Prisma Client');
        console.error('Error:', error2.message);
        process.exit(1);
    }
} finally {
    // Clean up temp file
    if (fs.existsSync('.env.temp')) {
        fs.unlinkSync('.env.temp');
    }
}

console.log('\n🚀 Ready to start the application!');
console.log('Run: npm run dev');
