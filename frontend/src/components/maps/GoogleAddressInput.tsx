"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google Address Input Component
 * Plain text input with optional Google Places Autocomplete enhancement
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
  onZipValidation,
}: GoogleAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Update input when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  // Try to load Google Maps and attach Autocomplete
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    // Load Google Maps script manually
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setMapsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 200);
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${locale}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) {
        setMapsLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, [locale]);

  // Attach Autocomplete to input when Maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "geometry", "address_components"],
        types: ["address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location || !place.address_components) {
          setValidationMessage(
            locale === "es"
              ? "Dirección inválida. Por favor selecciona de la lista."
              : "Invalid address. Please select from the dropdown."
          );
          return;
        }

        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        const address = place.formatted_address || "";

        const getComponent = (type: string, short = false) => {
          const c = place.address_components!.find((comp) =>
            comp.types.includes(type)
          );
          return short ? c?.short_name || "" : c?.long_name || "";
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
        setInputValue(address);

        onAddressSelect({ address, city, state, zipCode, latitude, longitude });
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error("Failed to initialize Google Places Autocomplete:", err);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsLoaded, locale, onAddressSelect]);

  return (
    <div className="relative">
      <div className="relative">
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            placeholder ||
            (locale === "es"
              ? "Ingresa tu dirección"
              : "Enter your address")
          }
          autoComplete="off"
          className={`
            w-full pl-10 pr-4 py-3
            border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            relative z-10
            ${isValidating ? "bg-gray-100" : ""}
            ${className}
          `}
          disabled={isValidating}
        />

        {/* Loading spinner */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {/* Validation message */}
      {validationMessage && (
        <div
          className={`mt-2 p-3 rounded-lg text-sm ${validationMessage.includes("sentimos") ||
              validationMessage.includes("Sorry")
              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
              : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          {validationMessage}
        </div>
      )}
    </div>
  );
}
