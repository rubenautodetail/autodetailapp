"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Field {
    label: string;
    labelEs: string;
    name: string;
    type: string;
    placeholder?: string;
    placeholderEs?: string;
    required?: boolean;
}

const FIELDS: Field[] = [
    { label: "Full Name", labelEs: "Nombre completo", name: "fullName", type: "text", placeholder: "John Doe", placeholderEs: "Juan Pérez", required: true },
    { label: "Email", labelEs: "Correo electrónico", name: "email", type: "email", placeholder: "you@example.com", placeholderEs: "tu@ejemplo.com", required: true },
    { label: "Phone", labelEs: "Teléfono", name: "phone", type: "tel", placeholder: "+1 (305) 000-0000", placeholderEs: "+1 (305) 000-0000", required: true },
    { label: "Business Name", labelEs: "Nombre del negocio", name: "businessName", type: "text", placeholder: "Ace Auto Detail LLC", placeholderEs: "Detallado Ace LLC", required: false },
    { label: "Home / Business Address", labelEs: "Dirección", name: "address", type: "text", placeholder: "123 Main St, Miami, FL", placeholderEs: "123 Calle Principal, Miami, FL", required: true },
    { label: "Service ZIP Codes (comma-separated)", labelEs: "Códigos ZIP de servicio (separados por coma)", name: "serviceZipCodes", type: "text", placeholder: "33101, 33109, 33125", placeholderEs: "33101, 33109, 33125", required: true },
];

export default function ContractorApplyPage() {
    const pathname = usePathname();
    const router = useRouter();
    const lang = pathname.split("/")[1] || "en";
    const isEs = lang === "es";
    const { user, profile, isLoading, refreshProfile } = useAuth();

    const [values, setValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace(`/${lang}/login?next=/${lang}/contractors/apply`);
        } else if (profile?.role === "contractor" && profile?.approval_status === "approved") {
            router.replace(`/${lang}/contractor/dashboard`);
        } else if (profile?.approval_status === "pending") {
            router.replace(`/${lang}/contractor/pending`);
        }
    }, [isLoading, user, profile, lang, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const serviceZipCodes = (values.serviceZipCodes || "")
                .split(",").map((z) => z.trim()).filter(Boolean);

            const res = await fetch("/api/contractors/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...values, serviceZipCodes }),
            });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || "Submission failed");

            // Refresh profile so AuthContext knows role changed to contractor
            await refreshProfile();
            setSubmitted(true);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    // Show nothing while auth is loading or a redirect is pending
    const redirectPending = !isLoading && (
        !user ||
        (profile?.role === "contractor" && profile?.approval_status === "approved") ||
        profile?.approval_status === "pending"
    );
    if (isLoading || redirectPending) return null;

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-6">
                    <div className="text-5xl">🎉</div>
                    <h1 className="text-2xl font-bold text-white">
                        {isEs ? "¡Solicitud enviada!" : "Application submitted!"}
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        {isEs
                            ? "Nuestro equipo revisará tu solicitud en 1–2 días hábiles y te notificará por correo."
                            : "Our team will review your application within 1–2 business days and notify you by email."}
                    </p>
                    <Link
                        href={`/${lang}`}
                        className="inline-block px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                    >
                        {isEs ? "Volver al inicio" : "Return to home"}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131835] text-white py-12 px-4">
            {/* Nav */}
            <div className="max-w-xl mx-auto mb-8 flex items-center justify-between">
                <Link href={`/${lang}/contractors`} className="text-white/40 hover:text-white text-sm transition-colors">
                    ← {isEs ? "Volver" : "Back"}
                </Link>
                <span className="text-xs text-white/30">
                    {isEs ? "Solicitud de contratista" : "Contractor application"}
                </span>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                        {isEs ? "Solicitud de contratista" : "Contractor Application"}
                    </h1>
                    <p className="text-white/50 text-sm">
                        {isEs
                            ? "Completa el formulario a continuación. El equipo revisará tu solicitud en 1–2 días hábiles."
                            : "Fill out the form below. The team will review your application within 1–2 business days."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {FIELDS.map((field) => (
                        <div key={field.name} className="space-y-1.5">
                            <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">
                                {isEs ? field.labelEs : field.label}
                                {field.required && <span className="text-[#D0B078] ml-1">*</span>}
                            </label>
                            <input
                                type={field.type}
                                placeholder={isEs ? field.placeholderEs : field.placeholder}
                                required={field.required}
                                value={values[field.name] || ""}
                                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D0B078]/50 focus:ring-1 focus:ring-[#D0B078]/20 transition"
                            />
                        </div>
                    ))}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-primary py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                        {submitting
                            ? (isEs ? "Enviando..." : "Submitting...")
                            : (isEs ? "Enviar solicitud" : "Submit application")}
                    </button>

                    <p className="text-center text-white/25 text-xs pb-8">
                        {isEs
                            ? "Al enviar, aceptas nuestros términos de servicio."
                            : "By submitting, you agree to our terms of service."}
                    </p>
                </form>
            </div>
        </div>
    );
}
