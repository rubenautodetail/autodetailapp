import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import * as contractorApi from "@/lib/api/contractor";

interface DashboardProps {
    params: Promise<{
        lang: "en" | "es";
    }>;
}

const translations = {
    // ... translations stay the same
    en: {
        title: "Dashboard",
        todaySchedule: "Today's Schedule",
        activeJobs: "Active Jobs",
        earnings: "Earnings",
        total: "Total",
        thisWeek: "This Week",
        thisMonth: "This Month",
        noJobs: "No jobs scheduled for today",
        viewDetails: "View Details",
        accept: "Accept",
        reject: "Reject",
        navigate: "Navigate",
        complete: "Complete Service",
        jobDetails: "Job Details",
        customer: "Customer",
        service: "Service",
        time: "Time",
        address: "Address",
        status: "Status",
        loading: "Loading...",
        error: "Error loading dashboard",
    },
    es: {
        title: "Panel",
        todaySchedule: "Horario de Hoy",
        activeJobs: "Trabajos Activos",
        earnings: "Ganancias",
        total: "Total",
        thisWeek: "Esta Semana",
        thisMonth: "Este Mes",
        noJobs: "No hay trabajos programados para hoy",
        viewDetails: "Ver Detalles",
        accept: "Aceptar",
        reject: "Rechazar",
        navigate: "Navegar",
        complete: "Completar Servicio",
        jobDetails: "Detalles del Trabajo",
        customer: "Cliente",
        service: "Servicio",
        time: "Hora",
        address: "Dirección",
        status: "Estado",
        loading: "Cargando...",
        error: "Error al cargar el panel",
    },
};

export default function ContractorDashboard({ params }: DashboardProps) {
    const { lang } = use(params);
    const t = translations[lang];
    const { session, isAuthenticated, isLoading: authLoading } = useAuth();

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadDashboard();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [authLoading, isAuthenticated]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const accessToken = session?.access_token;
            const data = await contractorApi.fetchDashboard(accessToken);
            setDashboardData(data);
            setError(null);
        } catch (error) {
            console.error("Failed to load dashboard:", error);
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptJob = async (bookingId: string) => {
        try {
            const accessToken = session?.access_token;
            const response = await contractorApi.acceptJob(bookingId, accessToken);

            if (response.success) {
                loadDashboard(); // Refresh
            }
        } catch (error) {
            console.error("Failed to accept job:", error);
        }
    };

    const handleRejectJob = async (bookingId: string) => {
        try {
            const accessToken = session?.access_token;
            const response = await contractorApi.rejectJob(bookingId, accessToken);

            if (response.success) {
                loadDashboard(); // Refresh
            }
        } catch (error) {
            console.error("Failed to reject job:", error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-8">Please log in to your contractor account to view your dashboard.</p>
                <Link
                    href={`/${lang}/login`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Log In
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                    onClick={loadDashboard}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                {dashboardData?.contractor && (
                    <p className="mt-2 text-gray-600">
                        Welcome back, {dashboardData.contractor.name}
                    </p>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">
                        {t.activeJobs}
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-blue-600">
                        {dashboardData?.activeJobs || 0}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">
                        {t.earnings} ({t.thisWeek})
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-green-600">
                        ${(dashboardData?.earnings?.thisWeek || 0).toFixed(2)}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm font-medium text-gray-500">
                        {t.total} {t.earnings}
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">
                        ${(dashboardData?.earnings?.total || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t.todaySchedule}
                    </h2>
                </div>
                <div className="p-6">
                    {dashboardData?.todaySchedule?.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.todaySchedule.map((booking: any) => (
                                <div
                                    key={booking.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {booking.service?.name || "Service"}
                                            </h3>
                                            <p className="text-gray-600 mt-1">
                                                {t.time}: {booking.timeWindow || "TBD"}
                                            </p>
                                            <p className="text-gray-600">
                                                {t.address}: {booking.location?.address}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {booking.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleAcceptJob(booking.id)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                                    >
                                                        {t.accept}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectJob(booking.id)}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                                    >
                                                        {t.reject}
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === "confirmed" && (
                                                <Link
                                                    href={`/${lang}/contractor/jobs/${booking.id}`}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    {t.viewDetails}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">{t.noJobs}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
