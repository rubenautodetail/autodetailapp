"use client";

import React from 'react';
import { useContractor } from "@/contexts/ContractorContext";
import RequestCard from "@/components/contractor/RequestCard";
import { toast } from "react-hot-toast";

export default function ActivePage() {
    const { getRequestsByStatus, updateStatus, isLoading } = useContractor();
    // Get both confirmed and in_progress requests
    const activeRequests = getRequestsByStatus(['confirmed', 'in_progress']);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    const handleComplete = (id: string) => {
        updateStatus(id, 'completed');
        toast.success("Job marked as completed!");
    };

    const handleStart = (id: string) => {
        updateStatus(id, 'in_progress');
        toast.success("Job started!");
    };

    return (
        <div className="px-6 pt-6 pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Active Jobs</h1>
                <p className="text-text-secondary">
                    You have <span className="text-blue-400 font-bold">{activeRequests.length}</span> active jobs.
                </p>
            </header>

            <div className="space-y-8">
                {activeRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No active jobs right now.</p>
                        <p className="text-sm mt-2">Check your Inbox for new requests.</p>
                    </div>
                ) : (
                    activeRequests.map(request => (
                        <div key={request.id} className="relative">
                            <RequestCard
                                request={request}
                                showActions={false}
                            />
                            {/* Detailed Actions for Active Jobs */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                {request.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleStart(request.id)}
                                        className="flex-1 py-3 px-4 rounded-xl bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20 active:scale-95 duration-200"
                                    >
                                        Start Job
                                    </button>
                                )}
                                <button
                                    onClick={() => handleComplete(request.id)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-green-500/10 text-green-400 font-bold hover:bg-green-500/20 transition-colors border border-green-500/20 active:scale-95 duration-200"
                                >
                                    Complete Job
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
