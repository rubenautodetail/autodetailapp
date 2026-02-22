/**
 * POST /api/booking/availability
 * Returns available dates and time windows for a given ZIP + month.
 * Ported from Strapi backend — Strapi no longer required at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { zipCode, month } = await req.json();

        if (!zipCode || !month) {
            return NextResponse.json(
                { error: 'ZIP code and month are required' },
                { status: 400 }
            );
        }

        const cleanZip = String(zipCode).trim().split('-')[0];
        if (!/^\d{5}$/.test(cleanZip)) {
            return NextResponse.json({ error: 'Invalid ZIP code format' }, { status: 400 });
        }

        if (!/^\d{4}-\d{2}$/.test(month)) {
            return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
        }

        const [year, monthNum] = month.split('-').map(Number);
        const endDate = new Date(year, monthNum, 0); // last day of month

        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);

        const availableDates: Array<{
            date: string;
            slots: Array<{ window: string; label: string; contractorsAvailable: number }>;
        }> = [];
        let nextAvailable: { date: string; window: string; label: string } | null = null;

        // Only generate availability for current and future months
        if (month >= currentMonth) {
            const startDay = month === currentMonth ? today.getDate() : 1;

            for (let day = startDay; day <= endDate.getDate(); day++) {
                const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(dateKey);

                // Skip Sundays (day 0)
                if (dateObj.getDay() === 0) continue;

                const slots = [
                    { window: 'morning', label: '9:00 AM - 12:00 PM', contractorsAvailable: 1 },
                    { window: 'afternoon', label: '1:00 PM - 4:00 PM', contractorsAvailable: 1 },
                    { window: 'evening', label: '4:00 PM - 7:00 PM', contractorsAvailable: 1 },
                ];

                availableDates.push({ date: dateKey, slots });

                if (!nextAvailable) {
                    nextAvailable = { date: dateKey, window: 'morning', label: '9:00 AM - 12:00 PM' };
                }
            }
        }

        return NextResponse.json({
            available: availableDates.length > 0,
            zipCode: cleanZip,
            month,
            contractorCount: 1,
            availableDates,
            nextAvailable,
        });
    } catch (error) {
        console.error('Error in availability:', error);
        return NextResponse.json(
            { error: 'An error occurred while checking availability' },
            { status: 500 }
        );
    }
}
