import { NextRequest, NextResponse } from 'next/server';
import { getContractorBanner } from '@/lib/hygraph';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get('locale') ?? 'en') as 'en' | 'es';

    const banner = await getContractorBanner(locale);

    return NextResponse.json({ banner });
}
