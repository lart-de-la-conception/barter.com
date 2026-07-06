import { isMapboxConfigured, mapboxProvider } from "@/lib/geo/mapbox";
import type { Coordinates, PlaceSuggestion } from "@/lib/geo/types";

export { isMapboxConfigured };
export type { Coordinates, GeocodeResult, GeoProvider, PlaceSource, PlaceSuggestion } from "@/lib/geo/types";

// Active provider. Swap this single binding to change geo backends.
export const geoProvider = mapboxProvider;

const EARTH_RADIUS_KM = 6371;
// Public, camera-covered, foot-traffic-heavy spots make the best neutral exchange points.
const SUGGESTION_CATEGORIES = ["coffee", "shopping_mall", "library", "restaurant"];

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Great-circle midpoint between two members — a fair, neutral center point.
export function computeMidpoint(a: Coordinates, b: Coordinates): Coordinates {
  const lat1 = toRadians(a.latitude);
  const lon1 = toRadians(a.longitude);
  const lat2 = toRadians(b.latitude);
  const lon2 = toRadians(b.longitude);
  const bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const by = Math.cos(lat2) * Math.sin(lon2 - lon1);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx);
  return {
    latitude: (lat3 * 180) / Math.PI,
    longitude: (((lon3 * 180) / Math.PI + 540) % 360) - 180,
  };
}

// Snap to ~1km grid for privacy: enough to compute a fair midpoint, never the
// member's exact home address.
export function fuzzCoordinates(coords: Coordinates, decimals = 2): Coordinates {
  const factor = 10 ** decimals;
  return {
    latitude: Math.round(coords.latitude * factor) / factor,
    longitude: Math.round(coords.longitude * factor) / factor,
  };
}

export type SafeZoneInput = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kind?: string | null;
};

export type MeetupSuggestions = {
  midpoint: Coordinates;
  suggestions: PlaceSuggestion[];
};

// Ranked neutral meetup spots near the midpoint: nearest curated safe zones plus
// Mapbox-suggested public venues, ordered by distance from the midpoint.
export async function suggestMeetupSpots(
  a: Coordinates,
  b: Coordinates,
  safeZones: SafeZoneInput[],
  limit = 8,
): Promise<MeetupSuggestions> {
  const midpoint = computeMidpoint(a, b);

  const safeSuggestions: PlaceSuggestion[] = safeZones
    .map((zone) => ({
      id: `safe-${zone.id}`,
      name: zone.name,
      address: zone.address,
      latitude: zone.latitude,
      longitude: zone.longitude,
      source: "curated_safe_zone" as const,
      category: zone.kind ?? undefined,
      isSafeZone: true,
      distanceFromMidpointKm: haversineKm(midpoint, zone),
    }))
    .sort((x, y) => (x.distanceFromMidpointKm ?? 0) - (y.distanceFromMidpointKm ?? 0))
    .slice(0, 3);

  let autoSuggestions: PlaceSuggestion[] = [];
  if (isMapboxConfigured()) {
    try {
      const places = await geoProvider.nearbyPlaces(midpoint, SUGGESTION_CATEGORIES);
      autoSuggestions = places.map((place) => ({
        ...place,
        distanceFromMidpointKm: haversineKm(midpoint, place),
      }));
    } catch {
      autoSuggestions = [];
    }
  }

  const suggestions = [...safeSuggestions, ...autoSuggestions]
    .sort((x, y) => (x.distanceFromMidpointKm ?? 0) - (y.distanceFromMidpointKm ?? 0))
    .slice(0, limit);

  return { midpoint, suggestions };
}
