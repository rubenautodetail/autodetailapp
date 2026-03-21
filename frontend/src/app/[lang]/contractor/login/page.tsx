"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ContractorLoginPage() {
  const { login, logout, profile, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isEs = lang === "es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongRole, setWrongRole] = useState<string | null>(null);
  // Track whether the user just attempted login (vs. arrived already logged in)
  const justLoggedIn = useRef(false);

  // Handle post-login role enforcement + already-logged-in redirect
  useEffect(() => {
    if (isLoading || !user) return;

    // Profile still loading — wait
    if (!profile) return;

    const role = profile.role;

    // Contractor → go to correct destination based on approval status
    if (role === "contractor") {
      if (profile.approval_status === "approved") {
        router.replace(`/${lang}/contractor/dashboard`);
      } else if (!profile.approval_status) {
        // Never applied — send to application form
        router.replace(`/${lang}/contractors/apply`);
      } else {
        // Applied but not yet approved (pending / rejected)
        router.replace(`/${lang}/contractor/pending`);
      }
      return;
    }

    // Admin can access contractor portal too
    if (role === "admin") {
      router.replace(`/${lang}/contractor/dashboard`);
      return;
    }

    // Wrong role — sign them out and show a clear message
    if (role === "user") {
      setWrongRole("user");
      setLoading(false);
      // Auto sign-out so they don't stay in a broken session
      logout().catch(() => {});
      return;
    }
  }, [isLoading, user, profile, lang, router, logout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWrongRole(null);
    justLoggedIn.current = true;

    try {
      await login(email, password);
      // useEffect handles redirect once profile loads.
      // Safety timeout: if profile never loads within 8s, unfreeze the button.
      setTimeout(() => {
        setLoading((prev) => {
          if (prev) {
            setError(isEs ? "Error de conexión. Intenta de nuevo." : "Connection error. Please try again.");
          }
          return false;
        });
      }, 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError(
          isEs
            ? "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
            : "Please confirm your email before signing in. Check your inbox."
        );
      } else {
        setError(
          isEs
            ? "Correo o contraseña incorrectos."
            : "Incorrect email or password."
        );
      }
      setLoading(false);
      justLoggedIn.current = false;
    }
  };

  // Wrong-role screen: user tried to log in but they're not a contractor
  if (wrongRole === "user") {
    return (
      <div className="min-h-screen bg-[#0D1128] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            {isEs ? "Cuenta no es de técnico" : "Not a technician account"}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            {isEs
              ? "Esta cuenta es de cliente. Si deseas trabajar como técnico, primero debes aplicar."
              : "This is a customer account. To work as a technician, you need to apply first."}
          </p>
          <div className="space-y-3">
            <Link
              href={`/${lang}/register?next=/${lang}/contractors/apply`}
              className="block w-full py-3 rounded-xl bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 transition-colors"
            >
              {isEs ? "Aplicar como técnico" : "Apply as technician"}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="block w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
            >
              {isEs ? "Ir al inicio de sesión de cliente" : "Go to customer login"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-white/40 text-sm mt-1">DetailWash</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">
                {isEs ? "Contraseña" : "Password"}
              </label>
              <Link href={`/${lang}/forgot-password?from=contractor`} className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors">
                {isEs ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
              </Link>
            </div>
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
              href={`/${lang}/register?next=/${lang}/contractors/apply`}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              {isEs ? "Aplica aquí" : "Apply here"}
            </Link>
          </p>
          <p className="text-white/30 text-sm">
            {isEs ? "¿Cliente?" : "Customer?"}{" "}
            <Link
              href={`/${lang}/login`}
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              {isEs ? "Inicia sesión aquí" : "Sign in here"}
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
