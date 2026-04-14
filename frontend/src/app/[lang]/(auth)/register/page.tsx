"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function RegisterForm() {
    const { register, user, isLoading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmedEmail, setConfirmedEmail] = useState("");
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const lang = (params.lang as string) || "en";

    const next = searchParams.get("next");
    const redirectTo = next || `/${lang}/customer`;

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
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                            </button>
                        </div>
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
