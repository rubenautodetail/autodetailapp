import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** GET /api/contractors/public-name?id=<uuid> — returns contractor display name */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ name: null });

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', id)
      .eq('role', 'contractor')
      .single();

    return NextResponse.json({ name: data?.full_name || null });
  } catch {
    return NextResponse.json({ name: null });
  }
}
