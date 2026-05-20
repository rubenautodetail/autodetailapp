"use client";

import { Suspense, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Canonical site URL for Supabase redirects.
 * Must match exactly what's whitelisted in Supabase Dashboard → Auth → URL Configuration.
 * Using NEXT_PUBLIC_APP_URL avoids www/non-www mismatches from window.location.origin.
 */
function getSiteUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
}

function ForgotPasswordForm() {
    const supabase = useRef(createClient()).current;
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const params = useParams();
    const searchParams = useSearchParams();
    const lang = (params.lang as "en" | "es") || "en";
    const fromParam = searchParams.get("from");
    const isContractorFlow = fromParam === "contractor";
    const isAdminFlow = fromParam === "admin";
    const loginHref = isContractorFlow
        ? `/${lang}/contractor/login`
        : isAdminFlow
            ? `/${lang}/admin/login`
            : `/${lang}/login`;

    const dict = {
        en: {
            title: "Reset Password",
            subtitle: "Enter your email to receive a reset link.",
            email: "Email",
            submit: "Send Reset Link",
            success: "Check your email for the reset link!",
            errorGeneric: "Something went wrong. Please try again.",
            backToLogin: "Back to Login",
        },
        es: {
            title: "Restablecer Contraseña",
            subtitle: "Ingresa tu correo para recibir un enlace de restablecimiento.",
            email: "Correo electrónico",
            submit: "Enviar enlace",
            success: "¡Revisa tu correo para el enlace de restablecimiento!",
            errorGeneric: "Algo salió mal. Inténtalo de nuevo.",
            backToLogin: "Regresar al inicio de sesión",
        }
    };

    const t = dict[lang] || dict.en;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const siteUrl = getSiteUrl();
            const nextPath = isContractorFlow
                ? `/${lang}/reset-password?from=contractor`
                : isAdminFlow
                    ? `/${lang}/reset-password?from=admin`
                    : `/${lang}/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
            });
            if (error) {
                console.error("resetPasswordForEmail error:", error.message, error);
                setStatus("error");
                // Show a user-friendly message instead of raw Supabase errors
                // (e.g. "Email rate limit exceeded" or provider errors)
                if (error.message.toLowerCase().includes("rate") || error.message.toLowerCase().includes("limit")) {
                    setMessage(lang === "es"
                        ? "Demasiados intentos. Espera unos minutos antes de intentar de nuevo."
                        : "Too many attempts. Please wait a few minutes and try again.");
                } else if (error.message.toLowerCase().includes("not allowed") || error.message.toLowerCase().includes("redirect")) {
                    setMessage(lang === "es"
                        ? "Error de configuración. Contacta soporte."
                        : "Configuration error. Please contact support.");
                } else {
                    setMessage(error.message || t.errorGeneric);
                }
            } else {
                setStatus("success");
                setMessage(t.success);
            }
        } catch (err: unknown) {
            console.error("resetPasswordForEmail exception:", err);
            setStatus("error");
            setMessage(err instanceof Error ? err.message : t.errorGeneric);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">{t.title}</h1>
                    <p className="text-[var(--text-secondary)] text-sm">{t.subtitle}</p>
                </div>

                <div className="bg-[var(--card)] p-8 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--divider)]">
                    {status === "success" ? (
                        <div className="text-center">
                            <div className="p-4 mb-4 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
                                {message}
                            </div>
                            <Link href={loginHref} className="w-full inline-block py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all">
                                {t.backToLogin}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    {t.email}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>

                            {status === "error" && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium shadow-sm hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : t.submit}
                            </button>
                            
                            <div className="pt-2 text-center">
                                <Link href={loginHref} className="text-[var(--text-secondary)] text-sm hover:underline">
                                    {t.backToLogin}
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        }>
            <ForgotPasswordForm />
        </Suspense>
    );
}
