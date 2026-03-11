'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
    const router = useRouter();
    const bookingId = params.id as string;
    const lang = (params.lang as string) || 'en';

    const [booking, setBooking] = useState<ReceiptBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*, services:service_id(name), profiles:contractor_id(full_name)')
                    .or(`id.eq.${bookingId},document_id.eq.${bookingId}`)
                    .single();

                if (error || !data) {
                    setError('Booking not found.');
                } else {
                    setBooking(data as ReceiptBooking);
                }
            } catch {
                setError('Failed to load receipt.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId]);

    const t = {
        title: lang === 'es' ? 'Recibo de Pago' : 'Payment Receipt',
        thankYou: lang === 'es' ? '¡Gracias por elegir Rubens Auto Detail!' : 'Thank you for choosing Rubens Auto Detail!',
        paymentProcessed: lang === 'es' ? 'Tu pago ha sido procesado exitosamente.' : 'Your payment has been processed successfully.',
        service: lang === 'es' ? 'Servicio' : 'Service',
        date: lang === 'es' ? 'Fecha' : 'Date',
        time: lang === 'es' ? 'Hora' : 'Time',
        location: lang === 'es' ? 'Ubicación' : 'Location',
        contractor: lang === 'es' ? 'Técnico' : 'Technician',
        total: lang === 'es' ? 'Total Cobrado' : 'Total Charged',
        confirmation: lang === 'es' ? 'Código de Confirmación' : 'Confirmation Code',
        leaveReview: lang === 'es' ? 'Dejar una Reseña' : 'Leave a Review',
        bookAgain: lang === 'es' ? 'Reservar Nuevamente' : 'Book Again',
        home: lang === 'es' ? 'Volver al Inicio' : 'Return to Home',
        notFound: lang === 'es' ? 'Recibo no encontrado.' : 'Receipt not found.',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
                    <p className="text-gray-600 mb-6">{error || t.notFound}</p>
                    <Link href={`/${lang}`} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {t.home}
                    </Link>
                </div>
            </div>
        );
    }

    const serviceName =
        booking.services?.name || booking.service_name || 'Detailing Service';
    const contractorName = booking.profiles?.full_name || '—';
    const formattedDate = booking.date
        ? new Date(booking.date).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '—';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-lg mx-auto">
                {/* Success header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                    <p className="text-gray-600 mt-2">{t.thankYou}</p>
                    <p className="text-gray-500 text-sm mt-1">{t.paymentProcessed}</p>
                </div>

                {/* Receipt card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    {/* Confirmation code banner */}
                    {booking.confirmation_code && (
                        <div className="bg-blue-600 px-6 py-4 text-center">
                            <p className="text-blue-100 text-xs uppercase tracking-widest mb-1">{t.confirmation}</p>
                            <p className="text-white text-2xl font-bold tracking-widest">{booking.confirmation_code}</p>
                        </div>
                    )}

                    <div className="px-6 py-6 divide-y divide-gray-100">
                        <ReceiptRow label={t.service} value={serviceName} />
                        <ReceiptRow label={t.date} value={formattedDate} />
                        {booking.time_window && (
                            <ReceiptRow label={t.time} value={booking.time_window} />
                        )}
                        {booking.address && (
                            <ReceiptRow
                                label={t.location}
                                value={`${booking.address}, ${booking.city || ''}, ${booking.state || ''} ${booking.zip_code || ''}`}
                            />
                        )}
                        <ReceiptRow label={t.contractor} value={contractorName} />
                        <div className="flex justify-between py-4">
                            <span className="text-base font-bold text-gray-900">{t.total}</span>
                            <span className="text-base font-bold text-blue-600">
                                ${Number(booking.total_amount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <Link
                        href={`/${lang}/booking/${bookingId}/review`}
                        className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        ⭐ {t.leaveReview}
                    </Link>
                    <Link
                        href={`/${lang}/booking/select`}
                        className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        {t.bookAgain}
                    </Link>
                    <Link
                        href={`/${lang}`}
                        className="block w-full text-center px-6 py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                        {t.home}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-3 gap-4">
            <span className="text-sm font-medium text-gray-500 shrink-0">{label}</span>
            <span className="text-sm text-gray-900 text-right">{value}</span>
        </div>
    );
}
