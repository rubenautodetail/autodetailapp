import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createApiClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
            try {
                const Stripe = (await import('stripe')).default;
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

                const account = await stripe.accounts.create({ type: 'express' });

                const supabase = createApiClient();
                await supabase
                    .from('profiles')
                    .update({ stripe_account_id: account.id } as any)
                    .eq('id', user.id);

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const accountLink = await stripe.accountLinks.create({
                    account: account.id,
                    refresh_url: `${appUrl}/en/contractor/settings`,
                    return_url: `${appUrl}/en/contractor/settings?onboarding=complete`,
                    type: 'account_onboarding',
                });

                return NextResponse.json({ success: true, url: accountLink.url });
            } catch (stripeError) {
                console.error('Stripe onboarding error:', stripeError);
            }
        }

        return NextResponse.json({
            success: true,
            url: '/en/contractor/settings?onboarding=pending',
        });
    } catch (error) {
        console.error('Onboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
