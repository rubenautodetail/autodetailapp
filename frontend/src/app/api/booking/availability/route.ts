/**
 * POST /api/booking/availability
 *
 * Returns the dates and time slots the customer can book given:
 *   • platform_schedule_settings (admin-controlled defaults, booking window, lead time)
 *   • platform_blocked_dates (admin holidays/closures)
 *   • contractors whose verified_service_type_ids contains the requested serviceId
 *   • each contractor's own availability JSON (day-of-week + hour range)
 *   • already-booked slots in the requested month
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';
import {
    matchesSlot,
    weekdaySettingsKeyFor,
    type ContractorAvailability,
} from '@/lib/contractorAvailability';

interface TimeWindow {
    slot: string; // HH:MM format
    label: string;
    label_es: string;
    is_active?: boolean;
}

interface PlatformSettings {
    weekday_defaults: Record<string, boolean>;
    booking_window_days: number;
    min_lead_time_hours: number;
}

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

const DEFAULT_SETTINGS: PlatformSettings = {
    weekday_defaults: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
    booking_window_days: 14,
    min_lead_time_hours: 1,
};

export async function POST(req: NextRequest) {
    try {
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { zipCode, month, serviceId: serviceIdRaw } = body as { zipCode?: string; month?: string; serviceId?: string | number };

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

        // serviceId is required so we can match contractor skills. The client
        // passes it on every call once a service is selected.
        const serviceId = serviceIdRaw != null && serviceIdRaw !== '' ? Number(serviceIdRaw) : null;

        const [year, monthNum] = month.split('-').map(Number);
        const endDate = new Date(year, monthNum, 0); // last day of month

        // Eastern time "today" boundary
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
        const currentMonth = today.toISOString().slice(0, 7);

        const supabase = createApiClient();

        // ── Parallel fetch: settings, blocked dates, time windows, contractors, bookings
        const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        // Build contractor query — skill match only applied if we have a serviceId.
        const contractorQuery = supabase
            .from('profiles')
            .select('id, verified_service_type_ids, availability')
            .eq('role', 'contractor')
            .eq('approval_status', 'approved')
            .eq('is_available', true);

        if (serviceId !== null) {
            // Postgres array-contains operator via PostgREST `cs` filter.
            contractorQuery.contains('verified_service_type_ids', [serviceId]);
        }

        const [
            settingsRes,
            blockedRes,
            twRes,
            contractorsRes,
            bookedSlotsRes,
        ] = await Promise.all([
            supabase
                .from('platform_schedule_settings')
                .select('weekday_defaults, booking_window_days, min_lead_time_hours')
                .eq('id', 1)
                .maybeSingle(),
            supabase
                .from('platform_blocked_dates')
                .select('date')
                .gte('date', monthStart)
                .lte('date', monthEnd),
            supabase
                .from('time_windows')
                .select('slot, label, label_es, is_active')
                .eq('is_active', true)
                .order('sort_order'),
            contractorQuery,
            supabase
                .from('bookings')
                .select('date, time_window')
                .in('status', ['pending_assignment', 'confirmed', 'in_progress', 'pending_approval'])
                .gte('date', monthStart)
                .lte('date', monthEnd),
        ]);

        const settings: PlatformSettings = settingsRes.data ?? DEFAULT_SETTINGS;
        const blockedSet = new Set<string>(
            (blockedRes.data ?? []).map((r: { date: string }) => r.date)
        );

        const timeWindows: TimeWindow[] =
            twRes.data && twRes.data.length > 0
                ? twRes.data
                      .filter((w) => w.is_active !== false)
                      .map((w) => ({
                          slot: w.slot,
                          label: w.label,
                          label_es: w.label_es || w.label,
                          is_active: w.is_active,
                      }))
                : DEFAULT_TIME_WINDOWS;

        const contractors = (contractorsRes.data ?? []) as Array<{
            id: string;
            verified_service_type_ids: number[] | null;
            availability: ContractorAvailability;
        }>;

        // Build booked-count map.
        const bookedMap = new Map<string, number>();
        for (const b of bookedSlotsRes.data ?? []) {
            if (!b.date || !b.time_window) continue;
            const key = `${b.date}:${b.time_window}`;
            bookedMap.set(key, (bookedMap.get(key) ?? 0) + 1);
        }

        // ── Build response
        const availableDates: Array<{
            date: string;
            slots: Array<{ window: string; label: string; contractorsAvailable: number }>;
        }> = [];
        let nextAvailable: { date: string; window: string; label: string } | null = null;

        // Booking-window cutoff (admin-controlled).
        const windowCutoff = new Date(today);
        windowCutoff.setDate(windowCutoff.getDate() + settings.booking_window_days);

        if (month >= currentMonth) {
            const startDay = month === currentMonth ? today.getDate() : 1;

            for (let day = startDay; day <= endDate.getDate(); day++) {
                const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(dateKey + 'T00:00:00');

                // Skip past the booking window.
                if (dateObj > windowCutoff) continue;

                // Skip admin-blocked dates.
                if (blockedSet.has(dateKey)) continue;

                // Skip weekdays the admin has turned off.
                const weekdayKey = weekdaySettingsKeyFor(dateObj);
                if (settings.weekday_defaults?.[weekdayKey] === false) continue;

                const isToday = dateKey === today.toISOString().slice(0, 10);
                const leadCutoffHour = isToday ? today.getHours() + settings.min_lead_time_hours : -1;

                const slots = timeWindows
                    .map((window) => {
                        const hour = parseInt(window.slot.split(':')[0], 10);

                        // Lead-time guard for today.
                        if (isToday && hour <= leadCutoffHour) {
                            return { window: window.slot, label: window.label, contractorsAvailable: 0 };
                        }

                        // Count contractors whose availability JSON covers this date+hour.
                        const eligible = contractors.filter((c) =>
                            matchesSlot(c.availability, dateObj, hour)
                        ).length;

                        const booked = bookedMap.get(`${dateKey}:${window.slot}`) ?? 0;
                        return {
                            window: window.slot,
                            label: window.label,
                            contractorsAvailable: Math.max(0, eligible - booked),
                        };
                    })
                    .filter((s) => s.contractorsAvailable > 0);

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
            contractorCount: contractors.length,
            windowDays: settings.booking_window_days,
            minLeadTimeHours: settings.min_lead_time_hours,
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
