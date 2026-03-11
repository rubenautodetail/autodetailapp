import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '15');

export async function POST(req: NextRequest) {
    try {
        const { amount } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));
        const contractorAmount = amount - platformFee;

        return NextResponse.json({
            platformFee,
            contractorAmount,
            totalAmount: amount,
        });
    } catch (err) {
        console.error('Calculate fees error:', err);
        return NextResponse.json(
            { error: { message: 'Failed to calculate fees' } },
            { status: 500 }
        );
    }
}
