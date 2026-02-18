const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ihrxhuyjhdesgadpowus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8gWSWksG23E3in30-Buoyg_SULYJdUm';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    console.log('Checking for tables in Supabase...');

    const tables = ['profiles', 'vehicles', 'services', 'bookings'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`Table "${table}" - Error:`, error.message);
            } else {
                console.log(`Table "${table}" - EXISTS (Data found: ${data.length > 0 ? 'Yes' : 'No'})`);
            }
        } catch (err) {
            console.error(`Table "${table}" - Unexpected error:`, err.message);
        }
    }
}

checkTables();
