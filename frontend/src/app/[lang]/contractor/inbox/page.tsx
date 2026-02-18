"use client";

import { useContractor } from "@/contexts/ContractorContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";

export default function InboxPage() {
    const { getRequestsByStatus, updateStatus, isLoading } = useContractor();
    const pendingRequests = getRequestsByStatus('pending');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
            </div>
        );
    }

    const handleAccept = (id: string) => {
        updateStatus(id, 'confirmed');
        toast.success("Job accepted! Moved to Active tab.");
    };

    const handleDecline = (id: string) => {
        // For MVP, we'll just remove it or mark as cancelled
        updateStatus(id, 'cancelled');
        toast.error("Job declined.");
    };

    return (
        <div className="px-6 pt-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Inbox</h1>
                <p className="text-text-secondary">
                    You have <span className="text-accent-gold font-bold">{pendingRequests.length}</span> new requests.
                </p>
            </header>

            <div className="pb-24">
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <p>No new requests at the moment.</p>
                        <p className="text-sm mt-2">Check back later!</p>
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
