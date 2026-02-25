"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AddressResult {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{ id: string; text: string; short_code?: string }>;
  properties?: { address?: string };
  text?: string;
}

interface MapboxAddressInputProps {
  onAddressSelect: (data: AddressResult) => void;
  placeholder?: string;
  initialValue?: string;
  locale?: "en" | "es";
  className?: string;
}

export default function MapboxAddressInput({
  onAddressSelect,
  placeholder,
  initialValue = "",
  locale = "en",
  className = "",
}: MapboxAddressInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const fetchSuggestions = useCallback(async (value: string) => {
    if (!value || value.length < 3 || !TOKEN) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(value);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${TOKEN}&country=us&types=address&autocomplete=true&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features ?? []);
      setOpen(true);
    } catch (err) {
      console.error("Mapbox geocoding error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [TOKEN]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    const ctx = feature.context ?? [];

    const zipEntry = ctx.find((c) => c.id.startsWith("postcode"));
    const cityEntry = ctx.find((c) => c.id.startsWith("place"));
    const regionEntry = ctx.find((c) => c.id.startsWith("region"));

    const zipCode = zipEntry?.text ?? "";
    const city = cityEntry?.text ?? "";
    const state = regionEntry?.short_code?.replace("US-", "") ?? "";

    setQuery(feature.place_name);
    setSuggestions([]);
    setOpen(false);

    onAddressSelect({
      address: feature.place_name,
      city,
      state,
      zipCode,
      latitude: lat,
      longitude: lng,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? (locale === "es" ? "Ingresa tu dirección" : "Enter your address")}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((f, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(f)}
              className="px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">{f.text}</span>
              <span className="text-gray-500 ml-1">
                {f.place_name.replace(f.text ?? "", "").replace(/^,\s*/, "")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
