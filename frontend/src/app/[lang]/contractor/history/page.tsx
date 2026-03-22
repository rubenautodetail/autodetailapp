"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
    params: Promise<{ lang: "en" | "es" }>;
}

export default function ContractorHistory({ params }: Props) {
    const { lang } = use(params);
    const { session } = useAuth();

    const [earnings, setEarnings] = useState({ thisWeek: 0, total: 0 });
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/contractors/dashboard', {
                    headers: session?.access_token
                        ? { Authorization: `Bearer ${session.access_token}` }
                        : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    setEarnings(data.earnings ?? { thisWeek: 0, total: 0 });
                    setJobs(data.completedJobs ?? []);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    const label = lang === 'es'
        ? { title: "Historial", thisWeek: "Esta Semana", total: "Total Ganado", noJobs: "Aún no hay trabajos completados.", completed: "Completado" }
        : { title: "Job History", thisWeek: "This Week", total: "Total Earned", noJobs: "No completed jobs yet.", completed: "Completed" };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#131835] py-8 px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    <div className="h-9 w-40 bg-white/5 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1].map((i) => (
                            <div key={i} className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                                <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-4" />
                                <div className="h-9 w-16 bg-white/10 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131835] py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-white tracking-tight">{label.title}</h1>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                        <p className="text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-3">{label.thisWeek}</p>
                        <p className="text-4xl font-bold text-green-400">${earnings.thisWeek.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-6">
                        <p className="text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-3">{label.total}</p>
                        <p className="text-4xl font-bold text-[#D0B078]">${earnings.total.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                    <div className="divide-y divide-[#2C355E]">
                        {jobs.length > 0 ? jobs.map((job: any) => (
                            <div key={job.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="space-y-0.5 min-w-0">
                                    <p className="font-semibold text-white truncate">{job.service_name || 'Detailing Service'}</p>
                                    <p className="text-sm text-[#A5B0D1]">
                                        {job.date ? new Date(job.date + 'T12:00:00').toLocaleDateString(
                                            lang === 'es' ? 'es-US' : 'en-US',
                                            { month: 'short', day: 'numeric', year: 'numeric' }
                                        ) : '—'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-[#D0B078]">${(Number(job.total_amount || 0) * 0.70).toFixed(2)}</p>
                                    <p className="text-xs text-green-400 font-medium">{label.completed}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-14 text-center">
                                <p className="text-[#5E698F] text-sm">{label.noJobs}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
