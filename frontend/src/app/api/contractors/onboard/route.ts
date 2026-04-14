import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseCheck = createServiceClient();
        const { data: approvalCheck } = await supabaseCheck
            .from('profiles')
            .select('approval_status')
            .eq('id', user.id)
            .single();
        if ((approvalCheck as { approval_status: string | null } | null)?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
            try {
                const Stripe = (await import('stripe')).default;
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

                const supabase = createServiceClient();

                // Check if contractor already has a Stripe account
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('stripe_account_id')
                    .eq('id', user.id)
                    .single();

                let accountId = (profile as { stripe_account_id: string | null } | null)?.stripe_account_id ?? null;

                if (!accountId) {
                    // Create new Express account
                    const account = await stripe.accounts.create({ type: 'express' });
                    accountId = account.id;

                    await supabase
                        .from('profiles')
                        .update({ stripe_account_id: accountId })
                        .eq('id', user.id);
                } else {
                    // Verify the stored account still exists in Stripe (could be stale from test→live switch)
                    try {
                        await stripe.accounts.retrieve(accountId);
                    } catch {
                        // Account doesn't exist — create a fresh one
                        const account = await stripe.accounts.create({ type: 'express' });
                        accountId = account.id;
                        await supabase
                            .from('profiles')
                            .update({ stripe_account_id: accountId })
                            .eq('id', user.id);
                    }
                }

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                // Extract locale from Referer header so Spanish contractors aren't redirected to /en/
                const referer = req.headers.get('referer') || '';
                const localeMatch = referer.match(/\/([a-z]{2})\//);
                const locale = localeMatch ? localeMatch[1] : 'en';
                const accountLink = await stripe.accountLinks.create({
                    account: accountId,
                    refresh_url: `${appUrl}/${locale}/contractor/settings`,
                    return_url: `${appUrl}/${locale}/contractor/settings?onboarding=complete`,
                    type: 'account_onboarding',
                });

                return NextResponse.json({ success: true, url: accountLink.url });
            } catch (stripeError) {
                console.error('Stripe onboarding error:', stripeError);
                return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 });
            }
        }

        // Stripe not configured — return a placeholder URL
        return NextResponse.json({
            success: true,
            url: '/contractor/settings?onboarding=pending',
        });
    } catch (error) {
        console.error('Onboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
