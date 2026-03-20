"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function ContractorPendingPage() {
    const pathname = usePathname();
    const router = useRouter();
    const lang = pathname.split("/")[1] || "en";
    const isEs = lang === "es";
    const { profile, isLoading, logout } = useAuth();

    // If approved, redirect to dashboard; if not a contractor, redirect home
    useEffect(() => {
        if (isLoading) return;
        if (!profile) {
            router.replace(`/${lang}/login`);
            return;
        }
        if (profile.role === "contractor" && profile.approval_status === "approved") {
            router.replace(`/${lang}/contractor/dashboard`);
        }
        if (profile.role !== "contractor" && profile.role !== "user") {
            router.replace(`/${lang}`);
        }
    }, [isLoading, profile, lang, router]);

    const isRejected = profile?.approval_status === "rejected";

    async function handleLogout() {
        await logout();
        router.replace(`/${lang}`);
    }

    return (
        <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                {isRejected ? (
                    <>
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            {isEs ? "Solicitud Rechazada" : "Application Not Approved"}
                        </h1>
                        <p className="text-white/60 mb-6 text-sm leading-relaxed">
                            {isEs
                                ? "Tu solicitud de contratista no fue aprobada. Contáctanos si crees que es un error."
                                : "Your contractor application was not approved. Contact us if you believe this is a mistake."}
                        </p>
                        <a
                            href="mailto:support@dtailwash.com"
                            className="inline-block px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm mb-4"
                        >
                            {isEs ? "Contáctanos" : "Contact Support"}
                        </a>
                    </>
                ) : (
                    <>
                        <div className="text-5xl mb-4">⏳</div>
                        <h1 className="text-2xl font-bold text-white mb-3">
                            {isEs ? "Solicitud en Revisión" : "Application Under Review"}
                        </h1>
                        <p className="text-white/60 mb-2 text-sm leading-relaxed">
                            {isEs
                                ? "Tu solicitud ha sido recibida. Nuestro equipo la revisará y te notificará por correo en 1–2 días hábiles."
                                : "Your application has been received. Our team will review it and notify you by email within 1–2 business days."}
                        </p>
                        <p className="text-yellow-400/80 text-xs mb-6">
                            {isEs
                                ? "No podrás acceder al panel de contratista hasta que sea aprobada."
                                : "You won't be able to access the contractor dashboard until approved."}
                        </p>
                    </>
                )}

                <div className="flex flex-col gap-3">
                    <Link
                        href={`/${lang}`}
                        className="block px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors text-sm"
                    >
                        {isEs ? "Volver al Inicio" : "Return to Home"}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                        {isEs ? "Cerrar Sesión" : "Sign Out"}
                    </button>
                </div>
            </div>
        </div>
    );
}
