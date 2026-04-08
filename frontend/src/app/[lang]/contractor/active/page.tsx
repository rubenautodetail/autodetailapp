"use client";

import React, { use, useState } from 'react';
import { useContractor } from "@/contexts/ContractorContext";
import { useAuth } from "@/contexts/AuthContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

export default function ActivePage({ params }: Props) {
    const { lang } = use(params);
    const { getRequestsByStatus, isLoading } = useContractor();
    const { session } = useAuth();
    const activeRequests = getRequestsByStatus(['confirmed', 'in_progress']);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const t = lang === 'es'
        ? {
            title: 'Trabajos Activos',
            count: (n: number) => `Tienes <b>${n}</b> trabajo${n !== 1 ? 's' : ''} activo${n !== 1 ? 's' : ''}.`,
            empty: 'Sin trabajos activos ahora.',
            checkInbox: 'Revisa tu bandeja de entrada.',
            startJob: 'Iniciar Trabajo',
            completeJob: 'Completar Trabajo',
            viewJob: 'Ver Detalles',
            started: '¡Trabajo iniciado!',
            completed: '¡Trabajo marcado como completado!',
            error: 'Error al procesar. Intenta de nuevo.',
        }
        : {
            title: 'Active Jobs',
            count: (n: number) => `You have <b>${n}</b> active job${n !== 1 ? 's' : ''}.`,
            empty: 'No active jobs right now.',
            checkInbox: 'Check your Inbox for new requests.',
            startJob: 'Start Job',
            completeJob: 'Complete Job',
            viewJob: 'View Details',
            started: 'Job started!',
            completed: 'Job marked as completed!',
            error: 'Failed to process. Please try again.',
        };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    const handleStart = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/contractors/start-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId: id }),
            });
            if (res.ok) {
                toast.success(t.started);
            } else {
                toast.error(t.error);
            }
        } catch {
            toast.error(t.error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleComplete = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/contractors/complete-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId: id, checklist: '' }),
            });
            if (res.ok) {
                toast.success(t.completed);
            } else {
                toast.error(t.error);
            }
        } catch {
            toast.error(t.error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="px-6 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
                <p
                    className="text-text-secondary"
                    dangerouslySetInnerHTML={{ __html: t.count(activeRequests.length) }}
                />
            </header>

            <div className="space-y-8">
                {activeRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>{t.empty}</p>
                        <p className="text-sm mt-2">{t.checkInbox}</p>
                    </div>
                ) : (
                    activeRequests.map(request => (
                        <div key={request.id} className="relative">
                            <RequestCard
                                request={request}
                                locale={lang}
                                showActions={false}
                            />
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                {request.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleStart(request.id)}
                                        disabled={processingId === request.id}
                                        className="flex-1 py-3 px-4 rounded-xl bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20 active:scale-95 duration-200 disabled:opacity-50"
                                    >
                                        {processingId === request.id ? '...' : t.startJob}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleComplete(request.id)}
                                    disabled={processingId === request.id}
                                    className="flex-1 py-3 px-4 rounded-xl bg-green-500/10 text-green-400 font-bold hover:bg-green-500/20 transition-colors border border-green-500/20 active:scale-95 duration-200 disabled:opacity-50"
                                >
                                    {processingId === request.id ? '...' : t.completeJob}
                                </button>
                                <Link
                                    href={`/${lang}/contractor/jobs/${request.id}`}
                                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/70 font-bold hover:bg-white/10 transition-colors border border-white/10 text-center active:scale-95 duration-200"
                                >
                                    {t.viewJob}
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
