import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/time-windows
// Returns all time window configurations
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('time_windows')
      .select('id, slot, label, label_es, range, range_es, is_active, sort_order')
      .order('sort_order');

    if (error) throw error;

    // If no data exists, return default time windows
    if (!data || data.length === 0) {
      return NextResponse.json({
        timeWindows: [
          { id: 1, slot: "09:00", label: "9:00 AM", label_es: "9:00 AM", range: "9:00 AM", range_es: "9:00 AM", is_active: true, sort_order: 1 },
          { id: 2, slot: "10:00", label: "10:00 AM", label_es: "10:00 AM", range: "10:00 AM", range_es: "10:00 AM", is_active: true, sort_order: 2 },
          { id: 3, slot: "11:00", label: "11:00 AM", label_es: "11:00 AM", range: "11:00 AM", range_es: "11:00 AM", is_active: true, sort_order: 3 },
          { id: 4, slot: "12:00", label: "12:00 PM", label_es: "12:00 PM", range: "12:00 PM", range_es: "12:00 PM", is_active: true, sort_order: 4 },
          { id: 5, slot: "13:00", label: "1:00 PM", label_es: "1:00 PM", range: "1:00 PM", range_es: "1:00 PM", is_active: true, sort_order: 5 },
          { id: 6, slot: "14:00", label: "2:00 PM", label_es: "2:00 PM", range: "2:00 PM", range_es: "2:00 PM", is_active: true, sort_order: 6 },
          { id: 7, slot: "15:00", label: "3:00 PM", label_es: "3:00 PM", range: "3:00 PM", range_es: "3:00 PM", is_active: true, sort_order: 7 },
          { id: 8, slot: "16:00", label: "4:00 PM", label_es: "4:00 PM", range: "4:00 PM", range_es: "4:00 PM", is_active: true, sort_order: 8 }
        ]
      });
    }

    return NextResponse.json({ timeWindows: data });
  } catch (err) {
    console.error('GET /api/admin/time-windows error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/time-windows
// Create a new time window
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { slot, label, label_es, range, range_es, is_active, sort_order } = body;

    // Field validation
    if (!slot || !label) {
      return NextResponse.json({ error: 'Slot and label are required' }, { status: 400 });
    }
    if (!range || typeof range !== 'string' || !range.trim()) {
      return NextResponse.json({ error: 'Range is required' }, { status: 400 });
    }
    if (!range_es || typeof range_es !== 'string' || !range_es.trim()) {
      return NextResponse.json({ error: 'Range (Spanish) is required' }, { status: 400 });
    }
    if (sort_order == null || typeof sort_order !== 'number') {
      return NextResponse.json({ error: 'sort_order (number) is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('time_windows')
      .insert({
        slot,
        label,
        label_es,
        range,
        range_es,
        is_active: is_active ?? true,
        sort_order
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, timeWindow: data });
  } catch (err) {
    console.error('POST /api/admin/time-windows error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}