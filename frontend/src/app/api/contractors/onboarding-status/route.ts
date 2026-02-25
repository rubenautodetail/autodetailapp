/**
 * GET /api/contractors/onboarding-status
 * Returns the Stripe Connect onboarding status for the authenticated contractor.
 * Returns a stub response if Stripe is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch contractor's profile to check onboarding status
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_account_id, onboarding_complete')
            .eq('id', user.id)
            .single();

        const hasStripeAccount = !!(profile as any)?.stripe_account_id;
        const onboardingComplete = !!(profile as any)?.onboarding_complete;

        return NextResponse.json({
            success: true,
            onboardingComplete,
            detailsSubmitted: onboardingComplete,
            chargesEnabled: onboardingComplete,
            payoutsEnabled: onboardingComplete,
            needsAccount: !hasStripeAccount,
        });
    } catch (error) {
        console.error('Onboarding-status API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
