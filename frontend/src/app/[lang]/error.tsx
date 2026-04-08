"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function LangError({
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
    console.error("[Page Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          {isEs ? "Algo sali\u00f3 mal" : "Something went wrong"}
        </h2>
        <p className="text-text-secondary text-sm">
          {isEs
            ? "Ocurri\u00f3 un error inesperado. Por favor, int\u00e9ntalo de nuevo."
            : "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-text-secondary/50 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 btn-primary px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            {isEs ? "Intentar de nuevo" : "Try again"}
          </button>
          <Link
            href={`/${lang}`}
            className="flex-1 glass-card hover:bg-white/10 text-text-secondary px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            {isEs ? "Ir al inicio" : "Go home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
