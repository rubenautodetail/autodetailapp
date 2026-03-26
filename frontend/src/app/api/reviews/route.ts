/**
 * POST /api/reviews
 * Submit a review for a completed booking.
 * Stores rating + comment on the booking row, then recalculates
 * the contractor's average rating in profiles.
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

        // Verify booking belongs to this user and is completed
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, contractor_id, status, customer_email, user_id, review_rating')
            .eq('id', safeId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Allow if email matches OR if user_id matches (booking may be linked by either)
        const ownsBooking =
            booking.customer_email === user.email ||
            (booking.user_id && booking.user_id === user.id);

        if (!ownsBooking) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (booking.status !== 'completed') {
            return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
        }

        if (booking.review_rating !== null && booking.review_rating !== undefined) {
            return NextResponse.json({ error: 'Booking already reviewed' }, { status: 409 });
        }

        // Save review on the booking row
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                review_rating: rating,
                review_comment: comment?.trim() ?? null,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', safeId);

        if (updateError) {
            console.error('Review save error:', updateError);
            return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
        }

        // Recalculate contractor average rating from all reviewed bookings
        if (booking.contractor_id) {
            const { data: reviews } = await supabase
                .from('bookings')
                .select('review_rating')
                .eq('contractor_id', booking.contractor_id)
                .not('review_rating', 'is', null);

            if (reviews && reviews.length > 0) {
                const ratings = reviews
                    .map((r) => r.review_rating)
                    .filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);

                if (ratings.length > 0) {
                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                    await supabase
                        .from('profiles')
                        .update({
                            rating: Math.round(avg * 10) / 10,
                            total_ratings: ratings.length,
                        })
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
