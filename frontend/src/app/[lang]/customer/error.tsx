"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const isEs = params?.lang === "es";

  useEffect(() => {
    console.error("[Customer Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          {isEs ? "Algo salió mal" : "Something went wrong"}
        </h2>
        <p className="text-text-secondary text-sm">
          {isEs
            ? "Hubo un error al cargar el panel. Por favor, inténtalo de nuevo."
            : "There was an error loading your dashboard. Please try again."}
        </p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm"
        >
          {isEs ? "Intentar de nuevo" : "Try again"}
        </button>
      </div>
    </div>
  );
}
