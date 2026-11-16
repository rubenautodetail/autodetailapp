"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitch from "@/components/landing/LanguageSwitch";
import { useBooking } from "@/contexts/BookingContext";

// Home button: steps 1-5. EN/ES switch: only the open steps (1-4).
// Confirmation never shows either.
const STEP_PATH = /^\/(en|es)\/booking\/(select|location|schedule|review|payment)\/?$/;
const LANG_STEPS = new Set(["select", "location", "schedule", "review"]);

/**
 * Top bar for booking steps: "← Home" on the left, EN/ES switch on the right.
 * What the customer already chose lives in the browser, not in the URL, so changing
 * language loses nothing. If the booking already has data, leaving asks first.
 */
export default function BookingLanguageSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const { bookingVehicles, selectedService } = useBooking();
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setSearch(window.location.search);
    setConfirmOpen(false);
  }, [pathname]);

  const match = pathname?.match(STEP_PATH);
  if (!match) return null;

  const current = match[1] as "en" | "es";
  const target = current === "en" ? "es" : "en";
  const isEs = current === "es";
  const homeHref = `/${current}`;
  const hasData = bookingVehicles.length > 0 || !!selectedService;

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3 sm:px-6">
        <Link
          href={homeHref}
          onClick={(e) => {
            if (hasData) {
              e.preventDefault();
              setConfirmOpen(true);
            }
          }}
          className="flex h-9 items-center gap-1 rounded-full border border-[#D0B078]/60 bg-black/20 px-3 text-xs font-semibold uppercase tracking-widest text-[#D0B078] backdrop-blur-sm transition-colors hover:border-[#D0B078] hover:text-white"
        >
          <span aria-hidden>←</span>
          {isEs ? "Inicio" : "Home"}
        </Link>
        {LANG_STEPS.has(match[2]) && (
          <LanguageSwitch locale={current} href={`/${target}/booking/${match[2]}${search}`} />
        )}
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[20px] border border-[#2C355E] bg-[#1A2142] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-white">
              {isEs ? "¿Salir de la reserva?" : "Leave your booking?"}
            </p>
            <p className="mt-2 text-sm text-[#A5B0D1]">
              {isEs
                ? "Tu reserva aún no se ha guardado. Si sales, tendrás que empezar de nuevo."
                : "Your booking isn't saved yet. If you leave, you'll need to start over."}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full bg-[#D0B078] px-4 py-2.5 text-sm font-bold text-[#131835]"
              >
                {isEs ? "Quedarme" : "Stay"}
              </button>
              <button
                type="button"
                onClick={() => router.push(homeHref)}
                className="flex-1 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isEs ? "Ir al inicio" : "Go home"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
