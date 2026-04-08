/**
 * POST /api/booking/hold-slot
 * Temporarily holds a time slot for a booking (soft reservation).
 * In production this would write to a `slot_holds` table with TTL.
 * For now it returns a success response with a generated hold token.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { zipCode, date, timeWindow, duration } = body;

        if (!zipCode || !date || !timeWindow) {
            return NextResponse.json(
                { error: 'zipCode, date, and timeWindow are required' },
                { status: 400 }
            );
        }

        // Generate a hold token (UUID-like)
        const holdToken = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

        return NextResponse.json({
            success: true,
            holdToken,
            expiresAt,
            slot: {
                date,
                timeWindow,
                duration: duration ?? 60,
            },
        });
    } catch (error) {
        console.error('Error in hold-slot:', error);
        return NextResponse.json(
            { error: 'An error occurred while holding the slot' },
            { status: 500 }
        );
    }
}
