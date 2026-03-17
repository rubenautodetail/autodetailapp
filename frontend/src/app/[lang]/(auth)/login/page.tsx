"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
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
    const { login, user, profile, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const lang = (params.lang as "en" | "es") || "en";
    const dict = t[lang] ?? t.en;

    // Role-based redirect after login
    useEffect(() => {
        if (isLoading || !user || !profile) return;
        const next = searchParams.get("next");
        if (next && next.startsWith("/")) { router.replace(next); return; }
        if (profile.role === "admin") router.replace(`/${lang}/admin`);
        else if (profile.role === "contractor") router.replace(`/${lang}/contractor/dashboard`);
        else router.replace(`/${lang}/dashboard`);
    }, [user, profile, isLoading, router, lang, searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to sign in.");
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="text-2xl font-bold text-[var(--accent)]">✦</span>
                        <span className="text-xl font-bold text-[var(--text-primary)]">Rubens Detail</span>
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
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
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
