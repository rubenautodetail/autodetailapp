"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = use(params);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.push("/dashboard");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)] text-center relative overflow-hidden">
            {/* Background Gradient/Image Placeholder */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--accent)] via-[var(--background)] to-[var(--background)] pointer-events-none"></div>

            <div className="z-10 max-w-md w-full space-y-12">
                <div className="space-y-4">
                    {/* Logo Placeholder */}
                    <div className="w-24 h-24 bg-[var(--card)] rounded-3xl mx-auto shadow-[var(--shadow-card)] flex items-center justify-center mb-6">
                        <span className="text-4xl">🚗</span>
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                        AutoDetail
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] font-light">
                        Premium Auto Detailing. <br /> On Demand.
                    </p>
                </div>

                <div className="space-y-4 pt-8">
                    <Link
                        href="/register"
                        className="block w-full py-4 px-6 rounded-xl bg-[var(--accent)] text-white font-medium shadow-[var(--shadow-card)] hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        Create Account
                    </Link>

                    <Link
                        href="/login"
                        className="block w-full py-4 px-6 rounded-xl bg-[var(--card)] text-[var(--text-primary)] font-medium border border-[var(--divider)] shadow-sm hover:bg-[var(--background)] active:scale-[0.98] transition-all"
                    >
                        Login
                    </Link>
                </div>

                <div className="pt-8">
                    <p className="text-xs text-[var(--text-secondary)]">
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
