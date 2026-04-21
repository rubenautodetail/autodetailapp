import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * HyGraph webhook → on-demand revalidation.
 * POST /api/revalidate?secret=<REVALIDATION_SECRET>
 *
 * Configure in HyGraph → Settings → Webhooks:
 *   URL: https://www.dtailwash.com/api/revalidate?secret=<secret>
 *   Triggers: Publish, Unpublish
 */
export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    try {
        revalidateTag('hygraph', 'default');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch {
        return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
    }
}
