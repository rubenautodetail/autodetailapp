import { NextRequest, NextResponse } from "next/server";
import { sendContractorApplication } from "@/lib/email";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

    try {
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
        }

        const fullName = formData.get("fullName") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
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
        await supabase
            .from('profiles')
            .update({
                approval_status: 'pending',
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        // Send admin notification email with application details
        await sendContractorApplication({
            fullName,
            email,
            phone,
            address,
            businessName,
            serviceZipCodes,
            documentsCount,
        });

        return NextResponse.json({ success: true, message: "Application submitted successfully." });
    } catch (error: any) {
        console.error("Contractor registration error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to submit application" },
            { status: 500 }
        );
    }
}
