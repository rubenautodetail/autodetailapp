/**
 * POST /api/booking/create
 * Creates a new booking record in Supabase.
 * Generates a confirmation code server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

function generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RD-';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function POST(req: NextRequest) {
    if (rateLimit(req, { maxRequests: 5, windowMs: 60_000, keyPrefix: 'booking-create' })) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
    }

    try {
        const body = await req.json();

        const {
            service,
            addOns,
            date,
            timeWindow,
            address,
            city,
            state,
            zipCode,
            customerName,
            customerEmail,
            customerPhone,
            specialInstructions,
            subtotal,
            serviceFee,
            total,
            serviceName,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            vehicleColor,
        } = body;

        // Basic validation
        if (!date || !timeWindow || !address || !customerEmail || !customerName) {
            return NextResponse.json(
                { error: 'Missing required booking fields' },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();
        const confirmationCode = generateConfirmationCode();

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                confirmation_code: confirmationCode,
                status: 'pending_assignment',
                payment_status: 'unpaid',
                date,
                time_window: timeWindow,
                address,
                city: city || '',
                state: state || 'FL',
                zip_code: zipCode,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || '',
                special_instructions: specialInstructions || '',
                subtotal: subtotal || 0,
                service_fee: serviceFee || 0,
                total_amount: total || 0,
                service_name: serviceName || null,
                vehicle_make: vehicleMake || null,
                vehicle_model: vehicleModel || null,
                vehicle_year: vehicleYear || null,
                vehicle_color: vehicleColor || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Trigger notification
        const resolvedServiceName = serviceName || data.service_name || 'Detailing Service';
        const bookingWithService = { ...data, service_name: resolvedServiceName };
        const { notify } = await import('@/lib/notifications');

        // 1. Confirm email to customer
        await notify({ type: 'booking.created', booking: bookingWithService });

        // 2. Alert all active contractors so they can claim the job
        const supabaseAdmin = createServiceClient();
        const { data: contractors } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('role', 'contractor')
            .eq('onboarding_complete', true)
            .eq('is_available', true);

        if (contractors && contractors.length > 0) {
            // Send emails to all contractors
            await Promise.all(
                contractors.map((c) =>
                    notify({
                        type: 'contractor.job_assigned',
                        booking: bookingWithService,
                        contractorEmail: c.email,
                    })
                )
            );

            // Batch insert in-app notifications for all eligible contractors
            const notificationRows = contractors.map((c) => ({
                user_id: c.id,
                type: 'info' as const,
                title: 'New Job Available',
                message: `New detailing job in ${zipCode}. Tap to view and accept.`,
                booking_id: data.id,
                is_read: false,
                link: `/en/contractor/jobs/${data.id}`,
            }));

            const { error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert(notificationRows);

            if (notifError) {
                console.error('Failed to insert contractor notifications:', notifError);
            }
        }

        return NextResponse.json({
            data: {
                id: data.id,
                documentId: String(data.id),
                confirmationCode: data.confirmation_code,
                status: data.status,
                date: data.date,
                timeWindow: data.time_window,
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zip_code,
                customerName: data.customer_name,
                customerEmail: data.customer_email,
                customerPhone: data.customer_phone,
                subtotal: Number(data.subtotal),
                serviceFee: Number(data.service_fee),
                total: Number(data.total_amount),
            },
        });
    } catch (error) {
        console.error('Error in booking/create:', error);
        return NextResponse.json(
            { error: 'An error occurred while creating the booking' },
            { status: 500 }
        );
    }
}
