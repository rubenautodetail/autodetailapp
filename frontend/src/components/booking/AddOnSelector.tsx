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
      <h3 className="text-lg font-semibold text-gray-900">
        {locale === "es" ? "Extras Opcionales" : "Optional Add-Ons"}
      </h3>

      <div className="space-y-2">
        {addOns.map((addOn) => {
          const selected = isSelected(addOn.id);
          const name = locale === "es" ? addOn.nameEs : addOn.name;
          const description = locale === "es" ? addOn.descriptionEs : addOn.description;

          return (
            <label
              key={addOn.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg cursor-pointer
                border-2 transition-all duration-200
                ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}
              `}
            >
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onAddOnToggle(addOn, e.target.checked)}
                  className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{name}</span>
                  <span className="font-semibold text-gray-900">+${addOn.price}</span>
                </div>

                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
