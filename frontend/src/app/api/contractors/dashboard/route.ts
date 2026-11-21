/**
 * GET /api/contractors/dashboard
 * Returns incoming (unassigned) jobs + this contractor's active jobs + earnings.
 * Requires authentication — only approved contractors can access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { getApproxMap } from '@/lib/geo/approxLocation';
import { contractorServesZip } from '@/lib/zones';
import { contractorAmount } from '@/lib/contractorPay';

// Only the first jobs get a map, to keep Mapbox usage small.
const MAX_INCOMING_MAPS = 3;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        // Require authentication
        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { user, error: authError } = await createAuthClient(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const contractorId = user.id;
        const supabase = createServiceClient();

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, approval_status, service_zones')
            .eq('id', contractorId)
            .single();

        const contractorName = profile?.full_name?.split(' ')[0] ?? null;

        // Block unapproved contractors
        if (profile?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        // ── Incoming jobs: unassigned, status = pending_assignment ────────────
        const { data: incomingAll } = await supabase
            .from('bookings')
            .select('id, document_id, service_id, service_name, time_window, address, city, state, zip_code, date, total_amount, status, confirmation_code, vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_body_style, vehicle_type, selected_add_ons')
            .eq('status', 'pending_assignment')
            .eq('payment_status', 'authorized')
            .order('created_at', { ascending: true });

        // Only jobs in the zones this contractor works.
        const incomingRaw = (incomingAll ?? []).filter((b) => contractorServesZip(profile?.service_zones, b.zip_code));

        // Approximate 1-mile map for the first incoming jobs (server-side; the real address never leaves).
        const incomingMaps = await Promise.all(
            (incomingRaw ?? []).map((b, i) =>
                i < MAX_INCOMING_MAPS
                    ? getApproxMap({ address: b.address, city: b.city, state: b.state, zip: b.zip_code }).catch(() => null)
                    : Promise.resolve(null)
            )
        );

        // Service details (what's included + duration) for the incoming jobs.
        const serviceIds = [...new Set((incomingRaw ?? []).map((b) => b.service_id).filter((v) => v != null))];
        const { data: serviceRows } = await supabase
            .from('services')
            .select('id, name_es, description, description_es, duration_minutes')
            .in('id', serviceIds.length > 0 ? serviceIds : [-1]);
        const serviceById = new Map((serviceRows ?? []).map((sv) => [sv.id, sv]));

        // "- item" / "• item" lines -> clean list. Empty text -> [].
        const toLines = (text: string | null | undefined): string[] =>
            String(text ?? '')
                .split(/\r?\n/)
                .map((l) => l.replace(/^\s*[-•*–]\s*/, '').trim())
                .filter(Boolean);

        const incomingJobs = (incomingRaw ?? []).map((b, i) => {
            const sv = serviceById.get(b.service_id);
            const addOns = Array.isArray(b.selected_add_ons)
                ? (b.selected_add_ons as { name?: string }[]).map((a) => a?.name).filter((n): n is string => !!n)
                : [];
            return {
            id: b.id,
            documentId: b.document_id,
            confirmationCode: b.confirmation_code,
            serviceName: b.service_name || 'Auto Detail',
            timeWindow: b.time_window || 'TBD',
            date: b.date,
            // Only city + ZIP until accepted — hide full address
            area: [b.city, b.zip_code].filter(Boolean).join(', '),
            approxMap: incomingMaps[i] ?? null,
            totalAmount: contractorAmount(Number(b.total_amount) || 0),
            status: b.status,
            // Vehicle info only (no plate, no customer data).
            vehicle: {
                make: b.vehicle_make || null,
                model: b.vehicle_model || null,
                year: b.vehicle_year ? String(b.vehicle_year) : null,
                color: b.vehicle_color || null,
                bodyStyle: b.vehicle_body_style || b.vehicle_type || null,
            },
            serviceNameEs: sv?.name_es ?? null,
            includes: toLines(sv?.description),
            includesEs: toLines(sv?.description_es),
            durationMinutes: sv?.duration_minutes ?? null,
            addOns,
            };
        });

        // ── Active jobs: assigned to this contractor ──────────────────────────
        // The street address is only released once the contractor presses "On My Way".
        // Until then they only see city + ZIP (privacy of the customer).
        const ADDRESS_REVEALED_STATUSES = ['en_route', 'in_progress', 'pending_approval'];
        let activeJobs: { id: number; documentId: string | null; confirmationCode: string | null; serviceName: string; timeWindow: string; date: string; address: string; addressHidden: boolean; totalAmount: number; status: string; }[] = [];
        let completedJobs: { id: number; service_name: string | null; date: string; total_amount: string | number; created_at: string; confirmation_code?: string | null; }[] = [];
        const earnings = { thisWeek: 0, total: 0 };

        {
            const { data: activeRaw } = await supabase
                .from('bookings')
                .select('id, document_id, service_name, time_window, address, city, zip_code, date, total_amount, status, confirmation_code')
                .eq('contractor_id', contractorId)
                .in('status', ['confirmed', 'en_route', 'in_progress', 'pending_approval'])
                .order('date', { ascending: true });

            activeJobs = (activeRaw ?? []).map((b) => ({
                id: b.id,
                documentId: b.document_id,
                confirmationCode: b.confirmation_code,
                serviceName: b.service_name || 'Auto Detail',
                timeWindow: b.time_window || 'TBD',
                date: b.date,
                address: ADDRESS_REVEALED_STATUSES.includes(b.status)
                    ? (b.zip_code && b.address?.includes(b.zip_code)
                        ? b.address
                        : [b.address, b.city, b.zip_code].filter(Boolean).join(', '))
                    : [b.city, b.zip_code].filter(Boolean).join(', '),
                addressHidden: !ADDRESS_REVEALED_STATUSES.includes(b.status),
                totalAmount: contractorAmount(Number(b.total_amount) || 0),
                status: b.status,
            }));

            // Earnings from completed jobs
            const { data: completed } = await supabase
                .from('bookings')
                .select('id, service_name, date, total_amount, created_at, review_rating, review_comment, confirmation_code')
                .eq('contractor_id', contractorId)
                .eq('status', 'completed')
                .order('date', { ascending: false });

            const nowEastern = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
            // "This week" = current Mon-Sun week (Eastern), by service date, same weeks as payouts.
            const dow = nowEastern.getDay(); // 0 = Sun
            const monday = new Date(nowEastern);
            monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
            const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

            earnings.total = (completed ?? []).reduce((s, b) => s + contractorAmount(Number(b.total_amount) || 0), 0);
            earnings.thisWeek = (completed ?? [])
                .filter((b) => String(b.date).slice(0, 10) >= weekStart)
                .reduce((s, b) => s + contractorAmount(Number(b.total_amount) || 0), 0);

            completedJobs = (completed ?? []).map((b) => ({
                ...b,
                total_amount: contractorAmount(Number(b.total_amount) || 0),
            }));
        } // end block

        return NextResponse.json({
            contractor: contractorId ? { id: contractorId, name: contractorName } : null,
            serviceZones: profile?.service_zones ?? null,
            incomingJobs,
            activeJobs,
            completedJobs,
            earnings,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
