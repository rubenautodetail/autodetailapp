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

        const body = await req.json() as { bookingId: string };
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
            .or(`id.eq.${safeId},document_id.eq.${safeId}`)
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
            .or(`id.eq.${safeId},document_id.eq.${safeId}`)
            .eq('contractor_id', user.id);

        if (updateError) {
            console.error('en-route: update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Insert notification for the customer
        if (booking.user_id) {
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: booking.user_id,
                    type: 'info',
                    title: 'Contractor On The Way',
                    message: 'Your detailer is heading to you now! They should arrive soon.',
                    booking_id: booking.id,
                    is_read: false,
                });

            if (notifError) {
                // Non-fatal — log but don't fail the request
                console.error('en-route: notification insert error:', notifError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('en-route API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
