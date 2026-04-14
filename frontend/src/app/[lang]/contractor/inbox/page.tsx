"use client";

import { use, useState } from "react";
import { useContractor } from "@/contexts/ContractorContext";
import { useAuth } from "@/contexts/AuthContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

export default function InboxPage({ params }: Props) {
    const { lang } = use(params);
    const { getRequestsByStatus, isLoading } = useContractor();
    const { session } = useAuth();
    const pendingRequests = getRequestsByStatus('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const t = lang === 'es'
        ? {
            title: 'Bandeja de Entrada',
            requests: (n: number) => `Tienes <b>${n}</b> solicitud${n !== 1 ? 'es' : ''} nueva${n !== 1 ? 's' : ''}.`,
            empty: 'Sin nuevas solicitudes por ahora.',
            checkBack: '¡Vuelve más tarde!',
            accepted: 'Trabajo aceptado. Movido a Activos.',
            declined: 'Trabajo rechazado.',
            alreadyClaimed: 'Este trabajo ya fue aceptado por otro contratista.',
            error: 'Error al procesar. Intenta de nuevo.',
        }
        : {
            title: 'Inbox',
            requests: (n: number) => `You have <b>${n}</b> new request${n !== 1 ? 's' : ''}.`,
            empty: 'No new requests at the moment.',
            checkBack: 'Check back later!',
            accepted: 'Job accepted! Moved to Active tab.',
            declined: 'Job declined.',
            alreadyClaimed: 'This job has already been accepted by another contractor.',
            error: 'Failed to process. Please try again.',
        };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
            </div>
        );
    }

    const handleAccept = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/contractors/accept-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId: id }),
            });
            if (res.status === 409) {
                toast.error(t.alreadyClaimed);
            } else if (res.ok) {
                toast.success(t.accepted);
            } else {
                toast.error(t.error);
            }
        } catch {
            toast.error(t.error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (id: string) => {
        setProcessingId(id);
        try {
            await fetch('/api/contractors/reject-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                },
                body: JSON.stringify({ bookingId: id }),
            });
            toast(t.declined);
        } catch {
            toast.error(t.error);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="px-6 pt-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t.title}</h1>
                <p
                    className="text-text-secondary"
                    dangerouslySetInnerHTML={{ __html: t.requests(pendingRequests.length) }}
                />
            </header>

            <div className="pb-24">
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <p>{t.empty}</p>
                        <p className="text-sm mt-2">{t.checkBack}</p>
                    </div>
                ) : (
                    pendingRequests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            locale={lang}
                            showActions={true}
                            onAccept={() => handleAccept(request.id)}
                            onDecline={() => handleDecline(request.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
