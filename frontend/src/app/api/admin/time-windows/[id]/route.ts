import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/verifyAdmin';

export const dynamic = 'force-dynamic';

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
    let updates;
    try {
      updates = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

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
