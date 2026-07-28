"use server";

import { KITCHEN_ORIGIN_ADDRESS } from "./constants";

export interface DistanceResult {
  distanceKm: number | null;
  durationMinutes: number | null;
  error?: string;
}

/** Distance/duration from the fixed Townsville kitchen origin to a venue's lat/lng. */
export async function getDistanceFromKitchen(
  destinationLat: number,
  destinationLng: number,
): Promise<DistanceResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { distanceKm: null, durationMinutes: null, error: "Google Maps API key not configured." };
  }

  const params = new URLSearchParams({
    origins: KITCHEN_ORIGIN_ADDRESS,
    destinations: `${destinationLat},${destinationLng}`,
    units: "metric",
    key: apiKey,
  });

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`);
    const data = await res.json();
    const element = data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return { distanceKm: null, durationMinutes: null, error: "Could not calculate distance for this address." };
    }

    return {
      distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
      durationMinutes: Math.round(element.duration.value / 60),
    };
  } catch {
    return { distanceKm: null, durationMinutes: null, error: "Distance lookup failed." };
  }
}
