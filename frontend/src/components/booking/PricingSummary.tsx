"use client";

import { Service, AddOn } from "@/contexts";
import { Card } from "@/components/ui/Card";

interface PricingSummaryProps {
  service: Service | null;
  addOns: AddOn[];
  subtotal: number;
  serviceFee: number;
  total: number;
  locale?: "en" | "es";
  className?: string;
  vehicleCount?: number;
  onRemoveAddOn?: (addOnId: string | number) => void;
}

export default function PricingSummary({
  service,
  addOns,
  subtotal,
  serviceFee,
  total,
  locale = "en",
  className = "",
  vehicleCount = 1,
  onRemoveAddOn,
}: PricingSummaryProps) {
  if (!service) {
    return null;
  }

  const serviceName = service.name;

  return (
    <Card className={`p-6 !bg-[#1A2142] !border-[#2C355E] ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6">
        {locale === "es" ? "Resumen de Precio" : "Price Summary"}
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{serviceName}</p>
            <p className="text-sm text-[#5E698F]">
              {service.duration} {locale === "es" ? "min" : "min"}
            </p>
          </div>
          <span className="font-bold text-white">${service.basePrice.toFixed(2)}</span>
        </div>

        {addOns.length > 0 && (
          <div className="space-y-2 pt-2">
            {addOns.map((addOn) => (
              <div key={addOn.id} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-2">
                  {onRemoveAddOn && (
                    <button
                      type="button"
                      onClick={() => onRemoveAddOn(addOn.id)}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-colors flex-shrink-0"
                      aria-label={locale === "es" ? `Quitar ${addOn.name}` : `Remove ${addOn.name}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <span className="text-[#A5B0D1]">{addOn.name}</span>
                </div>
                <span className="font-medium text-white">+${addOn.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#2C355E] pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#A5B0D1] font-medium">{locale === "es" ? "Subtotal" : "Subtotal"}</span>
            <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A5B0D1] text-sm">{locale === "es" ? "Tarifa de servicio" : "Service fee"}</span>
              <span className="text-sm text-white">${serviceFee.toFixed(2)}</span>
            </div>
          )}
        </div>

        {vehicleCount > 1 && (
          <div className="border-t border-[#2C355E] pt-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A5B0D1] font-medium">
                {locale === "es" ? "Por vehículo" : "Per vehicle"}
              </span>
              <span className="font-bold text-white">${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A5B0D1] text-sm">
                &times; {vehicleCount} {locale === "es" ? "vehículos" : "vehicles"}
              </span>
              <span className="text-sm text-[#A5B0D1]">${(total * vehicleCount).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="border-t border-[#2C355E] pt-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">
              {locale === "es" ? "Total" : "Total"}
            </span>
            <span className="text-2xl font-bold text-[#D0B078]">${(total * vehicleCount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
