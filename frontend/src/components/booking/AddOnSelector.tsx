"use client";

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

      <div className="space-y-3">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);

          return (
            <Card
              key={addOn.id}
              className={`
                p-5 transition-all duration-300 !shadow-none
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
                    <p className="text-sm text-[#A5B0D1]">{addOn.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOnToggle(addOn, false);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                      aria-label={locale === "es" ? `Quitar ${addOn.name}` : `Remove ${addOn.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
          );
        })}
      </div>
    </div>
  );
}
