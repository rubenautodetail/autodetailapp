"use client";

import { Suspense, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function ForgotPasswordForm() {
    const { supabase } = useAuth();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const params = useParams();
    const lang = (params.lang as "en" | "es") || "en";

    const dict = {
        en: {
            title: "Reset Password",
            subtitle: "Enter your email to receive a reset link.",
            email: "Email",
            submit: "Send Reset Link",
            success: "Check your email for the reset link!",
            backToLogin: "Back to Login",
        },
        es: {
            title: "Restablecer Contraseña",
            subtitle: "Ingresa tu correo para recibir un enlace de restablecimiento.",
            email: "Correo electrónico",
            submit: "Enviar enlace",
            success: "¡Revisa tu correo para el enlace de restablecimiento!",
            backToLogin: "Regresar al inicio de sesión",
        }
    };

    const t = dict[lang] || dict.en;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/${lang}/login?reset=true`,
            });
            if (error) {
                setStatus("error");
                setMessage(error.message);
            } else {
                setStatus("success");
                setMessage(t.success);
            }
        } catch (err: unknown) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "An error occurred");
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
                            <Link href={`/${lang}/login`} className="w-full inline-block py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all">
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
                                <Link href={`/${lang}/login`} className="text-[var(--text-secondary)] text-sm hover:underline">
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
