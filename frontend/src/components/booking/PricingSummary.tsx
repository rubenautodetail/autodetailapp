"use client";

import { Service, AddOn } from "@/contexts";
import { Card } from "@/components/ui/Card";

/** One quoted vehicle line. `total` includes that vehicle's service and add-ons. */
export interface PricingSummaryVehicleLine {
  key: string;
  label: string;
  sublabel?: string;
  total: number;
}

interface PricingSummaryProps {
  service: Service | null;
  addOns: AddOn[];
  subtotal: number;
  serviceFee: number;
  /** Authoritative booking total across all vehicles (matches the server quote). */
  total: number;
  locale?: "en" | "es";
  className?: string;
  /**
   * Per-vehicle quote lines. When provided, they carry the money itemization:
   * the service row drops its own price so every visible number sums to the total.
   */
  vehicleLines?: PricingSummaryVehicleLine[];
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
  vehicleLines,
  onRemoveAddOn,
}: PricingSummaryProps) {
  if (!service) {
    return null;
  }

  const serviceName = service.name;
  const hasLines = Boolean(vehicleLines && vehicleLines.length > 0);
  const isMultiVehicle = (vehicleLines?.length ?? 0) > 1;

  return (
    <Card className={`p-6 !bg-[#1A2142] !border-[#2C355E] ${className}`}>
      <h3 className="text-xl font-bold text-white mb-6">
        {locale === "es" ? "Resumen de Precio" : "Price Summary"}
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{serviceName}</p>
            <p className="text-sm text-[#8994B8]">
              {service.duration} {locale === "es" ? "min" : "min"}
            </p>
          </div>
          {/* With quote lines, the per-vehicle rows below carry the prices. */}
          {!hasLines && (
            <span className="font-bold text-white">${(Number(service.basePrice) || 0).toFixed(2)}</span>
          )}
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
                <span className="font-medium text-white">+${(Number(addOn.price) || 0).toFixed(2)}</span>
              </div>
            ))}
            {isMultiVehicle && (
              <p className="text-xs text-[#8994B8]">
                {locale === "es"
                  ? "Los extras se cobran por vehículo."
                  : "Add-ons are charged per vehicle."}
              </p>
            )}
          </div>
        )}

        {hasLines && (
          <div className="border-t border-[#2C355E] pt-4 mt-2 space-y-2.5" aria-live="polite">
            {vehicleLines!.map((line) => (
              <div key={line.key} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{line.label}</p>
                  {line.sublabel && (
                    <p className="text-xs text-[#8994B8]">{line.sublabel}</p>
                  )}
                </div>
                <span key={line.total} className="price-changed font-semibold text-white shrink-0">
                  ${line.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#2C355E] pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#A5B0D1] font-medium">{locale === "es" ? "Subtotal" : "Subtotal"}</span>
            <span className="font-bold text-white">${(Number(subtotal) || 0).toFixed(2)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A5B0D1] text-sm">{locale === "es" ? "Tarifa de servicio" : "Service fee"}</span>
              <span className="text-sm text-white">${(Number(serviceFee) || 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#2C355E] pt-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">
              {locale === "es" ? "Total de la reserva" : "Booking total"}
            </span>
            <span key={total} className="price-changed text-2xl font-bold text-[#D0B078]">
              ${(Number(total) || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
