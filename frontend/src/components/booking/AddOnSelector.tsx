"use client";

import { useState } from "react";
import { AddOn } from "@/contexts";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface AddOnSelectorProps {
  addOns: AddOn[];
  selectedAddOns: AddOn[];
  onAddOnToggle: (addOn: AddOn, selected: boolean) => void;
  locale?: "en" | "es";
  /** Shown under the heading when the list applies to one vehicle only. */
  forLabel?: string;
}

/**
 * Optional enhancements as a plain list: one row per extra with name, price and
 * toggle always visible. "What's included" opens the full list inside the row,
 * with no inner scrolling and no sideways carousel.
 */
export default function AddOnSelector({
  addOns,
  selectedAddOns,
  onAddOnToggle,
  locale = "en",
  forLabel,
}: AddOnSelectorProps) {
  const isEs = locale === "es";
  const [openIds, setOpenIds] = useState<Array<string | number>>([]);

  const isSelected = (addOnId: string | number) => selectedAddOns.some((a) => a.id === addOnId);
  const isOpen = (addOnId: string | number) => openIds.includes(addOnId);
  const toggleOpen = (addOnId: string | number) =>
    setOpenIds((prev) => (prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]));

  if (addOns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-xl font-bold text-white ${forLabel ? "mb-1" : "mb-2"}`}>
        {isEs ? "Extras Opcionales" : "Optional Enhancements"}
      </h3>
      {forLabel && (
        <p className="mb-2 text-sm font-semibold text-[#D0B078]" aria-live="polite">{forLabel}</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);
          const open = isOpen(addOn.id);
          const lines = (addOn.description ?? "")
            .split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && !/^=+$/.test(line));

          return (
            <li
              key={addOn.id}
              className={`rounded-[16px] border p-4 transition-colors ${
                selected
                  ? "border-[#D0B078] bg-[#D0B078]/10 ring-1 ring-[#D0B078]"
                  : "border-[#2C355E] bg-[#1A2142] hover:border-[#D0B078]/60"
              }`}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => onAddOnToggle(addOn, !selected)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAddOnToggle(addOn, !selected);
                  }
                }}
                className="flex cursor-pointer items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className={`block text-base font-bold leading-tight ${selected ? "text-[#D0B078]" : "text-white"}`}>
                    {addOn.name}
                  </span>
                  {lines.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOpen(addOn.id);
                      }}
                      className="mt-1 text-xs font-semibold text-[#D0B078] underline-offset-4 hover:underline"
                    >
                      {open
                        ? isEs ? "Ocultar" : "Hide"
                        : isEs ? "Ver qué incluye" : "What\u2019s included"}
                    </button>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-[#D0B078]">+${(Number(addOn.price) || 0).toFixed(2)}</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch
                      checked={selected}
                      onChange={(checked) => onAddOnToggle(addOn, checked)}
                      label={`Toggle ${addOn.name}`}
                    />
                  </div>
                </div>
              </div>

              {open && lines.length > 0 && (
                <ul className="mt-3 border-t border-[#2C355E] pt-3 text-sm leading-snug text-[#A5B0D1] sm:columns-2 sm:gap-x-8 space-y-1">
                  {lines.map((line: string, idx: number) => (
                    <li key={idx} className="flex gap-2 break-inside-avoid">
                      <span className="shrink-0 text-[#D0B078]">&#10003;</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
