const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Credentials provided by user
const DB_PASSWORD = 'Lucido2026*';
const PROJECT_ID = 'ihrxhuyjhdesgadpowus';

// Try standard direct connection first (Port 5432)
// Regional sub-domain for us-east-2 (Ohio) is often needed instead of pooler for some management tasks
const DB_URL = `postgres://postgres:${DB_PASSWORD}@db.ihrxhuyjhdesgadpowus.supabase.co:5432/postgres`;

// Backup: Pooler Transaction (Port 6543)
// const DB_URL = `postgres://postgres.ihrxhuyjhdesgadpowus:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true`;

// Direct Connection (Port 5432) - Use this if pooler fails
// const DB_URL = `postgres://postgres.ihrxhuyjhdesgadpowus:${DB_PASSWORD}@aws-0-us-east-2.pooler.supabase.com:5432/postgres`;

async function deploy() {
    console.log('Deploying schema to Supabase...');

    try {
        const sql = postgres(DB_URL);

        const schemaPath = path.join(__dirname, '../src/lib/supabase/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Read schema file from:', schemaPath);

        await sql.unsafe(schema);

        console.log('Schema deployed successfully!');
        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('Error deploying schema:', error);
        process.exit(1);
    }
}

deploy();
