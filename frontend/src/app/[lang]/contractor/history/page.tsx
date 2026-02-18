"use client";

import { useContractor } from "@/contexts/ContractorContext";
import RequestCard from "@/components/contractor/RequestCard";

export default function HistoryPage() {
    const { getRequestsByStatus, isLoading } = useContractor();
    const historyRequests = getRequestsByStatus(['completed', 'cancelled']);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">History</h1>
                <p className="text-[var(--text-secondary)]">Your past completed jobs.</p>
            </header>

            <div className="space-y-4">
                {historyRequests.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <p>No history yet.</p>
                    </div>
                ) : (
                    historyRequests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            showActions={false}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
