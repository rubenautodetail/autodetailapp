'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ReviewBooking {
    id: string;
    confirmation_code: string | null;
    service_name: string | null;
    date: string;
    contractor_id: string | null;
    profiles?: { full_name: string } | null;
}

export default function LeaveReviewPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const lang = (params.lang as string) || 'en';

    const [booking, setBooking] = useState<ReviewBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Review form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const t = {
        title: lang === 'es' ? 'Deja una Reseña' : 'Leave a Review',
        subtitle:
            lang === 'es'
                ? '¿Cómo fue tu experiencia con DetailWash?'
                : 'How was your experience with DetailWash?',
        service: lang === 'es' ? 'Servicio' : 'Service',
        technician: lang === 'es' ? 'Técnico' : 'Technician',
        ratingLabel: lang === 'es' ? 'Tu calificación' : 'Your rating',
        commentLabel: lang === 'es' ? 'Comentarios (opcional)' : 'Comments (optional)',
        commentPlaceholder:
            lang === 'es'
                ? 'Cuéntanos sobre tu experiencia...'
                : 'Tell us about your experience...',
        submit: lang === 'es' ? 'Enviar Reseña' : 'Submit Review',
        submitting: lang === 'es' ? 'Enviando...' : 'Submitting...',
        skipLabel: lang === 'es' ? 'Omitir por ahora' : 'Skip for now',
        bookAgain: lang === 'es' ? 'Reservar Nuevamente' : 'Book Again',
        thankYouTitle: lang === 'es' ? '¡Gracias por tu reseña!' : 'Thank you for your review!',
        thankYouSub:
            lang === 'es'
                ? 'Tu opinión nos ayuda a mejorar nuestros servicios.'
                : 'Your feedback helps us improve our service.',
        ratingRequired: lang === 'es' ? 'Por favor selecciona una calificación.' : 'Please select a rating.',
        notFound: lang === 'es' ? 'Reserva no encontrada.' : 'Booking not found.',
        home: lang === 'es' ? 'Volver al Inicio' : 'Return to Home',
        stars: ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'],
        starsEs: ['Terrible', 'Malo', 'Regular', 'Bueno', 'Excelente'],
    };

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const supabase = createClient();
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('id, confirmation_code, service_name, date, contractor_id')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !data) {
                    setError(t.notFound);
                } else {
                    setBooking(data as unknown as ReviewBooking);
                }
            } catch {
                setError(t.notFound);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError(t.ratingRequired);
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({
                    bookingId: booking?.id,
                    rating,
                    comment: comment.trim(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    // Already reviewed — treat as success
                    setSubmitted(true);
                    return;
                }
                setError(data.error || (lang === 'es' ? 'Error al enviar la reseña.' : 'Failed to submit review. Please try again.'));
                return;
            }

            setSubmitted(true);
        } catch {
            setError(lang === 'es' ? 'Error de conexión. Intenta de nuevo.' : 'Connection error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078]" />
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────
    if (!booking) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center max-w-md w-full">
                    <p className="text-[#A5B0D1] mb-6">{error || t.notFound}</p>
                    <Link
                        href={`/${lang}`}
                        className="inline-block px-6 py-2.5 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90"
                    >
                        {t.home}
                    </Link>
                </div>
            </div>
        );
    }

    // ── Success state ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-10 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#D0B078]/20">
                        <svg className="w-8 h-8 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t.thankYouTitle}</h2>
                    <p className="text-[#A5B0D1] mb-8">{t.thankYouSub}</p>
                    <Link
                        href={`/${lang}/booking/select`}
                        className="block w-full py-3 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 transition-all text-center"
                    >
                        {t.bookAgain}
                    </Link>
                    <Link
                        href={`/${lang}`}
                        className="block w-full py-3 mt-3 text-[#A5B0D1] text-sm hover:text-white transition-colors text-center"
                    >
                        {t.home}
                    </Link>
                </div>
            </div>
        );
    }

    // ── Review form ──────────────────────────────────────────────────────────
    const contractorName =
        booking.profiles && 'full_name' in booking.profiles
            ? (booking.profiles as { full_name: string }).full_name
            : '—';

    return (
        <div className="min-h-screen bg-[#131835] py-12 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D0B078]/20">
                        <svg className="w-8 h-8 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                    <p className="text-[#A5B0D1] mt-1 text-sm">{t.subtitle}</p>
                </div>

                {/* Booking summary */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] px-6 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[#5E698F]">{t.service}</span>
                        <span className="text-white font-medium">{booking.service_name || 'Auto Detail'}</span>
                    </div>
                    {contractorName !== '—' && (
                        <div className="flex justify-between items-center text-sm mt-2">
                            <span className="text-[#5E698F]">{t.technician}</span>
                            <span className="text-white font-medium">{contractorName}</span>
                        </div>
                    )}
                </div>

                {/* Star rating */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                    <p className="text-sm font-semibold text-[#A5B0D1] uppercase tracking-wide mb-4">
                        {t.ratingLabel}
                    </p>
                    <div className="flex justify-center gap-3 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const filled = star <= (hoverRating || rating);
                            return (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                >
                                    <svg
                                        className={`w-10 h-10 transition-colors ${
                                            filled ? 'text-[#D0B078]' : 'text-[#2C355E]'
                                        }`}
                                        fill={filled ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={filled ? 0 : 1.5}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            );
                        })}
                    </div>
                    {(hoverRating || rating) > 0 && (
                        <p className="text-center text-sm text-[#D0B078] font-medium">
                            {lang === 'es'
                                ? t.starsEs[(hoverRating || rating) - 1]
                                : t.stars[(hoverRating || rating) - 1]}
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                    <label className="block text-sm font-semibold text-[#A5B0D1] uppercase tracking-wide mb-3">
                        {t.commentLabel}
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t.commentPlaceholder}
                        rows={4}
                        className="w-full bg-[#131835] border border-[#2C355E] rounded-xl px-4 py-3 text-white text-sm placeholder-[#4A5578] focus:outline-none focus:ring-2 focus:ring-[#D0B078]/40 focus:border-[#D0B078]/60 transition-all resize-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-4 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                        {submitting ? t.submitting : t.submit}
                    </button>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        className="w-full py-3 text-[#A5B0D1] text-sm hover:text-white transition-colors"
                    >
                        {t.skipLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
