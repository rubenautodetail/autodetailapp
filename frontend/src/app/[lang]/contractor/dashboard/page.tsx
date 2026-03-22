"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

// Supabase browser client for realtime — uses anon key (safe for client-side)
const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardProps {
    params: Promise<{ lang: "en" | "es" }>;
}

const t = {
    en: {
        title: "Contractor Dashboard",
        welcome: "Welcome back,",
        incomingJobs: "Incoming Jobs",
        activeJobs: "My Active Jobs",
        earnings: "Earnings",
        thisWeek: "This Week",
        total: "Total Earned",
        activeCount: "Active",
        incoming: "Incoming",
        available: "Available for jobs",
        unavailable: "Unavailable",
        noIncoming: "No incoming jobs right now",
        noIncomingDesc: "New jobs will appear here as customers book.",
        noActive: "No active jobs",
        noActiveDesc: "Jobs you accept will appear here.",
        accept: "Accept Job",
        reject: "Skip",
        viewJob: "View Job",
        area: "Area",
        date: "Date",
        time: "Time",
        payout: "Payout",
        status: "Status",
        loading: "Loading dashboard...",
        error: "Error loading dashboard",
        retry: "Retry",
        setupPayments: "Add your payment info",
        setupDesc: "Enter your Zelle or bank details in Settings so we can pay you for completed jobs.",
        setupBtn: "Go to Settings",
        statusMap: {
            pending_assignment: "Pending Assignment",
            confirmed: "Confirmed",
            in_progress: "In Progress",
            pending_approval: "Awaiting Approval",
        } as Record<string, string>,
    },
    es: {
        title: "Panel del Contratista",
        welcome: "Bienvenido,",
        incomingJobs: "Trabajos Disponibles",
        activeJobs: "Mis Trabajos Activos",
        earnings: "Ganancias",
        thisWeek: "Esta Semana",
        total: "Total Ganado",
        activeCount: "Activos",
        incoming: "Entrantes",
        available: "Disponible para trabajos",
        unavailable: "No disponible",
        noIncoming: "No hay trabajos disponibles ahora",
        noIncomingDesc: "Los nuevos trabajos aparecerán aquí cuando los clientes reserven.",
        noActive: "No hay trabajos activos",
        noActiveDesc: "Los trabajos que aceptes aparecerán aquí.",
        accept: "Aceptar",
        reject: "Omitir",
        viewJob: "Ver Trabajo",
        area: "Área",
        date: "Fecha",
        time: "Hora",
        payout: "Pago",
        status: "Estado",
        loading: "Cargando panel...",
        error: "Error al cargar el panel",
        retry: "Reintentar",
        setupPayments: "Agrega tu info de pago",
        setupDesc: "Ingresa tu Zelle o datos bancarios en Configuración para que podamos pagarte por los trabajos completados.",
        setupBtn: "Ir a Configuración",
        statusMap: {
            pending_assignment: "Pendiente de Asignación",
            confirmed: "Confirmado",
            in_progress: "En Progreso",
            pending_approval: "Esperando Aprobación",
        } as Record<string, string>,
    },
};

function StatusBadge({ status, lang }: { status: string; lang: "en" | "es" }) {
    const labels = t[lang].statusMap;
    const label = labels[status] || status;
    const colors: Record<string, string> = {
        pending_assignment: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        pending_approval: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || "bg-white/10 text-white/60 border-white/10"}`}>
            {label}
        </span>
    );
}

export default function ContractorDashboard({ params }: DashboardProps) {
    const { lang } = use(params);
    const labels = t[lang];
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentInfoSet, setPaymentInfoSet] = useState<boolean | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [togglingAvailability, setTogglingAvailability] = useState(false);
    const [bannerMessage, setBannerMessage] = useState<string | null>(null);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [earningSummary, setEarningSummary] = useState<{
        totalEarned: number;
        thisMonthEarned: number;
        pendingPayout: number;
        completedJobs: number;
    } | null>(null);

    // ── Realtime / alert state ────────────────────────────────────────────────
    const [incomingPulse, setIncomingPulse] = useState(false);
    // Track pulse timeout so we can clear it on unmount
    const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /** Two-tone beep via Web Audio API — no external library required. */
    const playAlert = () => {
        try {
            const AudioCtx = window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {
            // Browser blocked audio — non-fatal
        }
    };

    /** Flash the "Incoming Jobs" card ring for 3 seconds. */
    const triggerPulse = () => {
        setIncomingPulse(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => setIncomingPulse(false), 3000);
    };

    useEffect(() => {
        loadDashboard();
        if (isAuthenticated) {
            checkPaymentInfo();
            fetchAvailability();
            fetchEarningSummary();
        } else {
            setPaymentInfoSet(true);
        }
        // Fetch the Hygraph contractor notice banner
        fetch(`/api/contractors/banner?locale=${lang}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.banner?.message) setBannerMessage(data.banner.message);
            })
            .catch(() => { /* non-fatal */ });
    }, [authLoading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Supabase realtime subscription for new pending_assignment bookings ────
    useEffect(() => {
        const channel = supabaseClient
            .channel("incoming-jobs")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "bookings",
                    filter: "status=eq.pending_assignment",
                },
                () => {
                    loadDashboard();
                    playAlert();
                    triggerPulse();
                }
            )
            .subscribe();

        return () => {
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
            supabaseClient.removeChannel(channel);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const checkPaymentInfo = async () => {
        try {
            const res = await fetch('/api/contractors/profile', {
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setPaymentInfoSet(!!data.profile?.payment_preference);
            }
        } catch { /* non-fatal */ }
    };

    const fetchEarningSummary = async () => {
        if (!session?.access_token) return;
        try {
            const res = await fetch('/api/contractor/earnings/summary', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEarningSummary(data);
            }
        } catch { /* non-fatal */ }
    };

    const fetchAvailability = async () => {
        try {
            const res = await fetch('/api/contractors/profile', {
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                // Profile API returns { success, profile } — read the nested profile field
                setIsAvailable(data.profile?.is_available ?? true);
            }
        } catch { /* non-fatal — keep default true */ }
    };

    const handleToggleAvailability = async () => {
        const next = !isAvailable;
        setIsAvailable(next); // optimistic update
        setTogglingAvailability(true);
        try {
            await fetch('/api/contractors/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ is_available: next }),
            });
        } catch {
            // Revert on failure
            setIsAvailable(!next);
        } finally {
            setTogglingAvailability(false);
        }
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contractors/dashboard', {
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setDashboardData(data);
            setError(null);
            // Persist incoming count so the layout's bottom nav dot stays in sync
            const count: number = data?.incomingJobs?.length ?? 0;
            try {
                localStorage.setItem('contractor_incoming_count', String(count));
            } catch {
                // Private-browsing mode may block localStorage — non-fatal
            }
        } catch {
            setError(labels.error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptJob = async (bookingId: string) => {
        setAcceptingId(bookingId);
        try {
            const res = await fetch('/api/contractors/accept-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId }),
            });
            if (res.ok) {
                loadDashboard();
            } else if (res.status === 409) {
                // Job was already claimed by another contractor
                const body = await res.json().catch(() => ({ error: '' }));
                alert(lang === 'es'
                    ? 'Este trabajo ya fue aceptado por otro contratista.'
                    : (body as { error?: string }).error || 'This job has already been accepted by another contractor.');
                loadDashboard(); // Refresh to remove the claimed job from the list
            }
        } catch { /* non-fatal */ }
        finally { setAcceptingId(null); }
    };

    const handleRejectJob = async (bookingId: string) => {
        setRejectingId(bookingId);
        try {
            const res = await fetch('/api/contractors/reject-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId }),
            });
            if (res.ok) loadDashboard();
        } catch { /* non-fatal */ }
        finally { setRejectingId(null); }
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#131835] py-8 px-4">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="h-9 w-56 bg-white/5 rounded-lg animate-pulse" />
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-3 shrink-0 sm:shrink">
                                <div className="h-2.5 w-14 bg-white/10 rounded animate-pulse mb-2" />
                                <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6 space-y-4">
                        <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="border border-[#2C355E] rounded-xl p-4 flex justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-44 bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                                </div>
                                <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-red-400 font-medium mb-4">{error}</p>
                    <button
                        onClick={loadDashboard}
                        className="px-6 py-2.5 bg-[#D0B078] text-[#131835] font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                        {labels.retry}
                    </button>
                </div>
            </div>
        );
    }

    const incomingJobs: any[] = dashboardData?.incomingJobs ?? [];
    const activeJobs: any[] = dashboardData?.activeJobs ?? [];

    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Payment Info Banner */}
                {paymentInfoSet === false && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-amber-300 text-base">⚡ {labels.setupPayments}</h3>
                            <p className="text-sm text-amber-400/80 mt-1">{labels.setupDesc}</p>
                        </div>
                        <Link
                            href={`/${lang}/contractor/settings`}
                            className="shrink-0 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
                        >
                            {labels.setupBtn}
                        </Link>
                    </div>
                )}

                {/* Hygraph Notice Banner */}
                {bannerMessage && bannerVisible && (
                    <div className="relative bg-blue-500/10 border border-blue-400/25 rounded-2xl px-5 py-4 flex items-start gap-3">
                        {/* Icon */}
                        <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-blue-400/15 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        {/* Message */}
                        <p className="text-sm text-blue-200 leading-relaxed flex-1">{bannerMessage}</p>
                        {/* Dismiss button */}
                        <button
                            onClick={() => setBannerVisible(false)}
                            aria-label="Dismiss"
                            className="shrink-0 ml-2 text-blue-400/60 hover:text-blue-300 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{labels.title}</h1>
                        {dashboardData?.contractor && (
                            <p className="mt-1 text-[#A5B0D1] text-base">
                                {labels.welcome} <span className="text-[#D0B078] font-medium">{dashboardData.contractor.name}</span>
                            </p>
                        )}
                    </div>
                    {/* Availability toggle */}
                    <button
                        onClick={handleToggleAvailability}
                        disabled={togglingAvailability}
                        className={`self-start mt-1 sm:mt-0 bg-[#1A2142] border rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 ${
                            isAvailable
                                ? 'border-green-500/40 hover:border-green-400/60'
                                : 'border-[#2C355E] hover:border-white/20'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isAvailable ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-[#5E698F]'}`} />
                        <span className={`text-sm font-medium ${isAvailable ? 'text-green-300' : 'text-[#A5B0D1]'}`}>
                            {isAvailable ? labels.available : labels.unavailable}
                        </span>
                    </button>
                </div>

                {/* Stats strip — scrollable on mobile, 4-col grid on desktop */}
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
                    {/* Incoming */}
                    <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-3 shrink-0 sm:shrink sm:col-span-1">
                        <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">{labels.incoming}</p>
                        <p className="text-2xl font-bold text-[#D0B078]">{incomingJobs.length}</p>
                    </div>
                    {/* Active */}
                    <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-3 shrink-0 sm:shrink sm:col-span-1">
                        <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">{labels.activeCount}</p>
                        <p className="text-2xl font-bold text-blue-400">{activeJobs.length}</p>
                    </div>
                    {/* This Week */}
                    <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-3 shrink-0 sm:shrink sm:col-span-1">
                        <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">{labels.thisWeek}</p>
                        <p className="text-2xl font-bold text-green-400">${(dashboardData?.earnings?.thisWeek || 0).toFixed(2)}</p>
                    </div>
                    {/* Total */}
                    <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl px-4 py-3 shrink-0 sm:shrink sm:col-span-1">
                        <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">{labels.total}</p>
                        <p className="text-2xl font-bold text-white">${(dashboardData?.earnings?.total || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* Earnings Summary Card */}
                {earningSummary && (
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2C355E] flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                                {lang === 'es' ? 'Resumen de Ganancias' : 'Earnings Overview'}
                            </h2>
                            <Link
                                href={`/${lang}/contractor/earnings`}
                                className="text-xs text-[#D0B078] hover:text-white transition-colors font-medium"
                            >
                                {lang === 'es' ? 'Ver historial →' : 'Full history →'}
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#2C355E]">
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Total Ganado' : 'Total Earned'}
                                </p>
                                <p className="text-xl font-bold text-white">${earningSummary.totalEarned.toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Este Mes' : 'This Month'}
                                </p>
                                <p className="text-xl font-bold text-[#D0B078]">${earningSummary.thisMonthEarned.toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Por Cobrar' : 'Pending Payout'}
                                </p>
                                <p className="text-xl font-bold text-amber-400">${earningSummary.pendingPayout.toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Trabajos Completados' : 'Jobs Completed'}
                                </p>
                                <p className="text-xl font-bold text-green-400">{earningSummary.completedJobs}</p>
                            </div>
                        </div>
                        <div className="px-6 py-2.5 border-t border-[#2C355E]">
                            <p className="text-[10px] text-[#5E698F]">
                                {lang === 'es'
                                    ? 'Todos los montos reflejan tu parte neta (85% del total del servicio).'
                                    : 'All amounts reflect your net share (85% of service total).'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Incoming Jobs */}
                <div className={`bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden transition-shadow ${incomingPulse ? 'ring-2 ring-[#D0B078] ring-offset-2 ring-offset-[#131835]' : ''}`}>
                    <div className="px-6 py-4 border-b border-[#2C355E] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">{labels.incomingJobs}</h2>
                        {incomingJobs.length > 0 && (
                            <span className="text-xs font-semibold bg-[#D0B078]/10 text-[#D0B078] border border-[#D0B078]/20 px-2.5 py-1 rounded-full">
                                {incomingJobs.length} new
                            </span>
                        )}
                    </div>
                    <div className="divide-y divide-[#2C355E]">
                        {incomingJobs.length > 0 ? incomingJobs.map((job) => (
                            <div key={job.id} className="px-6 py-5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5 min-w-0">
                                        <h3 className="font-semibold text-white text-base truncate">{job.serviceName}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#A5B0D1]">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {job.date ? new Date(job.date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {job.timeWindow}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {labels.area}: {job.area}
                                            </span>
                                        </div>
                                        <p className="text-[#D0B078] font-semibold text-sm">${job.totalAmount.toFixed(2)} {labels.payout}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAcceptJob(job.id)}
                                            disabled={acceptingId === job.id}
                                            className="px-5 py-2.5 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            {acceptingId === job.id ? '...' : labels.accept}
                                        </button>
                                        <button
                                            onClick={() => handleRejectJob(job.id)}
                                            disabled={rejectingId === job.id}
                                            className="px-4 py-2.5 border border-[#2C355E] text-[#A5B0D1] text-sm font-semibold rounded-xl hover:border-white/30 hover:text-white disabled:opacity-50 transition-all"
                                        >
                                            {rejectingId === job.id ? '...' : labels.reject}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-14 text-center">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-[#5E698F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-white font-medium mb-1">{labels.noIncoming}</p>
                                <p className="text-[#5E698F] text-sm">{labels.noIncomingDesc}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Jobs */}
                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2C355E] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">{labels.activeJobs}</h2>
                        {activeJobs.length > 0 && (
                            <span className="text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-full">
                                {activeJobs.length} {lang === 'es' ? 'activo(s)' : 'active'}
                            </span>
                        )}
                    </div>
                    <div className="divide-y divide-[#2C355E]">
                        {activeJobs.length > 0 ? activeJobs.map((job) => (
                            <div key={job.id} className="px-6 py-5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h3 className="font-semibold text-white text-base">{job.serviceName}</h3>
                                            <StatusBadge status={job.status} lang={lang} />
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#A5B0D1]">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {job.date ? new Date(job.date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {job.timeWindow}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {job.address}
                                            </span>
                                        </div>
                                        <p className="text-[#D0B078] font-semibold text-sm">${job.totalAmount.toFixed(2)}</p>
                                    </div>
                                    <Link
                                        href={`/${lang}/contractor/jobs/${job.id}${job.confirmationCode ? `?code=${job.confirmationCode}` : ''}`}
                                        className="shrink-0 px-5 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10"
                                    >
                                        {labels.viewJob}
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="py-14 text-center">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-[#5E698F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-white font-medium mb-1">{labels.noActive}</p>
                                <p className="text-[#5E698F] text-sm">{labels.noActiveDesc}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
