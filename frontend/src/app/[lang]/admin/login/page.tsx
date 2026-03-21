"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const t = {
  en: {
    title: "Admin Portal",
    subtitle: "Sign in with your admin credentials",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    forbidden: "Access denied. This portal is for admins only.",
  },
  es: {
    title: "Portal Administrador",
    subtitle: "Inicia sesión con tus credenciales de administrador",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    forbidden: "Acceso denegado. Este portal es solo para administradores.",
  },
};

function AdminLoginForm() {
  const { login, logout, user, profile, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongRole, setWrongRole] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params.lang as "en" | "es") || "en";
  const dict = t[lang] ?? t.en;

  // Redirect after login — admin only
  useEffect(() => {
    if (isLoading || !user || !profile) return;
    if (profile.role !== "admin") {
      // Sign out immediately — non-admins cannot stay authenticated here
      setWrongRole(true);
      setLoading(false);
      logout().catch(() => {});
      return;
    }
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : `/${lang}/admin`);
  }, [user, profile, isLoading, router, lang, searchParams, logout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWrongRole(false);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            <Image src="/dtailwash_logo_final.png" alt="Rubens Admin Portal" width={390} height={105} className="w-auto h-20 sm:h-28" priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{dict.title}</h1>
          <p className="text-gray-500 text-sm">{dict.subtitle}</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                {dict.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                {dict.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {wrongRole && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                {dict.forbidden}
              </div>
            )}

            {error && !wrongRole && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.signIn}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">DetailWash · Admin</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
