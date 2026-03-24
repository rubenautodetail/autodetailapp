"use client";

import { useState, useEffect, useReducer, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const t = {
    en: {
        title: "Welcome back",
        subtitle: "Sign in to continue",
        email: "Email",
        password: "Password",
        signIn: "Sign In",
        noAccount: "Don't have an account?",
        register: "Create one",
        forgotPassword: "Forgot password?",
        contractorLink: "Technician? Sign in here",
    },
    es: {
        title: "Bienvenido",
        subtitle: "Inicia sesión para continuar",
        email: "Correo electrónico",
        password: "Contraseña",
        signIn: "Iniciar sesión",
        noAccount: "¿No tienes cuenta?",
        register: "Crear una",
        forgotPassword: "¿Olvidaste tu contraseña?",
        contractorLink: "¿Técnico? Inicia sesión aquí",
    },
};

// Inner component that uses useSearchParams (requires Suspense wrapper)
function LoginForm() {
    const { login, logout, user, profile, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    type LoginAction =
        | { type: 'wrong_role'; role: "contractor" | "admin" }
        | { type: 'dismiss' }
        | { type: 'loading'; value: boolean };
    const [{ loading, wrongRole }, dispatch] = useReducer(
        (state: { loading: boolean; wrongRole: "contractor" | "admin" | null }, action: LoginAction) => {
            switch (action.type) {
                case 'wrong_role': return { loading: false, wrongRole: action.role };
                case 'dismiss': return { loading: false, wrongRole: null };
                case 'loading': return { ...state, loading: action.value };
            }
        },
        { loading: false, wrongRole: null }
    );
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const lang = (params.lang as "en" | "es") || "en";
    const dict = t[lang] ?? t.en;

    // Show error if confirmation link failed (callback sets ?error=auth_failed)
    const urlError = searchParams.get("error");
    const [error, setError] = useState(
        urlError === "auth_failed"
            ? (lang === "es"
                ? "El enlace de confirmación falló o expiró. Confirma tu correo e intenta de nuevo."
                : "Confirmation link failed or expired. Please confirm your email and try again.")
            : ""
    );

    // Role-based redirect after login — customers only
    useEffect(() => {
        if (isLoading || !user || !profile) return;

        // Contractor tried to use customer login → reject
        if (profile.role === "contractor") {
            dispatch({ type: 'wrong_role', role: 'contractor' });
            logout().catch(() => {});
            return;
        }

        // Admin tried to use customer login → reject
        if (profile.role === "admin") {
            dispatch({ type: 'wrong_role', role: 'admin' });
            logout().catch(() => {});
            return;
        }

        // Regular user → redirect to dashboard or next (only allow customer-safe paths)
        const next = searchParams.get("next");
        const safeNext = next && next.startsWith("/") && !next.includes("/admin") && !next.includes("/contractor");
        if (safeNext) { router.replace(next); return; }
        router.replace(`/${lang}/dashboard`);
    }, [user, profile, isLoading, router, lang, searchParams, logout]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'loading', value: true });
        setError("");
        try {
            await login(email, password);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to sign in.";
            // Make Supabase's "Email not confirmed" readable
            if (msg.toLowerCase().includes("email not confirmed")) {
                setError(lang === "es"
                    ? "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
                    : "Please confirm your email before signing in. Check your inbox.");
            } else {
                setError(msg);
            }
            dispatch({ type: 'loading', value: false });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    // Wrong-role screen: contractor or admin tried customer login
    if (wrongRole) {
        const isContractor = wrongRole === "contractor";
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                        {lang === "es"
                            ? (isContractor ? "Esta es una cuenta de técnico" : "Esta es una cuenta de administrador")
                            : (isContractor ? "This is a technician account" : "This is an admin account")}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {lang === "es"
                            ? "Esta página es solo para clientes. Inicia sesión en el portal correcto."
                            : "This page is for customers only. Please sign in at the correct portal."}
                    </p>
                    <Link
                        href={isContractor ? `/${lang}/contractor/login` : `/${lang}/admin/login`}
                        className="block w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium shadow-sm hover:opacity-90 transition-all text-center"
                    >
                        {lang === "es"
                            ? (isContractor ? "Ir al portal de técnicos" : "Ir al portal de admin")
                            : (isContractor ? "Go to technician portal" : "Go to admin portal")}
                    </Link>
                    <button
                        onClick={() => dispatch({ type: 'dismiss' })}
                        className="text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors"
                    >
                        {lang === "es" ? "Intentar con otra cuenta" : "Try a different account"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex justify-center items-center mb-6">
                        <Image src="/dtailwash_logo_final.png" alt="DTailWash" width={527} height={142} className="w-auto h-28 sm:h-36 opacity-100" priority />
                    </div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">{dict.title}</h1>
                    <p className="text-[var(--text-secondary)] text-sm">{dict.subtitle}</p>
                </div>

                <div className="bg-[var(--card)] p-8 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--divider)]">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                {dict.email}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                placeholder="name@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                    {dict.password}
                                </label>
                                <Link href={`/${lang}/forgot-password`} className="text-xs text-[var(--accent)] hover:underline">
                                    {dict.forgotPassword}
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
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
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.signIn}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                            {dict.noAccount}{" "}
                            <Link
                                href={`/${lang}/register${searchParams.get("next") ? `?next=${searchParams.get("next")}` : ""}`}
                                className="text-[var(--accent)] hover:underline font-medium"
                            >
                                {dict.register}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Contractor link */}
                <div className="mt-4 text-center">
                    <Link href={`/${lang}/contractor/login`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                        {dict.contractorLink} →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
