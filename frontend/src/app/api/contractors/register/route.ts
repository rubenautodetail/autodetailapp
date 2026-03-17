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
        const address = typeof body.address === 'string' ? body.address.trim() : '';
        const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
        const serviceZipCodes = Array.isArray(body.serviceZipCodes) ? body.serviceZipCodes as string[] : [];
        const paymentPreference = typeof body.paymentPreference === 'string' ? body.paymentPreference.trim() : '';

        const VALID_PAYMENT = ['direct_deposit', 'zelle', 'check', 'cash'];
        if (paymentPreference && !VALID_PAYMENT.includes(paymentPreference)) {
            return NextResponse.json({ error: 'Invalid payment preference.' }, { status: 400 });
        }

        const zelleContact      = typeof body.zelleContact      === 'string' ? body.zelleContact.trim()      : '';
        const bankName          = typeof body.bankName          === 'string' ? body.bankName.trim()          : '';
        const bankAccountNumber = typeof body.bankAccountNumber === 'string' ? body.bankAccountNumber.trim() : '';
        const bankRoutingNumber = typeof body.bankRoutingNumber === 'string' ? body.bankRoutingNumber.trim() : '';
        const bankAccountType   = typeof body.bankAccountType   === 'string' ? body.bankAccountType.trim()   : '';

        const VALID_ACCOUNT_TYPES = ['checking', 'savings'];
        if (bankAccountType && !VALID_ACCOUNT_TYPES.includes(bankAccountType)) {
            return NextResponse.json({ error: 'Invalid bank account type.' }, { status: 400 });
        }

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
                    address: address || null,
                    business_name: businessName || null,
                    service_area_zips: serviceZipCodes.length ? serviceZipCodes : null,
                    payment_preference: paymentPreference || null,
                    zelle_contact: zelleContact || null,
                    bank_name: bankName || null,
                    bank_account_number: bankAccountNumber || null,
                    bank_routing_number: bankRoutingNumber || null,
                    bank_account_type: bankAccountType || null,
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
