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
    const { slot, label, label_es, range, range_es, is_active, sort_order } = await req.json();

    // Basic validation
    if (!slot || !label) {
      return NextResponse.json({ error: 'Slot and label are required' }, { status: 400 });
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

// PATCH /api/admin/time-windows/[id]
// Update a time window
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const updates = await req.json();

    // Remove id from updates if present
    const { id: _, ...updateData } = updates;

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('time_windows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, timeWindow: data });
  } catch (err) {
    console.error('PATCH /api/admin/time-windows/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/time-windows/[id]
// Delete a time window
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('time_windows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/time-windows/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}