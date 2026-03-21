"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const { register, user, isLoading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmedEmail, setConfirmedEmail] = useState("");
    const router = useRouter();
    const params = useParams();
    const lang = (params.lang as string) || "en";

    // Read `next` once, safely (window only exists in browser)
    const next = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    const redirectTo = next || `/${lang}/dashboard`;

    const isContractorFlow = !!next?.includes("contractors/apply");
    const isEs = lang === "es";

    useEffect(() => {
        if (!isLoading && user) {
            router.push(redirectTo);
        }
    }, [user, isLoading, router, redirectTo]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // For contractor flow: email confirmation → contractors/apply
            // For regular users: email confirmation → login page (they log in after confirming)
            const emailRedirect = isContractorFlow ? redirectTo : `/${lang}/login`;
            const { needsEmailConfirmation } = await register(name, email, password, lang, emailRedirect);
            if (needsEmailConfirmation) {
                setConfirmedEmail(email);
            } else {
                router.push(redirectTo);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    // ── Email confirmation pending ─────────────────────────────────────────────
    if (confirmedEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
                <div className="w-full max-w-sm bg-[var(--card)] p-8 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--divider)] text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                        {isEs ? "Revisa tu correo" : "Check your email"}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-1">
                        {isEs ? "Enviamos un enlace de confirmación a" : "We sent a confirmation link to"}
                    </p>
                    <p className="text-[var(--text-primary)] font-medium text-sm mb-4">{confirmedEmail}</p>
                    <p className="text-[var(--text-secondary)] text-xs mb-2">
                        {isEs
                            ? "Haz clic en el enlace del correo para activar tu cuenta."
                            : "Click the link in the email to activate your account."}
                    </p>
                    {isContractorFlow && (
                        <p className="text-[var(--text-secondary)] text-xs mb-6 font-medium">
                            {isEs
                                ? "Después de confirmar, serás redirigido al formulario de solicitud."
                                : "After confirming, you'll be taken directly to the contractor application form."}
                        </p>
                    )}
                    <Link
                        href={isContractorFlow ? `/${lang}/contractor/login` : `/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                        className="text-[var(--accent)] text-sm hover:underline"
                    >
                        {isEs ? "Ya confirmé, iniciar sesión" : "Already confirmed? Sign in"}
                    </Link>
                </div>
            </div>
        );
    }

    // ── Register form ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] transition-colors duration-200">
            <div className="w-full max-w-sm bg-[var(--card)] p-8 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--divider)]">
                <div className="text-center mb-8">
                    {isContractorFlow && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-medium mb-4">
                            {isEs ? "Solicitud de contratista" : "Contractor application"}
                        </div>
                    )}
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                        {isEs ? "Crear cuenta" : "Create Account"}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {isContractorFlow
                            ? (isEs
                                ? "Crea tu cuenta para continuar con la solicitud de contratista."
                                : "Create your account to continue with the contractor application.")
                            : (isEs
                                ? "Regístrate con tu correo para solicitar servicios"
                                : "Join using your email to request services")}
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                            {isEs ? "Nombre completo" : "Full Name"}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                            {isEs ? "Correo electrónico" : "Email"}
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

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                            {isEs ? "Contraseña" : "Password"}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                            placeholder="••••••••"
                            minLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isEs
                                ? (isContractorFlow ? "Crear cuenta y continuar →" : "Crear cuenta")
                                : (isContractorFlow ? "Create account & continue →" : "Create Account")
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                        {isEs ? "¿Ya tienes una cuenta?" : "Already have an account?"}{" "}
                        <Link
                            href={isContractorFlow ? `/${lang}/contractor/login` : `/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                            className="text-[var(--accent)] hover:underline font-medium"
                        >
                            {isEs ? "Iniciar sesión" : "Sign In"}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
