const fs = require('fs');
const path = require('path');

// Credentials
const ACCESS_TOKEN = 'sbp_855cc20c9c1a9cd6824c4386201df60e6c3a4b97';
const PROJECT_REF = 'ihrxhuyjhdesgadpowus';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`;

async function deployViaApi() {
    console.log('Deploying schema via Supabase Management API...');

    try {
        const schemaPath = path.join(__dirname, '../src/lib/supabase/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log(`Reading SQL from ${schemaPath} (${sql.length} bytes)`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Schema deployment successful!');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Deployment Failed:', error);
        process.exit(1);
    }
}

deployViaApi();
