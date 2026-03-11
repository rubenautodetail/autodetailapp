'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const ISSUE_TYPES = [
    { value: 'incomplete', en: 'Service appears incomplete', es: 'Servicio parece incompleto' },
    { value: 'quality', en: 'Quality concerns', es: 'Problemas de calidad' },
    { value: 'damage', en: 'Vehicle damage', es: 'Daño al vehículo' },
    { value: 'different', en: 'Different than expected', es: 'Diferente a lo esperado' },
    { value: 'other', en: 'Other issue', es: 'Otro problema' },
];

export default function ReportIssuePage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const lang = (params.lang as string) || 'en';

    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!issueType || !description.trim()) {
            setError(lang === 'es'
                ? 'Por favor selecciona un tipo de problema y proporciona una descripción.'
                : 'Please select an issue type and provide a description.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/booking/report-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, issueType, description }),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(lang === 'es'
                    ? 'Error al enviar el reporte. Por favor inténtalo de nuevo.'
                    : 'Failed to submit report. Please try again or contact support.');
            }
        } catch {
            setError(lang === 'es'
                ? 'Ocurrió un error. Por favor inténtalo de nuevo.'
                : 'An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success state ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-[#D0B078]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D0B078]/20">
                        <svg className="w-8 h-8 text-[#D0B078]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {lang === 'es' ? 'Reporte Enviado' : 'Report Submitted'}
                    </h2>
                    <p className="text-[#A5B0D1] mb-2">
                        {lang === 'es'
                            ? 'Nuestro equipo revisará tu reporte y te contactará en 24 horas.'
                            : 'Our support team will review your report and contact you within 24 hours.'}
                    </p>
                    <p className="text-[#5E698F] text-sm mb-8">
                        {lang === 'es'
                            ? 'Tu pago NO será capturado mientras revisamos el problema.'
                            : 'Your payment will NOT be captured while we review the issue.'}
                    </p>
                    <button
                        onClick={() => router.push(`/${lang}/dashboard`)}
                        className="w-full bg-[#D0B078] text-[#131835] font-bold py-3 rounded-xl hover:opacity-90 transition-all"
                    >
                        {lang === 'es' ? 'Ver Mis Reservas' : 'View My Bookings'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Report form ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#131835] py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {lang === 'es' ? 'Reportar un Problema' : 'Report an Issue'}
                    </h1>
                    <p className="text-[#A5B0D1]">
                        {lang === 'es'
                            ? 'Lamentamos que no estés satisfecho. Por favor danos los detalles.'
                            : "We're sorry to hear you're not satisfied. Please provide details below."}
                    </p>
                </div>

                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Issue type */}
                        <div>
                            <label className="block text-sm font-semibold text-[#A5B0D1] mb-3 uppercase tracking-wide">
                                {lang === 'es' ? '¿Qué tipo de problema tienes?' : 'What type of issue are you experiencing?'}
                            </label>
                            <div className="space-y-2">
                                {ISSUE_TYPES.map((type) => (
                                    <label
                                        key={type.value}
                                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                                            issueType === type.value
                                                ? 'border-[#D0B078] bg-[#D0B078]/5'
                                                : 'border-[#2C355E] hover:border-white/20'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="issueType"
                                            value={type.value}
                                            checked={issueType === type.value}
                                            onChange={(e) => setIssueType(e.target.value)}
                                            className="w-4 h-4 flex-shrink-0"
                                            style={{ accentColor: '#D0B078' }}
                                        />
                                        <span className="text-sm text-white">
                                            {lang === 'es' ? type.es : type.en}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-[#A5B0D1] mb-2 uppercase tracking-wide">
                                {lang === 'es' ? 'Describe el problema en detalle' : 'Describe the issue in detail'}
                            </label>
                            <textarea
                                id="description"
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-[#2C355E] rounded-xl text-white placeholder:text-[#5E698F] focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-all resize-none"
                                style={{ fontSize: '16px' }}
                                placeholder={lang === 'es'
                                    ? 'Proporciona tantos detalles como sea posible...'
                                    : 'Provide as much detail as possible to help us resolve your concern...'}
                            />
                            <p className="mt-2 text-xs text-[#5E698F]">
                                {lang === 'es'
                                    ? 'Incluye áreas específicas de preocupación o cualquier problema visible.'
                                    : 'Include specific areas of concern, visible issues, or other relevant details.'}
                            </p>
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

                        {/* Submit */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-red-500/90 text-white font-bold py-4 rounded-xl hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? (lang === 'es' ? 'Enviando...' : 'Submitting...')
                                    : (lang === 'es' ? 'Enviar Reporte' : 'Submit Report')}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                disabled={submitting}
                                className="flex-1 bg-transparent text-[#A5B0D1] font-medium py-4 rounded-xl border border-[#2C355E] hover:border-white/20 hover:text-white transition-all disabled:opacity-50"
                            >
                                {lang === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                        </div>

                        {/* Support contact */}
                        <div className="pt-4 border-t border-[#2C355E] text-center">
                            <p className="text-sm text-[#5E698F]">
                                {lang === 'es' ? 'Para asuntos urgentes, llámanos al ' : 'For urgent matters, call us at '}
                                <a
                                    href="tel:+13055550000"
                                    className="text-[#D0B078] hover:underline font-medium"
                                >
                                    (305) 000-0000
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
