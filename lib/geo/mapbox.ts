import type { Coordinates, GeocodeResult, GeoProvider, PlaceSuggestion } from "@/lib/geo/types";

const GEOCODE_BASE = "https://api.mapbox.com/search/geocode/v6";
const SEARCHBOX_CATEGORY_BASE = "https://api.mapbox.com/search/searchbox/v1/category";

function getMapboxToken(): string | undefined {
  return (
    process.env.MAPBOX_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    undefined
  );
}

export function isMapboxConfigured(): boolean {
  return Boolean(getMapboxToken());
}

function requireToken(): string {
  const token = getMapboxToken();
  if (!token) {
    throw new Error("Mapbox is not configured. Set MAPBOX_TOKEN to enable location features.");
  }
  return token;
}

type GeoFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    place_formatted?: string;
    full_address?: string;
    address?: string;
    poi_category?: string[];
  };
};

function shortLabelFrom(props: GeoFeature["properties"]): string {
  if (!props) return "";
  return props.place_formatted || props.name_preferred || props.name || "";
}

async function fetchFeatures(url: string): Promise<GeoFeature[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json().catch(() => null)) as { features?: GeoFeature[] } | null;
  return data?.features ?? [];
}

async function geocode(
  query: string,
  options?: { proximity?: Coordinates },
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const token = requireToken();
  const proximity = options?.proximity
    ? `&proximity=${options.proximity.longitude},${options.proximity.latitude}`
    : "";
  const url = `${GEOCODE_BASE}/forward?q=${encodeURIComponent(trimmed)}&limit=5${proximity}&access_token=${token}`;
  const features = await fetchFeatures(url);
  return features
    .map((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) return null;
      const [longitude, latitude] = coords;
      const props = feature.properties ?? {};
      const short = shortLabelFrom(props);
      return {
        id: props.mapbox_id ?? `${latitude},${longitude}`,
        label: props.full_address || short,
        shortLabel: short,
        latitude,
        longitude,
      } satisfies GeocodeResult;
    })
    .filter((value): value is GeocodeResult => value !== null);
}

async function reverseGeocode(coords: Coordinates): Promise<string> {
  const token = requireToken();
  const url =
    `${GEOCODE_BASE}/reverse?longitude=${coords.longitude}&latitude=${coords.latitude}` +
    `&types=neighborhood,locality,place&limit=1&access_token=${token}`;
  const features = await fetchFeatures(url);
  return shortLabelFrom(features[0]?.properties);
}

async function nearbyPlaces(center: Coordinates, categories: string[]): Promise<PlaceSuggestion[]> {
  const token = requireToken();
  const proximity = `${center.longitude},${center.latitude}`;
  const requests = categories.map(async (category) => {
    const url =
      `${SEARCHBOX_CATEGORY_BASE}/${encodeURIComponent(category)}` +
      `?proximity=${proximity}&limit=6&access_token=${token}`;
    const features = await fetchFeatures(url);
    return features
      .map((feature): PlaceSuggestion | null => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [longitude, latitude] = coords;
        const props = feature.properties ?? {};
        return {
          id: props.mapbox_id ?? `${latitude},${longitude}`,
          name: props.name ?? "Suggested spot",
          address: props.full_address || props.address || undefined,
          latitude,
          longitude,
          source: "auto_suggested",
          category,
          isSafeZone: false,
        };
      })
      .filter((value): value is PlaceSuggestion => value !== null);
  });

  const settled = await Promise.all(requests);
  const byId = new Map<string, PlaceSuggestion>();
  for (const place of settled.flat()) {
    if (!byId.has(place.id)) byId.set(place.id, place);
  }
  return Array.from(byId.values());
}

export const mapboxProvider: GeoProvider = { geocode, reverseGeocode, nearbyPlaces };
