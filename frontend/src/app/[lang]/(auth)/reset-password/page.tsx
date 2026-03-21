"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

function ResetPasswordForm() {
    const supabase = useRef(createClient()).current;
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const lang = (params.lang as "en" | "es") || "en";
    const isContractorFlow = searchParams.get("from") === "contractor";
    const loginHref = isContractorFlow ? `/${lang}/contractor/login` : `/${lang}/login`;

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [sessionReady, setSessionReady] = useState<boolean | null>(null);

    useEffect(() => {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') as EmailOtpType | null;

        if (tokenHash && type) {
            // token_hash flow: verify client-side so the browser client owns the session
            supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
                if (!error && data.session) {
                    setSessionReady(true);
                } else {
                    setSessionReady(false);
                }
            });
            return;
        }

        // Fallback: check existing session (page refresh) or catch hash-fragment flow
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setSessionReady(true);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
            } else {
                setTimeout(() => {
                    setSessionReady((prev) => (prev === null ? false : prev));
                }, 2000);
            }
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const t = {
        en: {
            title: "Set New Password",
            subtitle: "Enter and confirm your new password.",
            password: "New Password",
            confirm: "Confirm Password",
            submit: "Update Password",
            success: "Password updated! Redirecting to login...",
            mismatch: "Passwords do not match.",
            short: "Password must be at least 8 characters.",
        },
        es: {
            title: "Nueva Contraseña",
            subtitle: "Ingresa y confirma tu nueva contraseña.",
            password: "Nueva contraseña",
            confirm: "Confirmar contraseña",
            submit: "Actualizar contraseña",
            success: "¡Contraseña actualizada! Redirigiendo...",
            mismatch: "Las contraseñas no coinciden.",
            short: "La contraseña debe tener al menos 8 caracteres.",
        },
    }[lang] ?? {
        title: "Set New Password",
        subtitle: "Enter and confirm your new password.",
        password: "New Password",
        confirm: "Confirm Password",
        submit: "Update Password",
        success: "Password updated! Redirecting to login...",
        mismatch: "Passwords do not match.",
        short: "Password must be at least 8 characters.",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        if (password.length < 8) {
            setStatus("error");
            setMessage(t.short);
            return;
        }
        if (password !== confirm) {
            setStatus("error");
            setMessage(t.mismatch);
            return;
        }

        setStatus("loading");
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setStatus("error");
                setMessage(error.message);
                return;
            }
            // Sign out non-blocking — don't await so a stale session can't hang the flow
            supabase.auth.signOut().catch(() => {});
            setStatus("success");
            setMessage(t.success);
            setTimeout(() => router.push(loginHref), 2000);
        } catch (err: unknown) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "Failed to update password. Please try again.");
        }
    };

    // Loading
    if (sessionReady === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    // No session = link expired or invalid
    if (!sessionReady) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
                <div className="w-full max-w-sm bg-[var(--card)] p-8 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--divider)] text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                        {lang === "es" ? "Enlace inválido o expirado" : "Invalid or expired link"}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">
                        {lang === "es"
                            ? "Este enlace ya no es válido. Solicita un nuevo enlace de restablecimiento."
                            : "This link is no longer valid. Please request a new password reset link."}
                    </p>
                    <Link
                        href={`/${lang}/forgot-password`}
                        className="inline-block w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium text-center hover:opacity-90 transition-all"
                    >
                        {lang === "es" ? "Solicitar nuevo enlace" : "Request new link"}
                    </Link>
                </div>
            </div>
        );
    }

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
                            <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
                                {message}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    {t.password}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    {t.confirm}
                                </label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
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
                                    {lang === "es" ? "Regresar al inicio de sesión" : "Back to Login"}
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
