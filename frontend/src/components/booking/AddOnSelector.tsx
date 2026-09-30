"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AddOn } from "@/contexts";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Card } from "@/components/ui/Card";

interface AddOnSelectorProps {
  addOns: AddOn[];
  selectedAddOns: AddOn[];
  onAddOnToggle: (addOn: AddOn, selected: boolean) => void;
  locale?: "en" | "es";
  /** Shown under the heading when the list applies to one vehicle only. */
  forLabel?: string;
}

export default function AddOnSelector({
  addOns,
  selectedAddOns,
  onAddOnToggle,
  locale = "en",
  forLabel,
}: AddOnSelectorProps) {
  const isSelected = (addOnId: string | number) => {
    return selectedAddOns.some((a) => a.id === addOnId);
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: reduceMotion ? "auto" : "smooth" });
  };

  if (addOns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-xl font-bold text-white ${forLabel ? "mb-1" : "mb-6"}`}>
        {locale === "es" ? "Extras Opcionales" : "Optional Enhancements"}
      </h3>
      {forLabel && (
        <p className="mb-6 text-sm font-semibold text-[#D0B078]" aria-live="polite">{forLabel}</p>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollCarousel(-1)}
          aria-label={locale === "es" ? "Extra anterior" : "Previous enhancement"}
          className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0f1430]/90 text-white backdrop-blur transition-colors hover:border-[#D0B078] hover:text-[#D0B078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] sm:flex"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollCarousel(1)}
          aria-label={locale === "es" ? "Siguiente extra" : "Next enhancement"}
          className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0f1430]/90 text-white backdrop-blur transition-colors hover:border-[#D0B078] hover:text-[#D0B078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] sm:flex"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);

          return (
            <div
              key={addOn.id}
              className={`shrink-0 snap-start transition-all duration-300 ${
                selected ? "w-80 sm:w-96" : "w-56 sm:w-64"
              }`}
            >
            <Card
              className={`
                flex h-full flex-col p-5 transition-all duration-300 !shadow-none
                ${selected
                  ? '!border-[#D0B078] ring-1 ring-[#D0B078] !bg-[#D0B078]/10'
                  : '!border-[#2C355E] !bg-[#1A2142] hover:!border-[#D0B078]/60'
                }
              `}
              onClick={() => onAddOnToggle(addOn, !selected)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAddOnToggle(addOn, !selected);
                }
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-lg ${selected ? 'text-[#D0B078]' : 'text-white'}`}>
                      {addOn.name}
                    </span>
                    <span className="font-semibold text-[#D0B078]">+${(Number(addOn.price) || 0).toFixed(2)}</span>
                  </div>
                 {addOn.description && (
    <ul className="text-sm text-[#A5B0D1] space-y-1 max-h-40 overflow-y-auto pr-1 -mr-4 gold-scrollbar">
        {addOn.description
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && !/^=+$/.test(line))
            .map((line: string, idx: number) => (
                <li key={idx} className="flex gap-2">
                    <span className="text-white/40 shrink-0">•</span>
                    <span>{line}</span>
                </li>
            ))}
    </ul>
)}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="pl-2 border-l border-[#2C355E]" onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch
                      checked={selected}
                      onChange={(checked) => onAddOnToggle(addOn, checked)}
                      label={`Toggle ${addOn.name}`}
                    />
                  </div>
                </div>
              </div>
            </Card>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
