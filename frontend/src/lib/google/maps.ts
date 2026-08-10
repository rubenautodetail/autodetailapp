export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface DistanceMatrixResult {
  origin: string;
  destination: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
}

export function getGoogleMapsApiKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const first = data.results[0];
      return {
        lat: first.geometry.location.lat,
        lng: first.geometry.location.lng,
        formattedAddress: first.formatted_address,
      };
    }
  } catch (err) {
    console.error("Google Maps Geocoding Error:", err);
  }

  return null;
}

export async function calculateDistance(
  origin: string,
  destination: string
): Promise<DistanceMatrixResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      return {
        origin: data.origin_addresses[0],
        destination: data.destination_addresses[0],
        distanceText: element.distance.text,
        distanceMeters: element.distance.value,
        durationText: element.duration.text,
        durationSeconds: element.duration.value,
      };
    }
  } catch (err) {
    console.error("Google Maps Distance Matrix Error:", err);
  }

  return null;
}
