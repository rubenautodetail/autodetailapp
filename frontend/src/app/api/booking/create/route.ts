/**
 * POST /api/booking/create
 * Creates a new booking record in Supabase.
 * Generates a confirmation code server-side.
 * Previously called Strapi — now fully self-contained.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'RD-';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function POST(req: NextRequest) {
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
        } = body;

        // Basic validation
        if (!date || !timeWindow || !address || !customerEmail || !customerName) {
            return NextResponse.json(
                { error: 'Missing required booking fields' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        const confirmationCode = generateConfirmationCode();

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                confirmation_code: confirmationCode,
                status: 'pending',
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
                // Store the service/add-on IDs as metadata
                service_id: service || null,
                add_on_ids: addOns || [],
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return in the shape the frontend expects (mimicking Strapi response)
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
