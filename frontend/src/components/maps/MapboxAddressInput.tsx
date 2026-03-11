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
  center: [number, number];
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
  zipCode?: string;
}

export default function MapboxAddressInput({
  onAddressSelect,
  placeholder,
  initialValue = "",
  locale = "en",
  className = "",
  zipCode = "",
}: MapboxAddressInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Geocode the ZIP once to get a proximity center for better suggestions
  const [zipCenter, setZipCenter] = useState<[number, number] | null>(null);
  useEffect(() => {
    if (!zipCode || zipCode.length !== 5 || !TOKEN) return;
    const controller = new AbortController();
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${TOKEN}&country=us&types=postcode&limit=1`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(d => {
        if (d.features?.[0]?.center) setZipCenter(d.features[0].center);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [zipCode, TOKEN]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (!value || value.length < 3 || !TOKEN) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(value);
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${TOKEN}&country=us&types=address&autocomplete=true&limit=7`;

      // Bias results toward the ZIP code area
      if (zipCenter) {
        url += `&proximity=${zipCenter[0]},${zipCenter[1]}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.message) {
        console.error("Mapbox API error:", data.message);
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const features: MapboxFeature[] = data.features ?? [];

      // Sort: prefer results that match the entered ZIP, but don't discard others
      if (zipCode) {
        features.sort((a, b) => {
          const aZip = a.context?.find((c) => c.id.startsWith("postcode"))?.text;
          const bZip = b.context?.find((c) => c.id.startsWith("postcode"))?.text;
          const aMatch = aZip === zipCode ? 0 : 1;
          const bMatch = bZip === zipCode ? 0 : 1;
          return aMatch - bMatch;
        });
      }

      setSuggestions(features.slice(0, 5));
      setOpen(features.length > 0);
    } catch (err) {
      console.error("Mapbox geocoding error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [TOKEN, zipCode, zipCenter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    const ctx = feature.context ?? [];

    const zipEntry = ctx.find((c) => c.id.startsWith("postcode"));
    const cityEntry = ctx.find((c) => c.id.startsWith("place"));
    const regionEntry = ctx.find((c) => c.id.startsWith("region"));

    const resolvedZipCode = zipEntry?.text ?? zipCode;
    const city = cityEntry?.text ?? "";
    const state = regionEntry?.short_code?.replace("US-", "") ?? "";

    setQuery(feature.place_name);
    setSuggestions([]);
    setOpen(false);

    onAddressSelect({
      address: feature.place_name,
      city,
      state,
      zipCode: resolvedZipCode,
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
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D0B078] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? (locale === "es" ? "Ingresa tu dirección" : "Enter your address")}
          className="w-full pl-12 pr-10 py-4 bg-white/5 border border-[#2C355E] rounded-xl text-base placeholder:text-[#5E698F] focus:outline-none focus:ring-2 focus:ring-[#D0B078] focus:border-transparent transition-all"
          style={{ color: "#FFFFFF", fontSize: "16px" }}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D0B078]" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[60] w-full mt-2 bg-[#1A2142] border border-[#2C355E] rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((f, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(f)}
              className="px-4 py-3.5 cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              <span className="font-medium text-white text-sm">{f.text}</span>
              <span className="text-[#5E698F] text-sm ml-1">
                {f.place_name.replace(f.text ?? "", "").replace(/^,\s*/, "")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
