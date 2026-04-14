"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ContractorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const isEs = params?.lang === "es";

  useEffect(() => {
    console.error("[Contractor Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
      <div className="bg-[#1A2142] border border-[#2C355E] rounded-xl p-8 max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">
          {isEs ? "Algo salió mal" : "Something went wrong"}
        </h2>
        <p className="text-[#A5B0D1] text-sm">
          {isEs
            ? "Hubo un error al cargar el portal del contratista. Por favor, inténtalo de nuevo."
            : "There was an error loading the contractor portal. Please try again."}
        </p>
        <button
          onClick={reset}
          className="bg-[#D0B078] text-[#131835] hover:bg-[#C5A56D] px-6 py-3 rounded-lg font-semibold text-sm"
        >
          {isEs ? "Intentar de nuevo" : "Try again"}
        </button>
      </div>
    </div>
  );
}
