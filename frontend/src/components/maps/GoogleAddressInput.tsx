"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google Address Input Component
 * Uses PlaceAutocompleteElement (new API, replaces deprecated Autocomplete)
 * Required for API keys created after March 1, 2025.
 */

interface GoogleAddressInputProps {
  onAddressSelect: (data: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  initialValue?: string;
  locale?: "en" | "es";
  className?: string;
  onZipValidation?: (zipCode: string) => Promise<boolean>;
}

export default function GoogleAddressInput({
  onAddressSelect,
  placeholder,
  initialValue = "",
  locale = "en",
  className = "",
}: GoogleAddressInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementRef = useRef<any>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setMapsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 200);
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Poll until the places library is fully initialized
      const checkReady = setInterval(() => {
        if (window.google?.maps?.places) {
          setMapsLoaded(true);
          clearInterval(checkReady);
        }
      }, 100);
      setTimeout(() => clearInterval(checkReady), 10000);
    };
    document.head.appendChild(script);
  }, [locale]);

  // Create and attach PlaceAutocompleteElement (new API)
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current || elementRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Places = (window.google.maps.places as any);

    if (!Places?.PlaceAutocompleteElement) {
      console.error("PlaceAutocompleteElement not available — check that Places API is enabled.");
      return;
    }

    try {
      const placeAutocomplete = new Places.PlaceAutocompleteElement({
        componentRestrictions: { country: "us" },
        types: ["address"],
      });

      // Apply minimal inline styles to make it fill the container
      placeAutocomplete.style.width = "100%";
      if (placeholder) {
        placeAutocomplete.setAttribute("placeholder", placeholder);
      }

      containerRef.current.appendChild(placeAutocomplete);
      elementRef.current = placeAutocomplete;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      placeAutocomplete.addEventListener("gmp-placeselect", async (event: any) => {
        const place = event.place;

        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location", "addressComponents"],
        });

        if (!place.location) {
          setValidationMessage(
            locale === "es"
              ? "Dirección inválida. Por favor selecciona de la lista."
              : "Invalid address. Please select from the dropdown."
          );
          return;
        }

        const latitude = place.location.lat();
        const longitude = place.location.lng();
        const address = place.formattedAddress || "";

        // New API uses longText/shortText instead of long_name/short_name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getComponent = (type: string, short = false) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = place.addressComponents?.find((comp: any) =>
            comp.types.includes(type)
          );
          return short ? (c?.shortText || "") : (c?.longText || "");
        };

        const zipCode = getComponent("postal_code");
        const city = getComponent("locality");
        const state = getComponent("administrative_area_level_1", true);

        if (!zipCode) {
          setValidationMessage(
            locale === "es"
              ? "No se pudo determinar el código postal."
              : "Could not determine ZIP code."
          );
          return;
        }

        setValidationMessage("");
        onAddressSelect({ address, city, state, zipCode, latitude, longitude });
      });
    } catch (err) {
      console.error("Failed to initialize PlaceAutocompleteElement:", err);
    }

    return () => {
      if (elementRef.current && containerRef.current?.contains(elementRef.current)) {
        containerRef.current.removeChild(elementRef.current);
      }
      elementRef.current = null;
    };
  }, [mapsLoaded, locale, onAddressSelect, placeholder]);

  return (
    <div className={`relative ${className}`}>
      {/* PlaceAutocompleteElement mounts here */}
      <div ref={containerRef} className="w-full" />

      {validationMessage && (
        <div className="mt-2 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
          {validationMessage}
        </div>
      )}

      {!mapsLoaded && (
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
          {locale === "es" ? "Cargando mapa..." : "Loading maps..."}
        </div>
      )}
    </div>
  );
}
