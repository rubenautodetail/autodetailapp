"use client";

import { AddOn } from "@/contexts";

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
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary">
        {locale === "es" ? "Extras Opcionales" : "Optional Add-Ons"}
      </h3>

      <div className="space-y-2">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);
          const name = addOn.name;  // Already localized from Strapi
          const description = addOn.description;  // Already localized from Strapi

          return (
            <label
              key={addOn.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg cursor-pointer
                border-2 transition-all duration-200
                ${selected ? "border-accent-gold bg-accent-gold/10" : "border-white/10 bg-white/5 hover:border-accent-gold/50"}
              `}
            >
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onAddOnToggle(addOn, e.target.checked)}
                  className="w-5 h-5 text-accent-gold border-white/20 rounded focus:ring-2 focus:ring-accent-gold bg-white/5 cursor-pointer"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">{name}</span>
                  <span className="font-semibold text-accent-gold">+${addOn.price}</span>
                </div>

                {description && (
                  <p className="text-sm text-text-secondary mt-1">{description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
