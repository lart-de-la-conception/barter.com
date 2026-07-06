// Geo abstraction for the local-trade meetup flow. The concrete provider
// (Mapbox today) is wrapped behind GeoProvider so it can be swapped later.

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodeResult = {
  id: string;
  label: string; // full address, e.g. "Brooklyn, New York, United States"
  shortLabel: string; // neighborhood/city label, e.g. "Brooklyn, New York"
  latitude: number;
  longitude: number;
};

export type PlaceSource = "auto_suggested" | "curated_safe_zone" | "manual";

export type PlaceSuggestion = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  source: PlaceSource;
  category?: string;
  isSafeZone: boolean;
  distanceFromMidpointKm?: number;
};

export interface GeoProvider {
  geocode(query: string, options?: { proximity?: Coordinates }): Promise<GeocodeResult[]>;
  reverseGeocode(coords: Coordinates): Promise<string>;
  nearbyPlaces(center: Coordinates, categories: string[]): Promise<PlaceSuggestion[]>;
}
