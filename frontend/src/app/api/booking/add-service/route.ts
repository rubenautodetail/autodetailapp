/**
 * POST /api/booking/add-service
 * Lets a customer add services or add-ons to a booking while it's active.
 * Requires the booking's confirmation_code for security.
 * Updates total_amount + service_name, then notifies the contractor and all admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface AddedItem {
    id: number;
    type: 'service' | 'addon';
    name: string;
    name_es: string | null;
    price: number;
}

export async function POST(req: NextRequest) {
  try {
    let body: { bookingId: string; confirmationCode: string; items: AddedItem[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Require authentication
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookingId, confirmationCode, items } = body;

    if (!bookingId || !confirmationCode || !items?.length) {
        return NextResponse.json(
            { error: 'bookingId, confirmationCode, and items are required' },
            { status: 400 },
        );
    }

    const safeId = String(bookingId).trim();
    if (!/^[a-zA-Z0-9\-_]+$/.test(safeId)) {
        return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', safeId)
        .single();

    if (fetchError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Security: confirmation code must match
    if (booking.confirmation_code !== confirmationCode) {
        return NextResponse.json({ error: 'Invalid confirmation code' }, { status: 403 });
    }

    const ACTIVE_STATUSES = ['confirmed', 'en_route', 'in_progress'];
    if (!ACTIVE_STATUSES.includes(booking.status)) {
        return NextResponse.json(
            { error: 'Can only add services to an active booking' },
            { status: 400 },
        );
    }

    // Compute new totals
    const addedAmount = items.reduce((sum, item) => sum + Number(item.price), 0);
    const newTotal = Number(booking.total_amount) + addedAmount;
    const addedNames = items.map((i) => i.name).join(', ');
    const newServiceName = booking.service_name
        ? `${booking.service_name} + ${addedNames}`
        : addedNames;

    const { error: updateError } = await supabase
        .from('bookings')
        .update({
            service_name: newServiceName,
            total_amount: newTotal,
            updated_at: new Date().toISOString(),
        })
        .eq('id', safeId);

    if (updateError) {
        console.error('add-service update error:', updateError);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // In-app notification — contractor
    if (booking.contractor_id) {
        await supabase.from('notifications').insert({
            user_id: booking.contractor_id,
            title: 'Customer Added Services',
            message: `Customer added: ${addedNames}. New total: $${newTotal.toFixed(2)}`,
            type: 'info',
            link: `/contractor/jobs/${booking.id}`,
        });
    }

    // In-app notification — all admins
    const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

    if (admins?.length) {
        await supabase.from('notifications').insert(
            admins.map((admin) => ({
                user_id: admin.id,
                title: 'Add-on Requested',
                message: `Booking #${booking.id}: ${addedNames} (+$${addedAmount.toFixed(2)})`,
                type: 'info' as const,
                link: `/admin`,
            })),
        );
    }

    return NextResponse.json({ success: true, newTotal, newServiceName });
  } catch (err) {
    console.error('add-service error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
