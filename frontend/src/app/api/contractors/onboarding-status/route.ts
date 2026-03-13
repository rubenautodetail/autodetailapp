import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createServiceClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_account_id, onboarding_complete, approval_status')
            .eq('id', user.id)
            .single();

        if ((profile as any)?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        const stripeAccountId = (profile as any)?.stripe_account_id as string | null;
        let onboardingComplete = !!(profile as any)?.onboarding_complete;

        // If Stripe is configured and the contractor has an account, check real status
        if (
            stripeAccountId &&
            process.env.STRIPE_SECRET_KEY &&
            process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder'
        ) {
            try {
                const Stripe = (await import('stripe')).default;
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

                const account = await stripe.accounts.retrieve(stripeAccountId);
                const detailsSubmitted = account.details_submitted;
                const chargesEnabled = account.charges_enabled;
                const payoutsEnabled = account.payouts_enabled;

                // Sync onboarding_complete status back to DB
                if (chargesEnabled && payoutsEnabled && !onboardingComplete) {
                    await supabase
                        .from('profiles')
                        .update({ onboarding_complete: true } as any)
                        .eq('id', user.id);
                    onboardingComplete = true;
                }

                return NextResponse.json({
                    success: true,
                    onboardingComplete,
                    detailsSubmitted,
                    chargesEnabled,
                    payoutsEnabled,
                    needsAccount: false,
                });
            } catch (stripeError) {
                console.error('Stripe account lookup error:', stripeError);
            }
        }

        return NextResponse.json({
            success: true,
            onboardingComplete,
            detailsSubmitted: onboardingComplete,
            chargesEnabled: onboardingComplete,
            payoutsEnabled: onboardingComplete,
            needsAccount: !stripeAccountId,
        });
    } catch (error) {
        console.error('Onboarding-status API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
