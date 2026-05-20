"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isEs = lang === "es";

  useEffect(() => {
    console.error("[Auth Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="bg-[var(--card)] border border-[var(--divider)] shadow-[var(--shadow-card)] rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {isEs ? "Error de autenticaci\u00f3n" : "Authentication error"}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">
          {isEs
            ? "Hubo un problema con la autenticaci\u00f3n. Por favor, int\u00e9ntalo de nuevo."
            : "There was an authentication problem. Please try again."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-bold text-sm hover:opacity-90 transition-all"
          >
            {isEs ? "Intentar de nuevo" : "Try again"}
          </button>
          <Link
            href={`/${lang}`}
            className="flex-1 px-6 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--divider)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--divider)] transition-colors"
          >
            {isEs ? "Ir al inicio" : "Go home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
