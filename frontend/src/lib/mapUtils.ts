/**
 * Map utility functions
 * Adapted from Uber clone's lib/map.ts
 */

import { Contractor } from "@/types/contractor";

/**
 * Calculate distance between two coordinates using Haversine formula
 * Same algorithm as Uber clone
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 3959; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate contractor distances from customer location
 * Adapted from Uber clone's calculateDriverTimes
 */
export const calculateContractorDistances = (
  contractors: Contractor[],
  customerLat: number,
  customerLng: number
): Contractor[] => {
  return contractors.map((contractor) => {
    const distance = calculateDistance(
      customerLat,
      customerLng,
      contractor.homeBase.latitude,
      contractor.homeBase.longitude
    );

    // Estimate arrival time (assume 30 mph average speed + 5 min prep)
    const estimatedArrival = Math.round((distance / 30) * 60 + 5);

    return {
      ...contractor,
      distance,
      estimatedArrival,
    };
  });
};

/**
 * Sort contractors by proximity and rating
 * Same logic as Uber clone's driver ranking
 */
export const rankContractors = (contractors: Contractor[]): Contractor[] => {
  return [...contractors].sort((a, b) => {
    // First, sort by distance (closer is better)
    const distanceDiff = (a.distance || 0) - (b.distance || 0);
    if (Math.abs(distanceDiff) > 5) {
      // More than 5 miles difference
      return distanceDiff;
    }

    // If similar distance, sort by rating
    return b.rating - a.rating;
  });
};

/**
 * Check if ZIP code is within service area
 * New function for your ZIP validation logic
 */
export const validateZipCode = async (zipCode: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/zones/validate?zipCode=${zipCode}`);
    const data = await response.json();
    return data.available || false;
  } catch (error) {
    console.error("ZIP validation error:", error);
    return false;
  }
};

/**
 * Calculate map bounds for all markers
 * Adapted from Uber clone's calculateRegion
 */
export const calculateMapBounds = (
  customerLocation: { latitude: number; longitude: number },
  contractors: Contractor[]
): {
  center: { lat: number; lng: number };
  zoom: number;
} => {
  if (contractors.length === 0) {
    return {
      center: {
        lat: customerLocation.latitude,
        lng: customerLocation.longitude,
      },
      zoom: 13,
    };
  }

  // Calculate center point
  const allLats = [
    customerLocation.latitude,
    ...contractors.map((c) => c.homeBase.latitude),
  ];
  const allLngs = [
    customerLocation.longitude,
    ...contractors.map((c) => c.homeBase.longitude),
  ];

  const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
  const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

  // Calculate appropriate zoom level based on distance spread
  const maxLat = Math.max(...allLats);
  const minLat = Math.min(...allLats);
  const maxLng = Math.max(...allLngs);
  const minLng = Math.min(...allLngs);

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 13;
  if (maxDiff > 0.5) zoom = 10;
  if (maxDiff > 1) zoom = 9;
  if (maxDiff > 2) zoom = 8;

  return {
    center: { lat: centerLat, lng: centerLng },
    zoom,
  };
};
