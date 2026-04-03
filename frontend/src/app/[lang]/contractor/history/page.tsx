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
    const [jobs, setJobs] = useState<{ id: number; service_name: string | null; date: string; total_amount: number | string; review_rating?: number | null; review_comment?: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(false);
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
                } else {
                    setError(true);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session, retryCount]);

    const label = lang === 'es'
        ? { title: "Historial", thisWeek: "Esta Semana", total: "Total Ganado", noJobs: "Aún no hay trabajos completados.", completed: "Completado" }
        : { title: "Job History", thisWeek: "This Week", total: "Total Earned", noJobs: "No completed jobs yet.", completed: "Completed" };

    if (error) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-sm">{lang === 'es' ? 'Error al cargar el historial.' : 'Failed to load history.'}</p>
                    <button
                        onClick={() => setRetryCount(c => c + 1)}
                        className="px-5 py-2 bg-[#D0B078] text-[#131835] text-sm font-bold rounded-xl hover:opacity-90"
                    >
                        {lang === 'es' ? 'Reintentar' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

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
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-4 sm:p-6">
                        <p className="text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2 sm:mb-3">{label.thisWeek}</p>
                        <p className="text-2xl sm:text-4xl font-bold text-green-400">${earnings.thisWeek.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] p-4 sm:p-6">
                        <p className="text-xs font-semibold text-[#5E698F] uppercase tracking-wider mb-2 sm:mb-3">{label.total}</p>
                        <p className="text-2xl sm:text-4xl font-bold text-[#D0B078]">${earnings.total.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-[#1A2142] rounded-2xl border border-[#2C355E] overflow-hidden">
                    <div className="divide-y divide-[#2C355E]">
                        {jobs.length > 0 ? jobs.map((job: any) => (
                            <div key={job.id} className="px-6 py-4 flex items-start justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                    <p className="font-semibold text-white truncate">{job.service_name || 'Detailing Service'}</p>
                                    <p className="text-sm text-[#A5B0D1]">
                                        {job.date ? new Date(job.date + 'T12:00:00Z').toLocaleDateString(
                                            lang === 'es' ? 'es-US' : 'en-US',
                                            { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }
                                        ) : '—'}
                                    </p>
                                    {job.review_rating && (
                                        <div className="flex items-center gap-0.5">
                                            {[1,2,3,4,5].map((s: number) => (
                                                <svg key={s} className={`w-3.5 h-3.5 ${s <= job.review_rating ? 'text-yellow-400' : 'text-[#2C355E]'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                            {job.review_comment && (
                                                <span className="text-[10px] text-[#A5B0D1] ml-1 truncate max-w-[120px]">"{job.review_comment}"</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-[#D0B078]">${Number(job.total_amount || 0).toFixed(2)}</p>
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
