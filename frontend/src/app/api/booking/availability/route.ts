/**
 * POST /api/booking/availability
 * Returns available dates and time windows based on real contractor capacity.
 * Subtracts already-booked slots from total active contractor count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

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

        const supabase = createServiceClient();

        // Count active contractors (onboarding complete)
        const { count: contractorCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'contractor')
            .eq('onboarding_complete', true);

        // Fallback: if no onboarded contractors found, use 1 (dev mode)
        const totalContractors = contractorCount && contractorCount > 0 ? contractorCount : 1;

        // Fetch all confirmed/pending_approval bookings in this month to calculate capacity
        const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        // Count all active bookings (any status that indicates a slot is taken)
        const { data: bookedSlots } = await supabase
            .from('bookings')
            .select('date, time_window')
            .in('status', ['pending_assignment', 'confirmed', 'in_progress', 'pending_approval'])
            .gte('date', monthStart)
            .lte('date', monthEnd);

        // Build a map of date+window -> booked count
        const bookedMap = new Map<string, number>();
        for (const b of bookedSlots || []) {
            if (!b.date || !b.time_window) continue;
            const key = `${b.date}:${b.time_window}`;
            bookedMap.set(key, (bookedMap.get(key) ?? 0) + 1);
        }

        const availableDates: Array<{
            date: string;
            slots: Array<{ window: string; label: string; contractorsAvailable: number }>;
        }> = [];
        let nextAvailable: { date: string; window: string; label: string } | null = null;

        if (month >= currentMonth) {
            const startDay = month === currentMonth ? today.getDate() : 1;

            for (let day = startDay; day <= endDate.getDate(); day++) {
                const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(dateKey);

                // Skip Sundays (day 0)
                if (dateObj.getDay() === 0) continue;

                const timeWindows = [
                    { window: 'morning', label: '9:00 AM - 12:00 PM' },
                    { window: 'afternoon', label: '1:00 PM - 4:00 PM' },
                    { window: 'evening', label: '4:00 PM - 7:00 PM' },
                ];

                const slots = timeWindows
                    .map(({ window, label }) => {
                        const booked = bookedMap.get(`${dateKey}:${window}`) ?? 0;
                        return { window, label, contractorsAvailable: Math.max(0, totalContractors - booked) };
                    })
                    .filter((s) => s.contractorsAvailable > 0); // Only show open slots

                if (slots.length === 0) continue;

                availableDates.push({ date: dateKey, slots });

                if (!nextAvailable) {
                    nextAvailable = { date: dateKey, window: slots[0].window, label: slots[0].label };
                }
            }
        }

        return NextResponse.json({
            available: availableDates.length > 0,
            zipCode: cleanZip,
            month,
            contractorCount: totalContractors,
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
