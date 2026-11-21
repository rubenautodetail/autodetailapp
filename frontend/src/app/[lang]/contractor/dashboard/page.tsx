"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatTimeWindow } from "@/lib/dateUtils";
import { createClient } from "@/lib/supabase/client";
import { contractorServesZip } from "@/lib/zones";

// Supabase browser client for realtime
const supabaseClient = createClient();

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
        jobsOne: "1 job available",
        jobsMany: "jobs available",
        jobsSub: "Review it and accept as soon as you can",
        jobsNone: "No jobs available right now",
        jobsNoneSub: "They will appear here as soon as a new one comes in",
        reject: "Skip",
        viewJob: "View Job",
        viewDetails: "View job",
        vehicle: "Vehicle",
        color: "Color",
        size: "Size",
        estTime: "Est. time",
        yourPayout: "Your payout",
        whatsIncluded: "WHAT'S INCLUDED",
        addOnsTitle: "ADD-ONS",
        close: "Close",
        addrNote: "The exact address is shared after you accept and press On My Way.",
        confirmTitle: "Accept this job?",
        confirmText: "Make sure you can be there at this date and time.",
        confirmYes: "Yes, accept",
        confirmBack: "Go back",
        hrs: "hrs",
        min: "min",
        sizeNames: { sedan: "Sedan", suv: "SUV", large_suv: "Large SUV", pickup: "Truck", truck: "Truck", minivan: "Minivan" } as Record<string, string>,
        area: "Area",
        approxMapCaption: "Approximate area (about 1 mile). The exact address is shared after you accept and press On My Way.",
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
            en_route: "En Route",
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
        jobsOne: "1 trabajo disponible",
        jobsMany: "trabajos disponibles",
        jobsSub: "Revísalo y acéptalo cuanto antes",
        jobsNone: "No hay trabajos disponibles ahora",
        jobsNoneSub: "Aparecerán aquí en cuanto entre uno nuevo",
        reject: "Omitir",
        viewJob: "Ver Trabajo",
        viewDetails: "Ver trabajo",
        vehicle: "Vehículo",
        color: "Color",
        size: "Tamaño",
        estTime: "Tiempo est.",
        yourPayout: "Tu pago",
        whatsIncluded: "QUÉ INCLUYE",
        addOnsTitle: "EXTRAS",
        close: "Cerrar",
        addrNote: "La dirección exacta se comparte después de aceptar y presionar Estoy en camino.",
        confirmTitle: "¿Aceptar este trabajo?",
        confirmText: "Asegúrate de poder estar ahí en esta fecha y hora.",
        confirmYes: "Sí, aceptar",
        confirmBack: "Volver",
        hrs: "h",
        min: "min",
        sizeNames: { sedan: "Sedán", suv: "SUV", large_suv: "SUV Grande", pickup: "Camioneta", truck: "Camioneta", minivan: "Minivan" } as Record<string, string>,
        area: "Área",
        approxMapCaption: "Zona aproximada (a 1 milla). La dirección exacta se da después de aceptar y presionar Estoy en camino.",
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
            en_route: "En Camino",
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
        en_route: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        pending_approval: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || "bg-white/10 text-white/60 border-white/10"}`}>
            {label}
        </span>
    );
}

interface DashboardJob {
    id: string;
    serviceName: string;
    confirmationCode?: string;
    date?: string;
    timeWindow?: string;
    area?: string;
    approxMap?: { imageUrl: string; radiusMiles: number } | null;
    address?: string;
    addressHidden?: boolean;
    totalAmount: number;
    status: string;
    vehicle?: { make: string | null; model: string | null; year: string | null; color: string | null; bodyStyle: string | null };
    serviceNameEs?: string | null;
    includes?: string[];
    includesEs?: string[];
    durationMinutes?: number | null;
    addOns?: string[];
}

interface DashboardData {
    contractor?: { name: string };
    incomingJobs?: DashboardJob[];
    activeJobs?: DashboardJob[];
    completedJobs?: { id: number; service_name: string | null; date: string; total_amount: number | string; confirmation_code?: string | null }[];
    earnings?: { thisWeek: number; total: number };
}

export default function ContractorDashboard({ params }: DashboardProps) {
    const { lang } = use(params);
    const labels = t[lang];
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    // Keep the latest session in a ref so realtime callbacks (subscribed once
    // with a first-render closure) never send a stale/expired token.
    const sessionRef = useRef(session);
    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentInfoSet, setPaymentInfoSet] = useState<boolean | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [detailJobId, setDetailJobId] = useState<string | null>(null);
    const [confirmJobId, setConfirmJobId] = useState<string | null>(null);

    // Close the detail / confirm windows if the job disappears (taken by someone else, cancelled).
    useEffect(() => {
        const ids = new Set((dashboardData?.incomingJobs ?? []).map((j) => String(j.id)));
        if (detailJobId && !ids.has(String(detailJobId))) setDetailJobId(null);
        if (confirmJobId && !ids.has(String(confirmJobId))) setConfirmJobId(null);
    }, [dashboardData, detailJobId, confirmJobId]);

    // Escape closes the windows.
    useEffect(() => {
        if (!detailJobId && !confirmJobId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (confirmJobId) setConfirmJobId(null);
            else setDetailJobId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [detailJobId, confirmJobId]);
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
    // Zones this contractor works, so out-of-zone new jobs do not trigger the alert sound.
    const zonesRef = useRef<string[] | null>(null);
    // Last known number of incoming jobs, used by the background refresh to detect new ones.
    const lastIncomingRef = useRef<number | null>(null);

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

    // ── Supabase realtime subscription for booking changes ───────────────────
    useEffect(() => {
        const channel = supabaseClient
            .channel("incoming-jobs")
            // New unassigned booking → alert all contractors
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "bookings",
                    filter: "status=eq.pending_assignment",
                },
                (payload: { new?: { zip_code?: string } }) => {
                    const zip = payload.new?.zip_code;
                    if (!contractorServesZip(zonesRef.current, zip)) return;
                    loadDashboard();
                    playAlert();
                    triggerPulse();
                }
            )
            // Booking claimed or status changed → remove it from other contractors' incoming list
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "bookings",
                },
                () => {
                    loadDashboard();
                }
            )
            .subscribe();

        return () => {
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
            supabaseClient.removeChannel(channel);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Background refresh ────────────────────────────────────────────────────
    // Every POLL_INTERVAL_MS (and when the tab becomes visible again) asks the server for
    // just the NUMBER of open jobs in this technician's zones. The full dashboard is only
    // reloaded when that number changes. Goes through the server API, so the technician
    // never needs direct read access to open bookings.
    useEffect(() => {
        const POLL_INTERVAL_MS = 2 * 60 * 1000; // change this number to refresh more or less often
        const refresh = async () => {
            if (document.visibilityState !== 'visible') return;
            const token = sessionRef.current?.access_token;
            if (!token) return;
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const lite = await fetch('/api/contractors/incoming-count', { headers });
                if (!lite.ok) return;
                const { count } = (await lite.json()) as { count?: number };
                if (typeof count !== 'number') return;
                const previous = lastIncomingRef.current;
                if (previous !== null && count === previous) return; // nothing changed

                const res = await fetch('/api/contractors/dashboard', { headers });
                if (!res.ok) return;
                const data = await res.json();
                const fullCount: number = data?.incomingJobs?.length ?? 0;
                lastIncomingRef.current = fullCount;
                setDashboardData(data);
                zonesRef.current = Array.isArray(data?.serviceZones) ? data.serviceZones : null;
                try {
                    localStorage.setItem('contractor_incoming_count', String(fullCount));
                } catch { /* non-fatal */ }
                if (previous !== null && fullCount > previous) {
                    playAlert();
                    triggerPulse();
                }
            } catch { /* non-fatal — try again on the next tick */ }
        };
        const id = setInterval(refresh, POLL_INTERVAL_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
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
            const token = sessionRef.current?.access_token;
            const res = await fetch('/api/contractors/dashboard', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setDashboardData(data);
            zonesRef.current = Array.isArray(data?.serviceZones) ? data.serviceZones : null;
            setError(null);
            // Persist incoming count so the layout's bottom nav dot stays in sync
            const count: number = data?.incomingJobs?.length ?? 0;
            lastIncomingRef.current = count;
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
            } else {
                const body = await res.json().catch(() => ({ error: '' }));
                alert(lang === 'es'
                    ? 'Error al aceptar el trabajo. Intenta de nuevo.'
                    : (body as { error?: string }).error || 'Failed to accept job. Please try again.');
            }
        } catch {
            alert(lang === 'es' ? 'Error de conexión.' : 'Connection error. Please try again.');
        }
        finally { setAcceptingId(null); }
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

    const incomingJobs: DashboardJob[] = dashboardData?.incomingJobs ?? [];
    const activeJobs: DashboardJob[] = dashboardData?.activeJobs ?? [];

    // "2021 Toyota Camry" / "Toyota Camry" ... empty when the customer gave nothing.
    const vehicleLine = (job: DashboardJob): string =>
        [job.vehicle?.year, job.vehicle?.make, job.vehicle?.model].filter(Boolean).join(' ');
    const sizeLabel = (job: DashboardJob): string => {
        const raw = job.vehicle?.bodyStyle;
        if (!raw) return '';
        return labels.sizeNames[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };
    const durationLabel = (mins?: number | null): string => {
        if (!mins || mins <= 0) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return [h ? `${h} ${labels.hrs}` : '', m ? `${m} ${labels.min}` : ''].filter(Boolean).join(' ');
    };
    const dateLabel = (job: DashboardJob): string =>
        job.date
            ? new Date(job.date + 'T12:00:00Z').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
            : '—';
    const detailJob = incomingJobs.find((j) => String(j.id) === String(detailJobId)) ?? null;
    const confirmJob = incomingJobs.find((j) => String(j.id) === String(confirmJobId)) ?? null;

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

                {/* Jobs banner — the first thing a technician needs to know */}
                {incomingJobs.length > 0 ? (
                    <div className="rounded-2xl border border-[#D0B078]/60 bg-gradient-to-br from-[#D0B078]/25 to-[#D0B078]/5 px-5 py-4">
                        <p className="text-lg font-bold text-[#D0B078]">
                            🔔 {incomingJobs.length === 1 ? labels.jobsOne : `${incomingJobs.length} ${labels.jobsMany}`}
                        </p>
                        <p className="text-sm text-[#CFD5EE] mt-0.5">{labels.jobsSub}</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-[#2C355E] bg-[#1A2142] px-5 py-4">
                        <p className="text-base font-semibold text-[#CFD5EE]">{labels.jobsNone}</p>
                        <p className="text-sm text-[#8994B8] mt-0.5">{labels.jobsNoneSub}</p>
                    </div>
                )}

                {/* Incoming Jobs — only shown when there is something to accept */}
                {incomingJobs.length > 0 && (
                <div className={`bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden transition-shadow ${incomingPulse ? 'ring-2 ring-[#D0B078] ring-offset-2 ring-offset-[#131835]' : ''}`}>
                    <div className="px-6 py-4 border-b border-[#2C355E] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">{labels.incomingJobs}</h2>
                        {incomingJobs.length > 0 && (
                            <span className="text-xs font-semibold bg-[#D0B078]/10 text-[#D0B078] border border-[#D0B078]/20 px-2.5 py-1 rounded-full">
                                {incomingJobs.length} {lang === 'es' ? 'nuevo(s)' : 'new'}
                            </span>
                        )}
                    </div>
                    <div className="divide-y divide-[#2C355E]">
                        {incomingJobs.length > 0 ? incomingJobs.map((job) => (
                            <div key={job.id} className="px-6 py-5 hover:bg-white/[0.02] transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white text-base truncate">{job.serviceName}</h3>
                                            {job.confirmationCode && <span className="text-xs font-mono text-[#D0B078] bg-[#D0B078]/10 px-2 py-0.5 rounded">{job.confirmationCode}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#A5B0D1]">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {job.date ? new Date(job.date + 'T12:00:00Z').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '—'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatTimeWindow(job.timeWindow, lang)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {labels.area}: {job.area}
                                            </span>
                                        </div>
                                        {vehicleLine(job) && (
                                            <p className="text-sm text-[#A5B0D1]">🚗 {vehicleLine(job)}{job.vehicle?.color ? ` · ${job.vehicle.color}` : ''}</p>
                                        )}
                                        <p className="text-[#D0B078] font-semibold text-sm">${(Number(job.totalAmount) || 0).toFixed(2)} {labels.payout}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 shrink-0 mt-4">
                                        <button
                                            onClick={() => setDetailJobId(String(job.id))}
                                            className="px-4 py-2.5 border border-[#D0B078]/60 text-[#D0B078] text-sm font-semibold rounded-xl hover:bg-[#D0B078]/10 transition-all"
                                        >
                                            {labels.viewDetails}
                                        </button>
                                        <button
                                            onClick={() => setConfirmJobId(String(job.id))}
                                            disabled={acceptingId === job.id}
                                            className="px-5 py-2.5 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            {acceptingId === job.id ? '...' : labels.accept}
                                        </button>
                                    </div>
                                    </div>
                                    {job.approxMap?.imageUrl && (
                                        <div className="sm:w-80 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={job.approxMap.imageUrl}
                                                alt={labels.approxMapCaption}
                                                loading="lazy"
                                                className="w-full h-40 object-cover rounded-xl border border-[#2C355E]"
                                            />
                                            <p className="text-[11px] text-[#5E698F] mt-1.5 leading-snug">{labels.approxMapCaption}</p>
                                        </div>
                                    )}
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
                )}

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
                                            {job.confirmationCode && <span className="text-xs font-mono text-[#D0B078] bg-[#D0B078]/10 px-2 py-0.5 rounded">{job.confirmationCode}</span>}
                                            <StatusBadge status={job.status} lang={lang} />
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#A5B0D1]">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {job.date ? new Date(job.date + 'T12:00:00Z').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : '—'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatTimeWindow(job.timeWindow, lang)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {job.address}
                                            </span>
                                        </div>
                                        {job.addressHidden && (
                                            <p className="text-xs text-[#8994B8]">
                                                🔒 {lang === 'es' ? 'La dirección completa aparece al pulsar On My Way' : 'Full address appears when you press On My Way'}
                                            </p>
                                        )}
                                        <p className="text-[#D0B078] font-semibold text-sm">${(Number(job.totalAmount) || 0).toFixed(2)}</p>
                                    </div>
                                    <Link
                                        href={`/${lang}/contractor/jobs/${job.id}`}
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
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#2C355E]">
                            <div className="px-5 py-4 bg-[#1A2142]">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Total Ganado' : 'Total Earned'}
                                </p>
                                <p className="text-xl font-bold text-white">${(Number(earningSummary.totalEarned) || 0).toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4 bg-[#1A2142]">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {labels.thisWeek}
                                </p>
                                <p className="text-xl font-bold text-green-400">${(Number(dashboardData?.earnings?.thisWeek) || 0).toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4 bg-[#1A2142]">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Este Mes' : 'This Month'}
                                </p>
                                <p className="text-xl font-bold text-[#D0B078]">${(Number(earningSummary.thisMonthEarned) || 0).toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4 bg-[#1A2142]">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Por Cobrar' : 'Pending Payout'}
                                </p>
                                <p className="text-xl font-bold text-amber-400">${(Number(earningSummary.pendingPayout) || 0).toFixed(2)}</p>
                            </div>
                            <div className="px-5 py-4 bg-[#1A2142]">
                                <p className="text-[10px] font-semibold text-[#5E698F] uppercase tracking-wider mb-1">
                                    {lang === 'es' ? 'Trabajos Completados' : 'Jobs Completed'}
                                </p>
                                <p className="text-xl font-bold text-green-400">{earningSummary.completedJobs}</p>
                            </div>
                        </div>
                    </div>
                )}


            {/* ── View job (details) ───────────────────────────────────────── */}
            {detailJob && !confirmJob && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDetailJobId(null)} />
                    <div className="relative w-full sm:max-w-md bg-[#1A2142] border border-[#3B4575] rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] overflow-y-auto">
                        <div className="w-11 h-1 bg-[#3B4575] rounded mx-auto mb-4 sm:hidden" />
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-white">{lang === 'es' && detailJob.serviceNameEs ? detailJob.serviceNameEs : detailJob.serviceName}</h3>
                            {detailJob.confirmationCode && <span className="text-xs font-mono text-[#D0B078] bg-[#D0B078]/10 px-2 py-0.5 rounded">{detailJob.confirmationCode}</span>}
                        </div>
                        {(() => {
                            const lines = (lang === 'es' && detailJob.includesEs && detailJob.includesEs.length > 0 ? detailJob.includesEs : detailJob.includes) ?? [];
                            return lines.length > 0 ? (
                                <div className="mt-3">
                                    <p className="text-xs font-bold tracking-wider text-[#9FB0E8] mb-2">{labels.whatsIncluded}</p>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#E8ECFF]">
                                        {lines.map((l, i) => <li key={i}>{l}</li>)}
                                    </ul>
                                </div>
                            ) : null;
                        })()}
                        <div className="mt-4 pt-1 border-t border-[#3B4575] divide-y divide-[#263058] text-sm">
                            {(vehicleLine(detailJob) || detailJob.vehicle?.color) && (
                                <div className="flex justify-between gap-4 py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.vehicle}</span><span className="text-white font-medium text-right">{[vehicleLine(detailJob), detailJob.vehicle?.color].filter(Boolean).join(' · ')}</span></div>
                            )}
                            {sizeLabel(detailJob) && (
                                <div className="flex justify-between py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.size}</span><span className="text-white font-medium">{sizeLabel(detailJob)}</span></div>
                            )}
                            <div className="flex justify-between py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.date}</span><span className="text-white font-medium">{dateLabel(detailJob)} · {formatTimeWindow(detailJob.timeWindow, lang)}</span></div>
                            <div className="flex justify-between py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.area}</span><span className="text-white font-medium">{detailJob.area}</span></div>
                            {durationLabel(detailJob.durationMinutes) && (
                                <div className="flex justify-between py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.estTime}</span><span className="text-white font-medium">~{durationLabel(detailJob.durationMinutes)}</span></div>
                            )}
                            <div className="flex justify-between py-2.5"><span className="font-bold text-[#9FB0E8]">{labels.yourPayout}</span><span className="text-[#D0B078] font-bold">${(Number(detailJob.totalAmount) || 0).toFixed(2)}</span></div>
                        </div>
                        {detailJob.addOns && detailJob.addOns.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-bold tracking-wider text-[#9FB0E8] mb-2">{labels.addOnsTitle}</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#E8ECFF]">
                                    {detailJob.addOns.map((a, i) => <li key={i}>{a}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                onClick={() => setConfirmJobId(String(detailJob.id))}
                                className="px-5 py-2.5 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 transition-all"
                            >
                                {labels.accept}
                            </button>
                            <button
                                onClick={() => setDetailJobId(null)}
                                className="px-4 py-2.5 border border-[#2C355E] text-[#A5B0D1] text-sm font-semibold rounded-xl hover:border-white/30 hover:text-white transition-all"
                            >
                                {labels.close}
                            </button>
                        </div>
                        <p className="text-[11px] text-[#8E99C8] mt-3">{labels.addrNote}</p>
                    </div>
                </div>
            )}

            {/* ── Confirm accept ───────────────────────────────────────────── */}
            {confirmJob && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/70" onClick={() => acceptingId ? undefined : setConfirmJobId(null)} />
                    <div className="relative w-full max-w-sm bg-[#1A2142] border border-[#4A5590] rounded-2xl p-5 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">{labels.confirmTitle}</h3>
                        <p className="text-sm text-[#AAB3D6]">{labels.confirmText}</p>
                        <div className="mt-3 rounded-xl border border-[#2C355E] bg-[#10162E] p-3 text-sm text-[#E8ECFF] leading-relaxed">
                            <p className="font-semibold">{lang === 'es' && confirmJob.serviceNameEs ? confirmJob.serviceNameEs : confirmJob.serviceName}</p>
                            <p>{dateLabel(confirmJob)} · {formatTimeWindow(confirmJob.timeWindow, lang)}</p>
                            <p>{confirmJob.area}</p>
                            {vehicleLine(confirmJob) && <p>{vehicleLine(confirmJob)}</p>}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={async () => { const id = String(confirmJob.id); await handleAcceptJob(id); setConfirmJobId(null); }}
                                disabled={acceptingId === confirmJob.id}
                                className="flex-1 px-4 py-2.5 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                {acceptingId === confirmJob.id ? '...' : labels.confirmYes}
                            </button>
                            <button
                                onClick={() => setConfirmJobId(null)}
                                disabled={acceptingId === confirmJob.id}
                                className="flex-1 px-4 py-2.5 border border-[#2C355E] text-[#A5B0D1] text-sm font-semibold rounded-xl hover:border-white/30 hover:text-white disabled:opacity-50 transition-all"
                            >
                                {labels.confirmBack}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
}
