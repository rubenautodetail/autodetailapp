// Native fetch is available in Node 18+

// Credentials
const ACCESS_TOKEN = 'sbp_855cc20c9c1a9cd6824c4386201df60e6c3a4b97';
const PROJECT_REF = 'ihrxhuyjhdesgadpowus';
const NEW_PASSWORD = 'RubensAuto2026!secure'; // Strong password

async function resetPassword() {
    console.log('Resetting Supabase Database Password...');

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/database`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ password: NEW_PASSWORD })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        console.log('Password reset successfully!');
        // No response body for this endpoint usually
    } catch (error) {
        console.error('Password Reset Failed:', error);
        process.exit(1);
    }
}

resetPassword();
