'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Booking {
    id: string;
    document_id?: string;
    status: string;
    payment_status: string;
    contractor_id: string;
    confirmation_code: string | null;
    date: string;
    time_window: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    total_amount: number | string;
    service_name?: string;
    profiles?: {
        full_name: string;
        phone_number: string;
    };
}

function ApproveServiceContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = (params.id as string).replace('%3A', ':');
    const lang = (params.lang as string) || 'en';
    const confirmationCode = searchParams.get('code');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [resolvedCode, setResolvedCode] = useState<string | null>(confirmationCode);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*, profiles:contractor_id(full_name, phone_number)')
                    .eq('id', bookingId)
                    .single();

                if (error || !data) {
                    setError('Booking not found');
                } else {
                    setBooking(data as Booking);
                    // If no code in URL, use the one from the booking row (RLS ensures only owner can read it)
                    if (!confirmationCode && data.confirmation_code) {
                        setResolvedCode(data.confirmation_code);
                    }
                }
            } catch {
                setError('Failed to load booking');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, confirmationCode]);

    const handleApprove = async () => {
        if (!resolvedCode) {
            setError('Unable to verify booking. Please try again or use the link from your email.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/booking/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking!.id, confirmationCode: resolvedCode }),
            });

            if (res.ok) {
                router.push(`/${lang}/booking/${bookingId}/receipt`);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to approve. Please try again.');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078] mx-auto" />
                    <p className="mt-4 text-[#A5B0D1]">
                        {lang === 'es' ? 'Cargando detalles...' : 'Loading details...'}
                    </p>
                </div>
            </div>
        );
    }

    // ── Error / not found ────────────────────────────────────────────────────
    if (error || !booking) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {lang === 'es' ? 'No encontrado' : 'Not Found'}
                    </h2>
                    <p className="text-[#A5B0D1] mb-6">{error || 'This booking does not exist.'}</p>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        className="bg-[#D0B078] text-[#131835] font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
                    >
                        {lang === 'es' ? 'Volver al Inicio' : 'Return to Home'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Already completed ────────────────────────────────────────────────────
    if (booking.status === 'completed' && booking.payment_status === 'paid') {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {lang === 'es' ? 'Ya Aprobado' : 'Already Approved'}
                    </h2>
                    <p className="text-[#A5B0D1] mb-6">
                        {lang === 'es'
                            ? 'Este servicio ya fue aprobado y el pago fue procesado.'
                            : 'This service has already been approved and payment processed.'}
                    </p>
                    <button
                        onClick={() => router.push(`/${lang}/customer`)}
                        className="bg-[#D0B078] text-[#131835] font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all"
                    >
                        {lang === 'es' ? 'Ver Mis Reservas' : 'View My Bookings'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Cancelled ────────────────────────────────────────────────────────────
    if (booking.status === 'cancelled') {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">
                        {lang === 'es' ? 'Reserva Cancelada' : 'Booking Cancelled'}
                    </h2>
                    <p className="text-[#A5B0D1] mb-6">
                        {lang === 'es'
                            ? 'Esta reserva fue cancelada. Cualquier autorización de pago ha sido liberada.'
                            : 'This booking was cancelled. Any payment authorization has been released.'}
                    </p>
                    <button
                        onClick={() => router.push(`/${lang}/booking/select`)}
                        className="w-full bg-[#D0B078] text-[#131835] font-bold py-3 rounded-xl hover:opacity-90 transition-all mb-3"
                    >
                        {lang === 'es' ? 'Reservar de Nuevo' : 'Book Again'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Main approval screen ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#131835] py-12 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="w-20 h-20 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D0B078]/20">
                        <svg className="w-10 h-10 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {lang === 'es' ? '¡Tu Auto Está Listo!' : 'Your Car is Ready!'}
                    </h1>
                    <p className="text-[#A5B0D1]">
                        {lang === 'es'
                            ? 'Inspecciona el trabajo y aprueba para completar el pago'
                            : 'Inspect the work, then approve to release payment'}
                    </p>
                </div>

                {/* Inspection steps banner */}
                <div className="bg-[#D0B078]/5 border border-[#D0B078]/20 rounded-2xl p-5">
                    <p className="font-bold text-[#D0B078] mb-3 text-sm uppercase tracking-wide">
                        {lang === 'es' ? 'Antes de aprobar:' : 'Before you approve:'}
                    </p>
                    <ol className="space-y-2 text-sm text-[#A5B0D1]">
                        {(lang === 'es' ? [
                            'Sal y camina alrededor de tu vehículo',
                            'Revisa el interior y el exterior',
                            'Confirma que el servicio fue completado a tu satisfacción',
                        ] : [
                            'Walk out to your vehicle and do a full inspection',
                            'Check the interior and exterior thoroughly',
                            'Confirm the service meets your expectations',
                        ]).map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D0B078]/20 text-[#D0B078] flex items-center justify-center text-xs font-bold mt-0.5">
                                    {i + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Service details */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                    <h2 className="font-bold text-white mb-4">
                        {lang === 'es' ? 'Detalles del Servicio' : 'Service Details'}
                    </h2>
                    <div className="space-y-3 text-sm">
                        {[
                            {
                                label: lang === 'es' ? 'Servicio' : 'Service',
                                value: booking.service_name || 'Detail Service',
                            },
                            {
                                label: lang === 'es' ? 'Técnico' : 'Technician',
                                value: booking.profiles?.full_name || (lang === 'es' ? 'No asignado' : 'Not assigned'),
                            },
                            {
                                label: lang === 'es' ? 'Fecha' : 'Date',
                                value: booking.date,
                            },
                            {
                                label: lang === 'es' ? 'Ubicación' : 'Location',
                                value: [booking.address, booking.city, booking.state, booking.zip_code].filter(Boolean).join(', '),
                            },
                            {
                                label: lang === 'es' ? 'Total' : 'Total',
                                value: `$${(Number(booking.total_amount) || 0).toFixed(2)}`,
                                gold: true,
                            },
                        ].map(({ label, value, gold }) => (
                            <div key={label} className="flex justify-between items-start gap-4">
                                <span className="text-[#5E698F] flex-shrink-0">{label}:</span>
                                <span className={`text-right font-medium ${gold ? 'text-[#D0B078] text-base font-bold' : 'text-white'}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="w-full bg-[#D0B078] text-[#131835] font-bold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                        {submitting
                            ? (lang === 'es' ? 'Procesando...' : 'Processing...')
                            : (lang === 'es' ? 'Apruebo — Se Ve Perfecto ✓' : 'Approve — Looks Great ✓')}
                    </button>
                    <button
                        onClick={() => router.push(`/${lang}/booking/${bookingId}/report`)}
                        disabled={submitting}
                        className="w-full bg-transparent text-[#A5B0D1] font-medium py-4 rounded-xl border border-[#2C355E] hover:border-red-400/50 hover:text-red-400 transition-all disabled:opacity-50 text-base"
                    >
                        {lang === 'es' ? 'Reportar un Problema' : 'Report an Issue'}
                    </button>
                </div>

                <p className="text-xs text-[#5E698F] text-center">
                    {lang === 'es'
                        ? 'Si no actúas en 15 minutos, el pago se liberará automáticamente.'
                        : 'If no action is taken within 15 minutes, payment will be automatically released.'}
                </p>
            </div>
        </div>
    );
}

export default function ApproveServicePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#131835] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078]" />
                </div>
            }
        >
            <ApproveServiceContent />
        </Suspense>
    );
}
