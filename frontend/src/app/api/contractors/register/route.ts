import { NextRequest, NextResponse } from "next/server";
import { sendContractorApplication, sendContractorApplicationReceived } from "@/lib/email";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// NOTE: Requires a 'contractor-docs' storage bucket in Supabase Dashboard:
//   Storage → New bucket → Name: "contractor-docs" → Public: OFF (private)

async function uploadDocument(
    supabase: ReturnType<typeof createServiceClient>,
    file: File,
    email: string,
    docType: string
): Promise<string | null> {
    try {
        const ext = file.name.split('.').pop() || 'bin';
        const safeName = email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const path = `${safeName}/${docType}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error } = await supabase.storage
            .from('contractor-docs')
            .upload(path, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true,
            });

        if (error) {
            console.error(`Storage upload failed for ${docType}:`, error.message);
            return null;
        }

        // Return the storage path; admin can generate signed URLs from dashboard
        return path;
    } catch (err) {
        console.error(`Upload error for ${docType}:`, err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    // Must be authenticated — no anonymous applications
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Authentication required. Create an account first.' }, { status: 401 });
    }

    // Reject suspiciously large payloads before parsing (10 MB limit for 3 documents)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Request body too large (max 10 MB).' }, { status: 413 });
    }

    try {
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
        }

        const fullNameVal = formData.get("fullName");
        const emailVal = formData.get("email");
        const phoneVal = formData.get("phone");

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
        const address = formData.get("address") as string;
        const businessName = formData.get("businessName") as string;
        const serviceZipCodesStr = formData.get("serviceZipCodes") as string;

        let serviceZipCodes: string[] = [];
        try {
            serviceZipCodes = JSON.parse(serviceZipCodesStr || "[]");
        } catch (e) {
            console.error("Failed to parse zip codes", e);
        }

        const driversLicense = formData.get("driversLicense") as File | null;
        const vehicleInsurance = formData.get("vehicleInsurance") as File | null;
        const businessLicense = formData.get("businessLicense") as File | null;

        // Upload documents to Supabase Storage (non-fatal: email still sends if upload fails)
        const supabase = createServiceClient();
        const uploadResults: Record<string, string | null> = {};

        if (driversLicense) {
            uploadResults.driversLicense = await uploadDocument(supabase, driversLicense, email, 'drivers_license');
        }
        if (vehicleInsurance) {
            uploadResults.vehicleInsurance = await uploadDocument(supabase, vehicleInsurance, email, 'vehicle_insurance');
        }
        if (businessLicense) {
            uploadResults.businessLicense = await uploadDocument(supabase, businessLicense, email, 'business_license');
        }

        const documentsCount = Object.values(uploadResults).filter(Boolean).length
            + (driversLicense && !uploadResults.driversLicense ? 1 : 0)
            + (vehicleInsurance && !uploadResults.vehicleInsurance ? 1 : 0)
            + (businessLicense && !uploadResults.businessLicense ? 1 : 0);

        // Mark this user's profile as a pending contractor application
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role: 'contractor',
                approval_status: 'pending',
                full_name: fullName,
                phone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Profile update failed:', updateError.message);
            return NextResponse.json({ error: 'Failed to save application. Please try again.' }, { status: 500 });
        }

        // Send emails — non-fatal: registration succeeds even if email delivery fails
        const emailData = { fullName, email, phone, address, businessName, serviceZipCodes, documentsCount };
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
