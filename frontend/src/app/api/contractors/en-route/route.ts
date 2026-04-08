import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: { bookingId: string };
        try {
            body = await req.json() as { bookingId: string };
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
        }

        const safeId = String(bookingId).trim();
        if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Verify booking exists, belongs to this contractor, and is in 'confirmed' status
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('id, contractor_id, user_id, status')
            .eq('id', safeId)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.contractor_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (booking.status !== 'confirmed') {
            return NextResponse.json(
                { error: `Cannot mark en_route from status '${booking.status}'` },
                { status: 409 }
            );
        }

        // Update booking status to en_route
        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'en_route', updated_at: new Date().toISOString() })
            .eq('id', safeId)
            .eq('contractor_id', user.id);

        if (updateError) {
            console.error('en-route: update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Send email + in-app notification to customer
        const { data: fullBooking } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', safeId)
            .single();

        if (fullBooking) {
            // If customer_email is missing (older bookings), look it up from auth
            if (!fullBooking.customer_email && fullBooking.user_id) {
                const { data: authData } = await supabase.auth.admin.getUserById(fullBooking.user_id);
                if (authData?.user?.email) {
                    (fullBooking as { customer_email: string | null }).customer_email = authData.user.email;
                }
            }
            console.log(`[en-route] sending notification for booking ${safeId}, customer_email: ${fullBooking.customer_email}`);
            const { notify } = await import('@/lib/notifications');
            await notify({ type: 'contractor.en_route', booking: fullBooking });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('en-route API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
