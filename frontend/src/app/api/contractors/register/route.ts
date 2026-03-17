import { NextRequest, NextResponse } from "next/server";
import { sendContractorApplication, sendContractorApplicationReceived } from "@/lib/email";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// TODO (future): Re-add document uploads (driver's license, insurance, biz license)
// to Supabase Storage bucket 'contractor-docs' when ready. Checks are done manually for now.

export async function POST(req: NextRequest) {
    // Must be authenticated — no anonymous applications
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required. Create an account first.' }, { status: 401 });
    }

    try {
        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const fullNameVal = body.fullName;
        const emailVal = body.email;
        const phoneVal = body.phone;

        // Input validation
        if (typeof fullNameVal !== 'string' || fullNameVal.trim().length < 2 || fullNameVal.trim().length > 100) {
            return NextResponse.json({ error: 'Full name is required (2–100 characters).' }, { status: 400 });
        }
        if (typeof emailVal !== 'string' || !emailVal.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim())) {
            return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
        }
        if (typeof phoneVal !== 'string' || phoneVal.trim().length < 7 || phoneVal.trim().length > 20) {
            return NextResponse.json({ error: 'A valid phone number is required.' }, { status: 400 });
        }

        const fullName = fullNameVal.trim();
        const email = emailVal.trim();
        const phone = phoneVal.trim();
        const address = typeof body.address === 'string' ? body.address : '';
        const businessName = typeof body.businessName === 'string' ? body.businessName : '';
        const serviceZipCodes = Array.isArray(body.serviceZipCodes) ? body.serviceZipCodes as string[] : [];

        // Mark this user's profile as a pending contractor application.
        // Use upsert so the row is created if it doesn't exist yet (e.g. if create-profile
        // failed silently during registration). ignoreDuplicates:false ensures role/status
        // are always written even when the row already exists.
        const supabase = createServiceClient();
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert(
                {
                    id: user.id,
                    role: 'contractor',
                    approval_status: 'pending',
                    full_name: fullName,
                    phone,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'id', ignoreDuplicates: false }
            );

        if (updateError) {
            console.error('Profile upsert failed:', updateError.message);
            return NextResponse.json({ error: 'Failed to save application. Please try again.' }, { status: 500 });
        }

        // Send emails — non-fatal: registration succeeds even if email delivery fails
        const emailData = { fullName, email, phone, address, businessName, serviceZipCodes, documentsCount: 0 };
        await Promise.allSettled([
            sendContractorApplication(emailData),          // admin notification
            sendContractorApplicationReceived(emailData),  // applicant confirmation
        ]);

        return NextResponse.json({ success: true, message: "Application submitted successfully." });
    } catch (error) {
        console.error("Contractor registration error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to submit application" },
            { status: 500 }
        );
    }
}
