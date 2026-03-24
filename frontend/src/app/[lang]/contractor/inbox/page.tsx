"use client";

import { use } from "react";
import { useContractor } from "@/contexts/ContractorContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

export default function InboxPage({ params }: Props) {
    const { lang } = use(params);
    const { getRequestsByStatus, updateStatus, isLoading } = useContractor();
    const pendingRequests = getRequestsByStatus('pending');

    const t = lang === 'es'
        ? {
            title: 'Bandeja de Entrada',
            requests: (n: number) => `Tienes <b>${n}</b> solicitud${n !== 1 ? 'es' : ''} nueva${n !== 1 ? 's' : ''}.`,
            empty: 'Sin nuevas solicitudes por ahora.',
            checkBack: '¡Vuelve más tarde!',
            accepted: 'Trabajo aceptado. Movido a Activos.',
            declined: 'Trabajo rechazado.',
        }
        : {
            title: 'Inbox',
            requests: (n: number) => `You have <b>${n}</b> new request${n !== 1 ? 's' : ''}.`,
            empty: 'No new requests at the moment.',
            checkBack: 'Check back later!',
            accepted: 'Job accepted! Moved to Active tab.',
            declined: 'Job declined.',
        };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
            </div>
        );
    }

    const handleAccept = (id: string) => {
        updateStatus(id, 'confirmed');
        toast.success(t.accepted);
    };

    const handleDecline = (id: string) => {
        updateStatus(id, 'cancelled');
        toast.error(t.declined);
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
