"use client";

import { Service } from "@/contexts";
import Image from "next/image";

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (service: Service) => void;
  locale?: "en" | "es";
}

export default function ServiceCard({
  service,
  isSelected,
  onSelect,
  locale = "en",
}: ServiceCardProps) {
  const name = locale === "es" ? service.nameEs : service.name;
  const description = locale === "es" ? service.descriptionEs : service.description;

  return (
    <div
      onClick={() => onSelect(service)}
      className={`
        relative p-6 rounded-xl cursor-pointer transition-all duration-200
        border-2 hover:shadow-lg
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-blue-300"
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {service.image && (
        <div className="mb-4">
          <Image src={service.image} alt={name} width={80} height={80} className="rounded-lg" />
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{service.duration} {locale === "es" ? "minutos" : "minutes"}</span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">${service.basePrice}</span>
        <span className="text-sm text-gray-500">{locale === "es" ? "precio base" : "base price"}</span>
      </div>

      {service.id === "full-detail" && (
        <div className="absolute top-4 left-4">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            {locale === "es" ? "MÁS POPULAR" : "MOST POPULAR"}
          </span>
        </div>
      )}
    </div>
  );
}
