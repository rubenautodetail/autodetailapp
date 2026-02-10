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

  const serviceName = locale === "es" ? service.nameEs : service.name;

  return (
    <div className={`bg-white rounded-xl border-2 border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {locale === "es" ? "Resumen de Precio" : "Price Summary"}
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{serviceName}</p>
            <p className="text-sm text-gray-500">
              {service.duration} {locale === "es" ? "min" : "min"}
            </p>
          </div>
          <span className="font-medium text-gray-900">${service.basePrice.toFixed(2)}</span>
        </div>

        {addOns.map((addOn) => {
          const name = locale === "es" ? addOn.nameEs : addOn.name;
          return (
            <div key={addOn.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{name}</span>
              <span className="text-gray-900">+${addOn.price.toFixed(2)}</span>
            </div>
          );
        })}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">{locale === "es" ? "Subtotal" : "Subtotal"}</span>
            <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              {locale === "es" ? "Tarifa de servicio" : "Service fee"} (5%)
            </span>
            <span className="text-sm text-gray-600">${serviceFee.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
              {locale === "es" ? "Total" : "Total"}
            </span>
            <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
