"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ContractorLoginPage() {
  const { login, logout, profile, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isEs = lang === "es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <div className="flex justify-center mb-5">
            <Image
              src="/dtailwash_logo_final.png"
              alt="DTailWash"
              width={160}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isEs ? "Portal de Técnicos" : "Technician Portal"}
          </h1>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
