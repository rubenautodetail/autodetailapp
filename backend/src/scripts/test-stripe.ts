/**
 * Test script to verify Stripe integration
 * Run with: npm run test:stripe
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import stripe, { createConnectedAccount, createPaymentIntent } from '../services/stripe';

async function testStripeConnection() {
    console.log('🧪 Testing Stripe Connection...\n');

    try {
        // Test 1: Verify API key works
        console.log('Test 1: Verifying Stripe API key...');
        const balance = await stripe.balance.retrieve();
        console.log('✅ Stripe API key is valid!');
        console.log(`   Available balance: $${(balance.available[0]?.amount || 0) / 100}`);
        console.log(`   Pending balance: $${(balance.pending[0]?.amount || 0) / 100}\n`);

        // Test 2: Create a test connected account
        console.log('Test 2: Creating test contractor account...');
        const testAccount = await createConnectedAccount(
            'test-contractor@example.com',
            'US'
        );
        console.log('✅ Test contractor account created!');
        console.log(`   Account ID: ${testAccount.id}`);
        console.log(`   Email: ${testAccount.email}`);
        console.log(`   Charges enabled: ${testAccount.charges_enabled}`);
        console.log(`   Payouts enabled: ${testAccount.payouts_enabled}\n`);

        // Test 3: Create a test payment intent
        console.log('Test 3: Creating test payment intent...');
        const testPayment = await createPaymentIntent(
            22500, // $225.00
            testAccount.id,
            {
                bookingId: 'test_booking_123',
                customerId: 'test_customer_456',
                contractorId: 'test_contractor_789',
                service: 'full-detail',
            }
        );
        console.log('✅ Test payment intent created!');
        console.log(`   Payment Intent ID: ${testPayment.id}`);
        console.log(`   Client Secret: ${testPayment.client_secret}`);
        console.log(`   Status: ${testPayment.status}\n`);

        // Test 4: Clean up test account
        console.log('Test 4: Cleaning up test account...');
        await stripe.accounts.del(testAccount.id);
        console.log('✅ Test account deleted\n');

        console.log('🎉 All Stripe tests passed!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Set up webhook endpoint in Stripe Dashboard');
        console.log('   2. Add STRIPE_WEBHOOK_SECRET to .env');
        console.log('   3. Enable Stripe Connect and get STRIPE_CONNECT_CLIENT_ID');
        console.log('   4. Start implementing payment flow in your app\n');

    } catch (error: any) {
        console.error('❌ Stripe test failed:', error.message);
        console.error('\n🔍 Troubleshooting:');
        console.error('   - Check that STRIPE_SECRET_KEY is set in backend/.env');
        console.error('   - Verify you\'re using test mode keys (sk_test_...)');
        console.error('   - Make sure Stripe package is installed: npm install stripe');
        process.exit(1);
    }
}

// Run tests
testStripeConnection();
