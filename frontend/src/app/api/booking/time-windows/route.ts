/**
 * GET /api/booking/time-windows
 * Public endpoint — returns active time windows for client booking flow.
 * No auth required (read-only, non-sensitive data).
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEFAULT_TIME_WINDOWS = [
  { slot: "09:00", label: "9:00 AM", label_es: "9:00 AM", range: "9:00 AM", range_es: "9:00 AM", is_active: true, sort_order: 1 },
  { slot: "10:00", label: "10:00 AM", label_es: "10:00 AM", range: "10:00 AM", range_es: "10:00 AM", is_active: true, sort_order: 2 },
  { slot: "11:00", label: "11:00 AM", label_es: "11:00 AM", range: "11:00 AM", range_es: "11:00 AM", is_active: true, sort_order: 3 },
  { slot: "12:00", label: "12:00 PM", label_es: "12:00 PM", range: "12:00 PM", range_es: "12:00 PM", is_active: true, sort_order: 4 },
  { slot: "13:00", label: "1:00 PM", label_es: "1:00 PM", range: "1:00 PM", range_es: "1:00 PM", is_active: true, sort_order: 5 },
  { slot: "14:00", label: "2:00 PM", label_es: "2:00 PM", range: "2:00 PM", range_es: "2:00 PM", is_active: true, sort_order: 6 },
  { slot: "15:00", label: "3:00 PM", label_es: "3:00 PM", range: "3:00 PM", range_es: "3:00 PM", is_active: true, sort_order: 7 },
  { slot: "16:00", label: "4:00 PM", label_es: "4:00 PM", range: "4:00 PM", range_es: "4:00 PM", is_active: true, sort_order: 8 },
];

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('time_windows')
      .select('id, slot, label, label_es, range, range_es, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.warn('Public time-windows: DB query failed, using defaults:', error.message);
      return NextResponse.json({ timeWindows: DEFAULT_TIME_WINDOWS });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ timeWindows: DEFAULT_TIME_WINDOWS });
    }

    return NextResponse.json({ timeWindows: data });
  } catch (err) {
    console.error('GET /api/booking/time-windows error:', err);
    return NextResponse.json({ timeWindows: DEFAULT_TIME_WINDOWS });
  }
}
