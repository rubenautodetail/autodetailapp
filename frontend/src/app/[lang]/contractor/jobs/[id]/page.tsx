"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import * as contractorApi from "@/lib/api/contractor";

interface JobDetailsProps {
    params: Promise<{
        lang: "en" | "es";
        id: string;
    }>;
}

interface JobData {
    id: string | number;
    status: string;
    service?: { name?: string; name_es?: string } | null;
    location?: { address?: string; zipCode?: string } | null;
    address?: string;
    zip_code?: string;
    date?: string;
    scheduled_date?: string;
    timeWindow?: string;
    time_window?: string;
    specialInstructions?: string;
    special_instructions?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_id?: string;
    contractor_id?: string;
    vehicle?: string;
    confirmation_code?: string;
    document_id?: string;
}

const translations = {
    en: {
        title: "Job Details",
        booking: "Booking",
        customer: "Customer",
        customerPhone: "Customer Phone",
        service: "Service",
        address: "Address",
        addressHidden: "Full address revealed after job starts",
        scheduledDate: "Scheduled Date",
        timeWindow: "Time Window",
        status: "Status",
        instructions: "Special Instructions",
        checklist: "Completion Notes",
        checklistPlaceholder: "Describe the work completed, any issues found, or notes for the customer...",
        onMyWay: "On My Way",
        sendingEnRoute: "Sending...",
        enRouteError: "Failed to send en-route notification. Please try again.",
        startJob: "Start Job",
        starting: "Starting...",
        completeService: "Complete Service",
        completing: "Completing...",
        navigate: "Navigate to Location",
        getDirections: "Get Directions",
        callCustomer: "Call Customer",
        contactCustomer: "Contact Customer",
        success: "Service Marked Complete!",
        successSub: "Redirecting to dashboard...",
        pendingApprovalTitle: "Awaiting Customer Approval",
        pendingApprovalSub: "The customer has been notified to review and approve the completed work.",
        loading: "Loading...",
        error: "Error loading job details",
        accessDenied: "Access Denied",
        accessDeniedSub: "Please log in to your contractor account to view job details.",
        logIn: "Log In",
        retry: "Retry",
        jobNotFound: "Job not found",
        startError: "Failed to start job. Please try again.",
        completeError: "Failed to complete service. Please try again.",
        backToDashboard: "Back to Dashboard",
        statusConfirmed: "Confirmed",
        statusInProgress: "In Progress",
        statusPendingApproval: "Pending Approval",
        addOns: "Add-ons",
        vehicle: "Vehicle",
    },
    es: {
        title: "Detalles del Trabajo",
        booking: "Reserva",
        customer: "Cliente",
        customerPhone: "Teléfono del Cliente",
        service: "Servicio",
        address: "Dirección",
        addressHidden: "Dirección completa disponible al iniciar el trabajo",
        scheduledDate: "Fecha Programada",
        timeWindow: "Ventana de Tiempo",
        status: "Estado",
        instructions: "Instrucciones Especiales",
        checklist: "Notas de Finalización",
        checklistPlaceholder: "Describe el trabajo completado, cualquier problema encontrado o notas para el cliente...",
        onMyWay: "Estoy en camino",
        sendingEnRoute: "Enviando...",
        enRouteError: "Error al enviar notificación. Por favor intenta de nuevo.",
        startJob: "Iniciar Trabajo",
        starting: "Iniciando...",
        completeService: "Completar Servicio",
        completing: "Completando...",
        navigate: "Navegar a la Ubicación",
        getDirections: "Cómo Llegar",
        callCustomer: "Llamar al Cliente",
        contactCustomer: "Contactar Cliente",
        success: "¡Servicio Marcado como Completo!",
        successSub: "Redirigiendo al panel...",
        pendingApprovalTitle: "Esperando Aprobación del Cliente",
        pendingApprovalSub: "El cliente ha sido notificado para revisar y aprobar el trabajo completado.",
        loading: "Cargando...",
        error: "Error al cargar los detalles del trabajo",
        accessDenied: "Acceso Denegado",
        accessDeniedSub: "Por favor inicia sesión en tu cuenta de contratista.",
        logIn: "Iniciar Sesión",
        retry: "Reintentar",
        jobNotFound: "Trabajo no encontrado",
        startError: "Error al iniciar el trabajo. Por favor intenta de nuevo.",
        completeError: "Error al completar el servicio. Por favor intenta de nuevo.",
        backToDashboard: "Volver al Panel",
        statusConfirmed: "Confirmado",
        statusInProgress: "En Progreso",
        statusPendingApproval: "Pendiente de Aprobación",
        addOns: "Complementos",
        vehicle: "Vehículo",
    },
};

// Status badge colours
function StatusBadge({ status, t, locale }: { status: string; t: typeof translations["en"]; locale?: "en" | "es" }) {
    const map: Record<string, { label: string; classes: string }> = {
        confirmed: {
            label: t.statusConfirmed,
            classes: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        },
        en_route: {
            label: locale === "es" ? "En Camino" : "En Route",
            classes: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
        },
        in_progress: {
            label: t.statusInProgress,
            classes: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        },
        pending_approval: {
            label: t.statusPendingApproval,
            classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        },
    };

    const entry = map[status] ?? {
        label: status,
        classes: "bg-[#1A2142] text-[#A5B0D1] border border-[#2A3155]",
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${entry.classes}`}>
            {entry.label}
        </span>
    );
}

export default function JobDetailsPage({ params }: JobDetailsProps) {
    const { lang, id } = use(params);
    const t = translations[lang];
    const router = useRouter();
    const searchParams = useSearchParams();
    // ?code=CONFIRMATION_CODE bypasses JWT auth entirely
    const codeParam = searchParams.get("code");
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    const [job, setJob] = useState<JobData | null>(null);
    const [loading, setLoading] = useState(true);
    const [enRouting, setEnRouting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [completionNotes, setCompletionNotes] = useState("");

    // ---------------------------------------------------------------
    // Load job on mount
    // ---------------------------------------------------------------
    useEffect(() => {
        if (codeParam) {
            loadJobByCode(codeParam);
        } else if (!authLoading && isAuthenticated) {
            loadJobDetails();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, isAuthenticated, id, codeParam]);

    // Code-based load — no JWT required
    const loadJobByCode = async (code: string) => {
        try {
            setLoading(true);
            setError(null);
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from("bookings")
                .select("*")
                .or(`id.eq.${id},document_id.eq.${id}`)
                .eq("confirmation_code", code)
                .single();

            if (fetchError || !data) {
                setError("Job not found or invalid access code.");
            } else {
                setJob({
                    ...data,
                    service: data.service_name ? { name: data.service_name, name_es: data.service_name } : null,
                    timeWindow: data.time_window,
                    specialInstructions: data.special_instructions,
                    location: { address: data.address, zipCode: data.zip_code },
                });
            }
        } catch {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    // Auth-based load — uses Bearer token
    const loadJobDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const accessToken = session?.access_token;
            const data = await contractorApi.fetchJobDetails(id, accessToken);
            setJob(data);
        } catch {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    const reload = () => {
        if (codeParam) {
            loadJobByCode(codeParam);
        } else {
            loadJobDetails();
        }
    };

    // ---------------------------------------------------------------
    // On My Way → en_route
    // ---------------------------------------------------------------
    const handleEnRoute = async () => {
        setActionError(null);
        setEnRouting(true);
        try {
            const accessToken = session?.access_token;
            const headers: HeadersInit = { "Content-Type": "application/json" };
            if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
            const res = await fetch("/api/contractors/en-route", {
                method: "POST",
                headers,
                body: JSON.stringify({ bookingId: id }),
            });
            const json = await res.json() as { error?: string };
            if (!res.ok) throw new Error(json.error || "Failed");
            setJob((prev) => prev ? { ...prev, status: "en_route" } : prev);
        } catch (err: unknown) {
            console.error("En-route error:", err);
            setActionError(t.enRouteError);
        } finally {
            setEnRouting(false);
        }
    };

    // ---------------------------------------------------------------
    // Start Job → in_progress
    // ---------------------------------------------------------------
    const handleStartJob = async () => {
        setActionError(null);
        setStarting(true);
        try {
            if (codeParam) {
                const res = await fetch("/api/contractors/start-job", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId: id, confirmationCode: codeParam }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed to start job");
            } else {
                const accessToken = session?.access_token;
                const headers: HeadersInit = { "Content-Type": "application/json" };
                if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
                const res = await fetch("/api/contractors/start-job", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ bookingId: id }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed to start job");
            }
            // Optimistically update status without a full reload
            setJob((prev) => prev ? { ...prev, status: "in_progress" } : prev);
        } catch (err: unknown) {
            console.error("Start job error:", err);
            setActionError(t.startError);
        } finally {
            setStarting(false);
        }
    };

    // ---------------------------------------------------------------
    // Complete Service → pending_approval
    // ---------------------------------------------------------------
    const handleCompleteService = async () => {
        setActionError(null);
        setCompleting(true);
        try {
            if (codeParam) {
                const res = await fetch("/api/contractors/complete-job", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bookingId: id,
                        confirmationCode: codeParam,
                        checklist: completionNotes,
                    }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed");
            } else {
                const accessToken = session?.access_token;
                await contractorApi.completeJob(
                    id,
                    { checklist: completionNotes, beforePhotos: [], afterPhotos: [] },
                    accessToken
                );
            }
            // Optimistically update to pending_approval
            setJob((prev) => prev ? { ...prev, status: "pending_approval" } : prev);
            // Redirect to dashboard after a short delay
            setTimeout(() => router.push(`/${lang}/contractor/dashboard`), 2500);
        } catch (err: unknown) {
            console.error("Complete job error:", err);
            setActionError(t.completeError);
        } finally {
            setCompleting(false);
        }
    };

    const handleNavigate = () => {
        const addr = job?.location?.address || job?.address;
        if (addr) {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(addr)}`, "_blank");
        }
    };

    // ---------------------------------------------------------------
    // Loading state
    // ---------------------------------------------------------------
    if ((authLoading && !codeParam) || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#131835]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D0B078] mx-auto mb-4" />
                    <p className="text-[#A5B0D1] text-sm">{t.loading}</p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------
    // Auth gate (only triggered when no code param)
    // ---------------------------------------------------------------
    if (!codeParam && !isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#131835] p-4">
                <h1 className="text-2xl font-bold text-white mb-4">{t.accessDenied}</h1>
                <p className="text-[#A5B0D1] mb-8 text-center max-w-sm">{t.accessDeniedSub}</p>
                <Link
                    href={`/${lang}/contractor/login`}
                    className="px-6 py-3 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                    {t.logIn}
                </Link>
            </div>
        );
    }

    // ---------------------------------------------------------------
    // Error / not found state
    // ---------------------------------------------------------------
    if (error || !job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#131835] p-4">
                <p className="text-red-400 font-medium mb-4">{error || t.jobNotFound}</p>
                <button
                    onClick={reload}
                    className="px-5 py-2 bg-[#1A2142] border border-[#2A3155] text-[#A5B0D1] rounded-xl hover:bg-[#2A3155] transition-colors"
                >
                    {t.retry}
                </button>
            </div>
        );
    }

    // ---------------------------------------------------------------
    // Derive display values
    // ---------------------------------------------------------------
    const serviceName =
        lang === "es"
            ? job.service?.name_es || job.service?.name || "N/A"
            : job.service?.name || "N/A";

    const showFullAddress = ["confirmed", "en_route", "in_progress", "pending_approval", "completed"].includes(
        job.status
    );

    const displayAddress = showFullAddress
        ? job.location?.address || job.address || "N/A"
        : job.location?.zipCode
        ? `ZIP ${job.location.zipCode} — ${t.addressHidden}`
        : t.addressHidden;

    // The Supabase column is `date`; `scheduled_date` is the legacy Strapi field name.
    // Support both so the page works whether data comes from loadJobByCode or the API.
    const rawDate = job.date || job.scheduled_date;
    const formattedDate = rawDate
        ? new Date(rawDate + (rawDate.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "N/A";

    // ---------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------
    return (
        <div className="min-h-screen bg-[#131835]">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

                {/* Back link */}
                <Link
                    href={`/${lang}/contractor/dashboard`}
                    className="inline-flex items-center gap-2 text-[#A5B0D1] hover:text-[#D0B078] text-sm mb-6 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.backToDashboard}
                </Link>

                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                        <p className="text-[#A5B0D1] text-sm mt-1">
                            {t.booking} #{String(job.id).slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <StatusBadge status={job.status} t={t} locale={lang} />
                </div>

                {/* ── pending_approval: completion confirmation ── */}
                {job.status === "pending_approval" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-emerald-300 font-semibold text-lg">{t.pendingApprovalTitle}</p>
                        <p className="text-emerald-400/70 text-sm mt-1">{t.pendingApprovalSub}</p>
                    </div>
                )}

                {/* ── Job info card ── */}
                <div className="bg-[#1A2142] border border-[#2A3155] rounded-2xl p-6 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {/* Service */}
                        <div>
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.service}</p>
                            <p className="text-white font-semibold">{serviceName}</p>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.status}</p>
                            <StatusBadge status={job.status} t={t} locale={lang} />
                        </div>

                        {/* Scheduled date */}
                        <div>
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.scheduledDate}</p>
                            <p className="text-white">{formattedDate}</p>
                        </div>

                        {/* Time window */}
                        <div>
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.timeWindow}</p>
                            <p className="text-white">{job.timeWindow || job.time_window || "TBD"}</p>
                        </div>

                        {/* Address — full column */}
                        <div className="sm:col-span-2">
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.address}</p>
                            <p className="text-white mb-3">{displayAddress}</p>
                            {/* Get Directions — only when job is active and address is revealed */}
                            {(job.status === "confirmed" || job.status === "en_route" || job.status === "in_progress") && showFullAddress && (
                                <a
                                    href={`https://maps.apple.com/?q=${encodeURIComponent(job.location?.address || job.address || "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 border border-[#2C355E] text-[#A5B0D1] rounded-xl hover:border-white/30 hover:text-white transition-all text-sm font-medium"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {t.getDirections}
                                </a>
                            )}
                        </div>

                        {/* Customer name */}
                        {job.customer_name && (
                            <div>
                                <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.customer}</p>
                                <p className="text-white">{job.customer_name}</p>
                            </div>
                        )}

                        {/* Customer phone — only visible once accepted */}
                        {showFullAddress && job.customer_phone && (
                            <div className="sm:col-span-2">
                                <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.customerPhone}</p>
                                <a
                                    href={`tel:${job.customer_phone}`}
                                    className="text-[#D0B078] font-medium hover:underline block mb-3"
                                >
                                    {job.customer_phone}
                                </a>
                                <a
                                    href={`tel:${job.customer_phone}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 border border-[#2C355E] text-[#A5B0D1] rounded-xl hover:border-white/30 hover:text-white transition-all text-sm font-medium"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {t.callCustomer}
                                </a>
                            </div>
                        )}

                        {/* Vehicle */}
                        {job.vehicle && (
                            <div>
                                <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-1">{t.vehicle}</p>
                                <p className="text-white">{job.vehicle}</p>
                            </div>
                        )}
                    </div>

                    {/* Special instructions */}
                    {(job.specialInstructions || job.special_instructions) && (
                        <div className="mt-5 pt-5 border-t border-[#2A3155]">
                            <p className="text-[#A5B0D1] text-xs font-medium uppercase tracking-wide mb-2">{t.instructions}</p>
                            <p className="text-white/80 text-sm leading-relaxed">
                                {job.specialInstructions || job.special_instructions}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Action buttons ── */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={handleNavigate}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2142] border border-[#2A3155] rounded-xl text-[#A5B0D1] hover:text-white hover:border-[#D0B078]/50 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t.navigate}
                    </button>

                    {showFullAddress && job.customer_phone ? (
                        <a
                            href={`tel:${job.customer_phone}`}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2142] border border-[#2A3155] rounded-xl text-[#A5B0D1] hover:text-white hover:border-[#D0B078]/50 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {t.contactCustomer}
                        </a>
                    ) : (
                        <button
                            disabled
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A2142]/50 border border-[#2A3155]/50 rounded-xl text-[#A5B0D1]/40 cursor-not-allowed text-sm font-medium"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {t.contactCustomer}
                        </button>
                    )}
                </div>

                {/* ── Shared action error ── */}
                {actionError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {actionError}
                    </div>
                )}

                {/* ── ON MY WAY — only when status = confirmed ── */}
                {job.status === "confirmed" && (
                    <div className="mb-3">
                        <button
                            onClick={handleEnRoute}
                            disabled={enRouting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
                        >
                            {enRouting ? (
                                <>
                                    <svg className="animate-spin w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    {t.sendingEnRoute}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 6h3l3 5v3h-2m-4-8H4a1 1 0 00-1 1v9h2m12 0H9m0 0V7" />
                                    </svg>
                                    {t.onMyWay}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* ── START JOB — only when status = confirmed or en_route ── */}
                {(job.status === "confirmed" || job.status === "en_route") && (
                    <div className="bg-[#1A2142] border border-[#2A3155] rounded-2xl p-6 mb-4">
                        <p className="text-[#A5B0D1] text-sm mb-4">
                            {lang === "es"
                                ? "Cuando estés en camino o hayas llegado al lugar, presiona el botón para iniciar el trabajo."
                                : "When you are en route or have arrived, press the button to start the job."}
                        </p>
                        <button
                            onClick={handleStartJob}
                            disabled={starting}
                            className="w-full px-6 py-4 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-base"
                        >
                            {starting ? t.starting : t.startJob}
                        </button>
                    </div>
                )}

                {/* ── COMPLETE SERVICE — only when status = in_progress ── */}
                {job.status === "in_progress" && (
                    <div className="bg-[#1A2142] border border-[#2A3155] rounded-2xl p-6 mb-4">
                        <h2 className="text-white font-semibold mb-3">{t.checklist}</h2>
                        <textarea
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder={t.checklistPlaceholder}
                            rows={4}
                            className="w-full bg-[#131835] border border-[#2A3155] rounded-xl px-4 py-3 text-white placeholder-[#A5B0D1]/50 text-sm resize-none focus:outline-none focus:border-[#D0B078]/60 transition-colors mb-4"
                        />
                        <button
                            onClick={handleCompleteService}
                            disabled={completing}
                            className="w-full px-6 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
                        >
                            {completing ? t.completing : t.completeService}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
