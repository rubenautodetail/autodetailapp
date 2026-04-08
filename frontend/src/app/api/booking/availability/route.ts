/**
 * POST /api/booking/availability
 * Returns available dates and time windows based on real contractor capacity.
 * Subtracts already-booked slots from total active contractor count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface TimeWindow {
  slot: string; // HH:MM format
  label: string;
  label_es: string;
  is_active?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { zipCode, month } = body;

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

        // Use Eastern time for "today" boundary
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
        const currentMonth = today.toISOString().slice(0, 7);

        const supabase = createServiceClient();

        // Fetch active time windows directly from DB (no self-fetch needed)
        const DEFAULT_TIME_WINDOWS: TimeWindow[] = [
            { slot: "09:00", label: "9:00 AM", label_es: "9:00 AM" },
            { slot: "10:00", label: "10:00 AM", label_es: "10:00 AM" },
            { slot: "11:00", label: "11:00 AM", label_es: "11:00 AM" },
            { slot: "12:00", label: "12:00 PM", label_es: "12:00 PM" },
            { slot: "13:00", label: "1:00 PM", label_es: "1:00 PM" },
            { slot: "14:00", label: "2:00 PM", label_es: "2:00 PM" },
            { slot: "15:00", label: "3:00 PM", label_es: "3:00 PM" },
            { slot: "16:00", label: "4:00 PM", label_es: "4:00 PM" },
        ];

        let timeWindows: TimeWindow[] = DEFAULT_TIME_WINDOWS;

        try {
            const { data: twData, error: twError } = await supabase
                .from('time_windows')
                .select('slot, label, label_es, is_active')
                .eq('is_active', true)
                .order('sort_order');

            if (!twError && twData && twData.length > 0) {
                timeWindows = twData.map((w) => ({
                    slot: w.slot,
                    label: w.label,
                    label_es: w.label_es || w.label,
                    is_active: w.is_active,
                }));
            }
        } catch (timeWindowError) {
            console.warn('Could not fetch time windows from DB, using defaults:', timeWindowError);
        }

        // Count active approved contractors
        const { count: contractorCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'contractor')
            .eq('approval_status', 'approved');

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

                // Convert admin time windows to availability slots
                const slots = timeWindows
                    .filter(w => w.is_active !== false) // Only active time windows
                    .map(window => {
                        // Match against the exact time stored in bookings.time_window (e.g. "09:00")
                        const booked = bookedMap.get(`${dateKey}:${window.slot}`) ?? 0;
                        return {
                            window: window.slot,
                            label: window.label,
                            contractorsAvailable: Math.max(0, totalContractors - booked)
                        };
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

