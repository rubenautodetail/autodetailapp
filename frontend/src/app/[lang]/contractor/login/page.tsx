"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ContractorLoginPage() {
  const { login, profile, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isEs = lang === "es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users (e.g. back-navigation after session restore)
  useEffect(() => {
    if (isLoading || !user || !profile) return;
    if (profile.role === "contractor") {
      router.replace(
        profile.approval_status === "approved"
          ? `/${lang}/contractor/dashboard`
          : `/${lang}/contractor/pending`
      );
    } else {
      // Non-contractor (admin or regular user) — show error, stop spinner
      setLoading(false);
      setError(
        isEs
          ? "Esta cuenta no tiene acceso de contratista. Aplica primero."
          : "This account doesn't have contractor access. Apply first."
      );
    }
  }, [isLoading, user, profile, lang, router, isEs]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // Don't navigate here — let the useEffect handle redirect once
      // AuthContext finishes loading the profile after authentication.
    } catch {
      setError(
        isEs
          ? "Correo o contraseña incorrectos."
          : "Incorrect email or password."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1128] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 mb-4">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isEs ? "Portal de Técnicos" : "Technician Portal"}
          </h1>
          <p className="text-white/40 text-sm mt-1">Rubens Auto Detail</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
              {isEs ? "Correo electrónico" : "Email"}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
              {isEs ? "Contraseña" : "Password"}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? (isEs ? "Ingresando..." : "Signing in...")
              : (isEs ? "Ingresar" : "Sign in")}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-white/30 text-sm">
            {isEs ? "¿Nuevo técnico?" : "New technician?"}{" "}
            <Link
              href={`/${lang}/contractors/apply`}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              {isEs ? "Aplica aquí" : "Apply here"}
            </Link>
          </p>
          <Link
            href={`/${lang}`}
            className="block text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            ← {isEs ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
