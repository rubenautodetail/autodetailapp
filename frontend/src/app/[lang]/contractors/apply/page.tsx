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

const PAYMENT_OPTIONS = [
    { value: "direct_deposit", label: "Direct Deposit (Bank Account)", labelEs: "Depósito Directo (Cuenta Bancaria)" },
    { value: "zelle",          label: "Zelle",                         labelEs: "Zelle" },
    { value: "check",          label: "Check",                         labelEs: "Cheque" },
    { value: "cash",           label: "Cash",                          labelEs: "Efectivo" },
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
            // Send to register with contractor flow — they need an account first
            router.replace(`/${lang}/register?next=/${lang}/contractors/apply`);
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
                body: JSON.stringify({
                    ...values,
                    serviceZipCodes,
                    paymentPreference:   values.paymentPreference   || "",
                    zelleContact:        values.zelleContact         || "",
                    bankName:            values.bankName             || "",
                    bankAccountNumber:   values.bankAccountNumber    || "",
                    bankRoutingNumber:   values.bankRoutingNumber    || "",
                    bankAccountType:     values.bankAccountType      || "",
                }),
            });
            let json;
            try {
                json = await res.json();
            } catch (e) {
                // If it's not JSON, it's likely a 500 HTML error page from the framework/middleware
                const text = await res.clone().text();
                console.error("Failed to parse JSON response:", text);
                throw new Error(isEs 
                    ? `Error del servidor (formato inválido). Estado: ${res.status}`
                    : `Server error (invalid format). Status: ${res.status}`);
            }

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
                            ? "Nuestro equipo revisará tu solicitud en 1–2 días hábiles."
                            : "Our team will review your application within 1–2 business days."}
                    </p>

                    <div className="bg-white/5 border border-[#D0B078]/20 rounded-xl p-5 space-y-3 text-left">
                        <p className="text-[#D0B078] text-xs font-semibold uppercase tracking-widest">
                            {isEs ? "¿Qué sigue?" : "What happens next?"}
                        </p>
                        <ul className="space-y-2 text-white/50 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-[#D0B078] mt-0.5 shrink-0">✓</span>
                                {isEs
                                    ? "No necesitas hacer nada más por ahora"
                                    : "You don't need to do anything else right now"}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#D0B078] mt-0.5 shrink-0">✓</span>
                                {isEs
                                    ? "Recibirás un correo con nuestra decisión en 1–2 días hábiles"
                                    : "You'll receive an email with our decision within 1–2 business days"}
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#D0B078] mt-0.5 shrink-0">✓</span>
                                {isEs
                                    ? "Si eres aprobado, el correo incluirá un enlace para iniciar sesión y comenzar a trabajar"
                                    : "If approved, the email will include a link to log in and start accepting jobs"}
                            </li>
                        </ul>
                    </div>

                    <p className="text-white/30 text-xs">
                        {isEs
                            ? "¿Preguntas? Escríbenos a support@dtailwash.com"
                            : "Questions? Email us at support@dtailwash.com"}
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

                    {/* Payment preference */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">
                            {isEs ? "Método de pago preferido" : "Preferred Payment Method"}
                            <span className="text-[#D0B078] ml-1">*</span>
                        </label>
                        <select
                            required
                            value={values.paymentPreference || ""}
                            onChange={(e) => setValues((v) => ({ ...v, paymentPreference: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D0B078]/50 focus:ring-1 focus:ring-[#D0B078]/20 transition appearance-none"
                        >
                            <option value="" disabled className="bg-gray-900">
                                {isEs ? "Selecciona una opción..." : "Select an option..."}
                            </option>
                            {PAYMENT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-gray-900">
                                    {isEs ? opt.labelEs : opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Zelle details */}
                    {values.paymentPreference === "zelle" && (
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">
                                {isEs ? "Teléfono o correo de Zelle" : "Zelle Phone or Email"}
                                <span className="text-[#D0B078] ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={isEs ? "+1 (305) 000-0000 o tu@correo.com" : "+1 (305) 000-0000 or you@email.com"}
                                value={values.zelleContact || ""}
                                onChange={(e) => setValues((v) => ({ ...v, zelleContact: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D0B078]/50 focus:ring-1 focus:ring-[#D0B078]/20 transition"
                            />
                        </div>
                    )}

                    {/* Bank account details */}
                    {values.paymentPreference === "direct_deposit" && (
                        <div className="space-y-4 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-white/50 uppercase tracking-widest font-medium">
                                {isEs ? "Información bancaria" : "Bank Account Details"}
                            </p>
                            {[
                                { name: "bankName",          label: "Bank Name",           labelEs: "Nombre del banco",         placeholder: "Chase, Bank of America...", required: true  },
                                { name: "bankAccountNumber", label: "Account Number",       labelEs: "Número de cuenta",         placeholder: "••••••••••••",             required: true  },
                                { name: "bankRoutingNumber", label: "Routing Number",       labelEs: "Número de ruta",           placeholder: "9 digits",                 required: true  },
                            ].map((f) => (
                                <div key={f.name} className="space-y-1.5">
                                    <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">
                                        {isEs ? f.labelEs : f.label}
                                        {f.required && <span className="text-[#D0B078] ml-1">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        required={f.required}
                                        placeholder={f.placeholder}
                                        value={values[f.name] || ""}
                                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#D0B078]/50 focus:ring-1 focus:ring-[#D0B078]/20 transition"
                                    />
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">
                                    {isEs ? "Tipo de cuenta" : "Account Type"}
                                    <span className="text-[#D0B078] ml-1">*</span>
                                </label>
                                <select
                                    required
                                    value={values.bankAccountType || ""}
                                    onChange={(e) => setValues((v) => ({ ...v, bankAccountType: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D0B078]/50 focus:ring-1 focus:ring-[#D0B078]/20 transition appearance-none"
                                >
                                    <option value="" disabled className="bg-gray-900">
                                        {isEs ? "Selecciona..." : "Select..."}
                                    </option>
                                    <option value="checking" className="bg-gray-900">{isEs ? "Cuenta corriente" : "Checking"}</option>
                                    <option value="savings"  className="bg-gray-900">{isEs ? "Cuenta de ahorros" : "Savings"}</option>
                                </select>
                            </div>
                        </div>
                    )}

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
