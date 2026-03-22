/**
 * POST /api/reviews
 * Submit a review for a completed booking.
 * Validates that the authenticated user owns the booking before saving.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const body = await req.json();
        const { bookingId, rating, comment } = body as {
            bookingId: string;
            rating: number;
            comment?: string;
        };

        if (!bookingId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const safeId = String(bookingId).trim();
        if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Verify the booking belongs to this user
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, contractor_id, status, customer_email')
            .eq('id', safeId)
            .single();

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.customer_email !== user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Store review in notifications table (server-side validated)
        await supabase.from('notifications').insert({
            type: 'review',
            payload: {
                booking_id: booking.id,
                contractor_id: booking.contractor_id,
                customer_email: user.email,
                rating,
                comment: comment?.trim() ?? '',
                submitted_at: new Date().toISOString(),
            },
        });

        // Recalculate and update contractor's average rating
        if (booking.contractor_id) {
            const { data: allReviews } = await supabase
                .from('notifications')
                .select('payload')
                .eq('type', 'review')
                .filter('payload->>contractor_id', 'eq', booking.contractor_id);

            if (allReviews && allReviews.length > 0) {
                const ratings = allReviews
                    .map((r) => (r.payload as { rating?: number })?.rating)
                    .filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);

                if (ratings.length > 0) {
                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                    await supabase
                        .from('profiles')
                        .update({ rating: Math.round(avg * 10) / 10 })
                        .eq('id', booking.contractor_id);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reviews API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
