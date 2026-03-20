// GET /api/cron/job-expiry
// Fires every minute. Finds bookings stuck in 'pending_assignment' for 3–4 minutes
// and alerts admin + re-notifies all available contractors.
//
// Security: Requires Authorization: Bearer <CRON_SECRET> header.
// QStash: POST with body containing { cron_secret: "..." }

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Booking {
    id: string;
    confirmation_code: string;
    zip_code: string;
    status: string;
    created_at: string;
}

interface ContractorProfile {
    id: string;
}

export async function GET(request: NextRequest) {
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createServiceClient();

        const now = Date.now();
        const lowerBound = new Date(now - 4 * 60 * 1000).toISOString(); // 4 minutes ago
        const upperBound = new Date(now - 3 * 60 * 1000).toISOString(); // 3 minutes ago

        const { data: staleBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, confirmation_code, zip_code, status, created_at')
            .eq('status', 'pending_assignment')
            .gte('created_at', lowerBound)
            .lte('created_at', upperBound);

        if (bookingsError) {
            console.error('job-expiry cron query error:', bookingsError);
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
        }

        const bookings = (staleBookings ?? []) as Booking[];

        if (bookings.length === 0) {
            return NextResponse.json({ processed: 0, bookings: [] });
        }

        const { data: contractors, error: contractorsError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'contractor')
            .eq('approval_status', 'approved')
            .eq('onboarding_complete', true)
            .eq('is_available', true);

        if (contractorsError) {
            console.error('job-expiry cron contractors query error:', contractorsError);
            return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
        }

        const availableContractors = (contractors ?? []) as ContractorProfile[];

        const confirmationCodes: string[] = [];

        for (const booking of bookings) {
            // Admin notification (user_id nullable = admin-only row)
            const { error: adminNotifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: null,
                    type: 'admin.job_unaccepted',
                    title: 'Job Needs Attention',
                    message: `Booking #${booking.confirmation_code} has been waiting for a contractor for 3 minutes.`,
                    booking_id: booking.id,
                    is_read: false,
                });

            if (adminNotifError) {
                console.error(`Failed to insert admin notification for booking ${booking.id}:`, adminNotifError);
            }

            // Contractor re-notifications
            if (availableContractors.length > 0) {
                const contractorNotifications = availableContractors.map((contractor) => ({
                    user_id: contractor.id,
                    type: 'contractor.job_reminder',
                    title: 'New Job Available',
                    message: `A detailing job in ZIP ${booking.zip_code} still needs a contractor. Tap to view.`,
                    booking_id: booking.id,
                    is_read: false,
                }));

                const { error: contractorNotifError } = await supabase
                    .from('notifications')
                    .insert(contractorNotifications);

                if (contractorNotifError) {
                    console.error(`Failed to insert contractor notifications for booking ${booking.id}:`, contractorNotifError);
                }
            }

            confirmationCodes.push(booking.confirmation_code);
        }

        console.log(`job-expiry cron: processed=${bookings.length}, contractors_notified=${availableContractors.length}`);
        return NextResponse.json({ processed: bookings.length, bookings: confirmationCodes });
    } catch (error) {
        console.error('job-expiry cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
