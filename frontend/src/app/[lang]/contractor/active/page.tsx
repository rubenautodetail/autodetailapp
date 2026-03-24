"use client";

import React, { use } from 'react';
import { useContractor } from "@/contexts/ContractorContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

export default function ActivePage({ params }: Props) {
    const { lang } = use(params);
    const { getRequestsByStatus, updateStatus, isLoading } = useContractor();
    const activeRequests = getRequestsByStatus(['confirmed', 'in_progress']);

    const t = lang === 'es'
        ? {
            title: 'Trabajos Activos',
            count: (n: number) => `Tienes <b>${n}</b> trabajo${n !== 1 ? 's' : ''} activo${n !== 1 ? 's' : ''}.`,
            empty: 'Sin trabajos activos ahora.',
            checkInbox: 'Revisa tu bandeja de entrada.',
            startJob: 'Iniciar Trabajo',
            completeJob: 'Completar Trabajo',
            started: '¡Trabajo iniciado!',
            completed: '¡Trabajo marcado como completado!',
        }
        : {
            title: 'Active Jobs',
            count: (n: number) => `You have <b>${n}</b> active job${n !== 1 ? 's' : ''}.`,
            empty: 'No active jobs right now.',
            checkInbox: 'Check your Inbox for new requests.',
            startJob: 'Start Job',
            completeJob: 'Complete Job',
            started: 'Job started!',
            completed: 'Job marked as completed!',
        };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    const handleComplete = (id: string) => {
        updateStatus(id, 'completed');
        toast.success(t.completed);
    };

    const handleStart = (id: string) => {
        updateStatus(id, 'in_progress');
        toast.success(t.started);
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
                                showActions={false}
                            />
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                {request.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleStart(request.id)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20 active:scale-95 duration-200"
                                    >
                                        {t.startJob}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleComplete(request.id)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-green-500/10 text-green-400 font-bold hover:bg-green-500/20 transition-colors border border-green-500/20 active:scale-95 duration-200"
                                >
                                    {t.completeJob}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
