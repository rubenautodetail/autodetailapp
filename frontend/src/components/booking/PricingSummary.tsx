"use client";

import { Service, AddOn } from "@/contexts";

interface PricingSummaryProps {
  service: Service | null;
  addOns: AddOn[];
  subtotal: number;
  serviceFee: number;
  total: number;
  locale?: "en" | "es";
  className?: string;
}

export default function PricingSummary({
  service,
  addOns,
  subtotal,
  serviceFee,
  total,
  locale = "en",
  className = "",
}: PricingSummaryProps) {
  if (!service) {
    return null;
  }

  const serviceName = service.name;  // Already localized from Strapi

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        {locale === "es" ? "Resumen de Precio" : "Price Summary"}
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">{serviceName}</p>
            <p className="text-sm text-text-muted">
              {service.duration} {locale === "es" ? "min" : "min"}
            </p>
          </div>
          <span className="font-medium text-text-primary">${service.basePrice.toFixed(2)}</span>
        </div>

        {addOns.map((addOn) => {
          const name = addOn.name;  // Already localized from Strapi
          return (
            <div key={addOn.id} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{name}</span>
              <span className="text-text-primary">+${addOn.price.toFixed(2)}</span>
            </div>
          );
        })}

        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary">{locale === "es" ? "Subtotal" : "Subtotal"}</span>
            <span className="font-medium text-text-primary">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">
              {locale === "es" ? "Tarifa de servicio" : "Service fee"} (5%)
            </span>
            <span className="text-sm text-text-secondary">${serviceFee.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-text-primary">
              {locale === "es" ? "Total" : "Total"}
            </span>
            <span className="text-2xl font-bold text-accent-gold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
