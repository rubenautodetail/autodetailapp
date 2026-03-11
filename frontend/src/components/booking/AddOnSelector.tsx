"use client";

import { AddOn } from "@/contexts";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Card } from "@/components/ui/Card";

interface AddOnSelectorProps {
  addOns: AddOn[];
  selectedAddOns: AddOn[];
  onAddOnToggle: (addOn: AddOn, selected: boolean) => void;
  locale?: "en" | "es";
}

export default function AddOnSelector({
  addOns,
  selectedAddOns,
  onAddOnToggle,
  locale = "en",
}: AddOnSelectorProps) {
  const isSelected = (addOnId: string | number) => {
    return selectedAddOns.some((a) => a.id === addOnId);
  };

  if (addOns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        {locale === "es" ? "Extras Opcionales" : "Optional Enhancements"}
      </h3>

      <div className="space-y-3">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);

          return (
            <Card
              key={addOn.id}
              className={`
                p-5 transition-all duration-300
                ${selected
                  ? 'border-[#D0B078] ring-1 ring-[#D0B078] bg-[#D0B078]/5'
                  : 'border-[var(--divider)] hover:border-[#D0B078]/50'
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
                    <span className={`font-bold text-lg ${selected ? 'text-[#D0B078]' : 'text-[var(--text-primary)]'}`}>
                      {addOn.name}
                    </span>
                    <span className="font-semibold text-[#D0B078]">+${addOn.price.toFixed(2)}</span>
                  </div>
                  {addOn.description && (
                    <p className="text-sm text-[var(--text-secondary)]">{addOn.description}</p>
                  )}
                </div>

                <div className="pl-2 border-l border-[var(--divider)] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={selected}
                    onChange={(checked) => onAddOnToggle(addOn, checked)}
                    label={`Toggle ${addOn.name}`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
