/**
 * GET /api/contractors/dashboard
 * Returns incoming (unassigned) jobs + this contractor's active jobs + earnings.
 * Requires authentication — only approved contractors can access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServiceClient } from '@/lib/supabase/server';
import { getApproxMap } from '@/lib/geo/approxLocation';

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
            .select('full_name, approval_status')
            .eq('id', contractorId)
            .single();

        const contractorName = profile?.full_name?.split(' ')[0] ?? null;

        // Block unapproved contractors
        if (profile?.approval_status !== 'approved') {
            return NextResponse.json({ error: 'Contractor account pending approval' }, { status: 403 });
        }

        // ── Incoming jobs: unassigned, status = pending_assignment ────────────
        const { data: incomingRaw } = await supabase
            .from('bookings')
            .select('id, document_id, service_name, time_window, address, city, state, zip_code, date, total_amount, status, confirmation_code')
            .eq('status', 'pending_assignment')
            .eq('payment_status', 'authorized')
            .order('created_at', { ascending: true });

        // Approximate 1-mile map for the first incoming jobs (server-side; the real address never leaves).
        const incomingMaps = await Promise.all(
            (incomingRaw ?? []).map((b, i) =>
                i < MAX_INCOMING_MAPS
                    ? getApproxMap({ address: b.address, city: b.city, state: b.state, zip: b.zip_code }).catch(() => null)
                    : Promise.resolve(null)
            )
        );

        const incomingJobs = (incomingRaw ?? []).map((b, i) => ({
            id: b.id,
            documentId: b.document_id,
            confirmationCode: b.confirmation_code,
            serviceName: b.service_name || 'Auto Detail',
            timeWindow: b.time_window || 'TBD',
            date: b.date,
            // Only city + ZIP until accepted — hide full address
            area: [b.city, b.zip_code].filter(Boolean).join(', '),
            approxMap: incomingMaps[i] ?? null,
            totalAmount: (Number(b.total_amount) || 0) * 0.70,
            status: b.status,
        }));

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
                totalAmount: (Number(b.total_amount) || 0) * 0.70,
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

            const CONTRACTOR_SHARE = 0.70;
            const contractorAmount = (raw: number) => raw * CONTRACTOR_SHARE;

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
