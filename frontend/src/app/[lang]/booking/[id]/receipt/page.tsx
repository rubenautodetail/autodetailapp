'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Star, ChevronRight } from 'lucide-react';

interface ReceiptBooking {
    id: string;
    confirmation_code: string | null;
    status: string | null;
    payment_status: string | null;
    date: string;
    time_window: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    customer_name: string | null;
    total_amount: number | string;
    service_name: string | null;
    services?: { name: string };
    profiles?: { full_name: string };
}

export default function ReceiptPage() {
    const params = useParams();
    const bookingId = params.id as string;
    const lang = (params.lang as string) || 'en';
    const isEs = lang === 'es';

    const [booking, setBooking] = useState<ReceiptBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const supabase = createClient();
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, services:service_id(name), profiles:contractor_id(full_name)')
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
                    .single();

                if (fetchError || !data) {
                    setError(isEs ? 'Recibo no encontrado.' : 'Receipt not found.');
                } else {
                    setBooking(data as ReceiptBooking);
                }
            } catch {
                setError(isEs ? 'Error al cargar el recibo.' : 'Failed to load receipt.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, isEs]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
                <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
                    <p className="text-text-secondary mb-6">{error}</p>
                    <Link href={`/${lang}`} className="px-6 py-2 btn-primary rounded-xl font-bold">
                        {isEs ? 'Volver al Inicio' : 'Return to Home'}
                    </Link>
                </div>
            </div>
        );
    }

    const serviceName = booking.services?.name || booking.service_name || 'Detailing Service';
    const contractorName = booking.profiles?.full_name || '—';
    const formattedDate = booking.date
        ? new Date(booking.date).toLocaleDateString(isEs ? 'es-US' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '—';

    return (
        <div className="min-h-screen bg-bg-primary py-12 px-4">
            <div className="max-w-lg mx-auto">
                {/* Success header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-accent-gold/10 border border-accent-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-accent-gold" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        {isEs ? 'Recibo de Pago' : 'Payment Receipt'}
                    </h1>
                    <p className="text-text-secondary mt-2">
                        {isEs ? '¡Gracias por elegir DetailWash!' : 'Thank you for choosing DetailWash!'}
                    </p>
                    <p className="text-text-muted text-sm mt-1">
                        {isEs ? 'Tu pago ha sido procesado exitosamente.' : 'Your payment has been processed successfully.'}
                    </p>
                </div>

                {/* Receipt card */}
                <div className="glass-card rounded-2xl overflow-hidden mb-6">
                    {/* Confirmation code banner */}
                    {booking.confirmation_code && (
                        <div className="bg-accent-gold/10 border-b border-accent-gold/20 px-6 py-4 text-center">
                            <p className="text-accent-gold/70 text-xs uppercase tracking-widest mb-1">
                                {isEs ? 'Código de Confirmación' : 'Confirmation Code'}
                            </p>
                            <p className="text-accent-gold text-2xl font-bold tracking-widest font-mono">
                                {booking.confirmation_code}
                            </p>
                        </div>
                    )}

                    <div className="px-6 py-2 divide-y divide-white/5">
                        <ReceiptRow label={isEs ? 'Servicio' : 'Service'} value={serviceName} />
                        <ReceiptRow label={isEs ? 'Fecha' : 'Date'} value={formattedDate} />
                        {booking.time_window && (
                            <ReceiptRow label={isEs ? 'Hora' : 'Time'} value={booking.time_window} />
                        )}
                        {booking.address && (
                            <ReceiptRow
                                label={isEs ? 'Ubicación' : 'Location'}
                                value={`${booking.address}, ${booking.city || ''}, ${booking.state || ''} ${booking.zip_code || ''}`}
                            />
                        )}
                        <ReceiptRow label={isEs ? 'Técnico' : 'Technician'} value={contractorName} />
                        <div className="flex justify-between items-center py-4">
                            <span className="text-sm font-bold text-white">
                                {isEs ? 'Total Cobrado' : 'Total Charged'}
                            </span>
                            <span className="text-xl font-bold text-accent-gold">
                                ${Number(booking.total_amount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <Link
                        href={`/${lang}/booking/${bookingId}/review`}
                        className="flex items-center justify-center gap-2 w-full py-3 btn-primary rounded-xl font-bold"
                    >
                        <Star className="w-4 h-4 fill-current" />
                        {isEs ? 'Dejar una Reseña' : 'Leave a Review'}
                    </Link>
                    <Link
                        href={`/${lang}/booking/select?service=${encodeURIComponent(serviceName)}`}
                        className="flex items-center justify-center gap-2 w-full py-3 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl font-semibold transition-all"
                    >
                        {isEs ? 'Reservar Nuevamente' : 'Book Again'}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href={`/${lang}/customer`}
                        className="block w-full text-center py-3 text-text-muted text-sm hover:text-text-secondary transition-colors"
                    >
                        {isEs ? 'Volver al Panel' : 'Back to Dashboard'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-3 gap-4">
            <span className="text-sm text-text-muted shrink-0">{label}</span>
            <span className="text-sm text-text-secondary text-right">{value}</span>
        </div>
    );
}
