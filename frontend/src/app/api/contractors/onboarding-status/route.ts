import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createApiClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabase = createApiClient();
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
