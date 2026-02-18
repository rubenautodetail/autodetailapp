import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_API_URL || '';
const supabaseKey = process.env.SUPABASE_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials missing in backend .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch a booking from Supabase by its document_id
 */
export async function getSupabaseBooking(documentId: string) {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('document_id', documentId)
        .single();

    if (error) {
        console.error(`❌ Error fetching booking ${documentId} from Supabase:`, error);
        return null;
    }

    return data;
}

/**
 * Update a booking in Supabase
 */
export async function updateSupabaseBooking(documentId: string, updates: any) {
    const { data, error } = await supabase
        .from('bookings')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('document_id', documentId)
        .select()
        .single();

    if (error) {
        console.error(`❌ Error updating booking ${documentId} in Supabase:`, error);
        throw error;
    }

    return data;
}

/**
 * Update booking status and payment status based on Payment Intent
 */
export async function updateBookingPaymentStatus(documentId: string, paymentIntentId: string, status: 'paid' | 'unpaid') {
    return updateSupabaseBooking(documentId, {
        payment_intent_id: paymentIntentId,
        payment_status: status,
        status: status === 'paid' ? 'confirmed' : 'pending'
    });
}
