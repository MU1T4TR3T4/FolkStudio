// Custom Prisma generate script that bypasses dotenv issues
process.env.DATABASE_URL = 'postgresql://postgres:Mu1t4tr3t%40123@db.ylpddqiojsexncqvwkmc.supabase.co:5432/postgres';

const { exec } = require('child_process');
const path = require('path');

console.log('Setting DATABASE_URL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prismaPath = path.join(__dirname, 'node_modules', '.bin', 'prisma');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

console.log('Generating Prisma Client...');

exec(`"${prismaPath}" generate --schema="${schemaPath}"`, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error.message);
        console.error('stderr:', stderr);
        process.exit(1);
    }
    console.log(stdout);
    console.log('✅ Prisma Client generated successfully!');
});
