"use client";

import { useEffect, useRef, useState } from "react";
import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";

/**
 * Google Address Input Component
 * Adapted from Uber clone's GoogleTextInput.tsx
 * Provides address autocomplete with ZIP code extraction
 */

interface GoogleAddressInputProps {
  onAddressSelect: (data: {
    address: string;
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

const libraries: ("places")[] = ["places"];

export default function GoogleAddressInput({
  onAddressSelect,
  placeholder,
  initialValue = "",
  locale = "en",
  className = "",
  onZipValidation,
}: GoogleAddressInputProps) {
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: locale,
  });

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  // Extract ZIP code from address components (like Uber clone extracts location data)
  const extractZipCode = (
    addressComponents: google.maps.GeocoderAddressComponent[]
  ): string => {
    const zipComponent = addressComponents.find((component) =>
      component.types.includes("postal_code")
    );
    return zipComponent?.long_name || "";
  };

  // Handle place selection
  const onPlacesChanged = async () => {
    const places = searchBoxRef.current?.getPlaces();

    if (!places || places.length === 0) {
      return;
    }

    const place = places[0];

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
    const zipCode = extractZipCode(place.address_components);

    if (!zipCode) {
      setValidationMessage(
        locale === "es"
          ? "No se pudo determinar el código postal."
          : "Could not determine ZIP code."
      );
      return;
    }

    // Validate ZIP if validation function provided
    if (onZipValidation) {
      setIsValidating(true);
      setValidationMessage("");

      try {
        const isValid = await onZipValidation(zipCode);

        if (!isValid) {
          setValidationMessage(
            locale === "es"
              ? `Lo sentimos, aún no ofrecemos servicio en ${zipCode}. ¡Únete a la lista de espera!`
              : `Sorry, we don't service ${zipCode} yet. Join the waitlist!`
          );
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error("ZIP validation error:", error);
        setValidationMessage(
          locale === "es"
            ? "Error al validar código postal"
            : "Error validating ZIP code"
        );
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
    }

    // Clear validation message on success
    setValidationMessage("");

    // Update input value
    setInputValue(address);

    // Call parent callback (same pattern as Uber clone's handlePress)
    onAddressSelect({
      address,
      zipCode,
      latitude,
      longitude,
    });
  };

  if (loadError) {
    return (
      <div className="text-red-500">
        {locale === "es"
          ? "Error al cargar Google Maps"
          : "Error loading Google Maps"}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <StandaloneSearchBox
        onLoad={(ref) => (searchBoxRef.current = ref)}
        onPlacesChanged={onPlacesChanged}
      >
        <div className="relative">
          {/* Search icon (like Uber clone's icon) */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            className={`
              w-full pl-10 pr-4 py-3
              border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isValidating ? "bg-gray-100" : ""}
              ${className}
            `}
            disabled={isValidating}
          />

          {/* Loading spinner */}
          {isValidating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
      </StandaloneSearchBox>

      {/* Validation message */}
      {validationMessage && (
        <div
          className={`mt-2 p-3 rounded-lg text-sm ${
            validationMessage.includes("sentimos") ||
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
