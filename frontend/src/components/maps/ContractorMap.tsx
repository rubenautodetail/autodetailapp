"use client";

import { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Contractor } from "@/types/contractor";

/**
 * Contractor Map Component
 * Adapted from Uber clone's Map.tsx
 * Shows customer location and available contractors on map
 */

interface ContractorMapProps {
  customerLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  contractors: Contractor[];
  selectedContractor: Contractor | null;
  onContractorSelect?: (contractor: Contractor) => void;
  locale?: "en" | "es";
  className?: string;
}

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 25.7617,
  lng: -80.1918, // Miami default
};

export default function ContractorMap({
  customerLocation,
  contractors,
  selectedContractor,
  onContractorSelect,
  locale = "en",
  className = "",
}: ContractorMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  // Load Google Maps API (same as Uber clone)
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: locale,
  });

  // Update map center when customer location changes
  useEffect(() => {
    if (customerLocation) {
      setCenter({
        lat: customerLocation.latitude,
        lng: customerLocation.longitude,
      });

      // Calculate bounds to show all contractors (like Uber clone's calculateRegion)
      if (contractors.length > 0 && map) {
        const bounds = new google.maps.LatLngBounds();

        // Add customer location
        bounds.extend(
          new google.maps.LatLng(
            customerLocation.latitude,
            customerLocation.longitude
          )
        );

        // Add all contractor locations
        contractors.forEach((contractor) => {
          bounds.extend(
            new google.maps.LatLng(
              contractor.homeBase.latitude,
              contractor.homeBase.longitude
            )
          );
        });

        map.fitBounds(bounds);
      }
    }
  }, [customerLocation, contractors, map]);

  // Calculate directions when contractor is selected (like Uber clone's MapViewDirections)
  useEffect(() => {
    if (
      selectedContractor &&
      customerLocation &&
      window.google?.maps?.DirectionsService
    ) {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: {
            lat: selectedContractor.homeBase.latitude,
            lng: selectedContractor.homeBase.longitude,
          },
          destination: {
            lat: customerLocation.latitude,
            lng: customerLocation.longitude,
          },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.error("Directions request failed:", status);
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [selectedContractor, customerLocation]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-red-500">
          {locale === "es"
            ? "Error al cargar el mapa"
            : "Error loading map"}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={(map) => setMap(map)}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {/* Customer location marker (like Uber clone's destination marker) */}
        {customerLocation && (
          <Marker
            position={{
              lat: customerLocation.latitude,
              lng: customerLocation.longitude,
            }}
            title={customerLocation.address}
            icon={{
              url: "/icons/customer-pin.svg",
              scaledSize: new google.maps.Size(40, 40),
            }}
            label={{
              text: locale === "es" ? "Tu ubicación" : "Your location",
              className: "bg-white px-2 py-1 rounded shadow text-sm font-medium",
            }}
          />
        )}

        {/* Contractor markers (like Uber clone's driver markers) */}
        {contractors.map((contractor) => {
          const isSelected = selectedContractor?.id === contractor.id;

          return (
            <Marker
              key={contractor.id}
              position={{
                lat: contractor.homeBase.latitude,
                lng: contractor.homeBase.longitude,
              }}
              title={`${contractor.name} - ⭐${contractor.rating}`}
              icon={{
                url: isSelected
                  ? "/icons/contractor-selected.svg"
                  : "/icons/contractor-available.svg",
                scaledSize: new google.maps.Size(
                  isSelected ? 48 : 40,
                  isSelected ? 48 : 40
                ),
              }}
              onClick={() => {
                if (onContractorSelect) {
                  onContractorSelect(contractor);
                }
              }}
              animation={
                isSelected ? google.maps.Animation.BOUNCE : undefined
              }
            />
          );
        })}

        {/* Directions path (like Uber clone's MapViewDirections) */}
        {directions && selectedContractor && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#0286FF",
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
              suppressMarkers: true, // We're using custom markers
            }}
          />
        )}
      </GoogleMap>

      {/* Map legend */}
      {contractors.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2">
            {locale === "es" ? "Contratistas disponibles" : "Available contractors"}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{contractors.length} {locale === "es" ? "disponibles" : "available"}</span>
          </div>
          {selectedContractor && directions && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-gray-600">
                {locale === "es" ? "Distancia:" : "Distance:"}{" "}
                {((directions.routes[0]?.legs?.[0]?.distance?.value || 0) / 1609.34).toFixed(1)} mi
              </p>
              <p className="text-xs text-gray-600">
                {locale === "es" ? "Tiempo:" : "Time:"}{" "}
                {directions.routes[0]?.legs?.[0]?.duration?.text || ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
