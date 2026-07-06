// Builds a Mapbox Static Images API URL for a meetup-spot preview. Uses the
// public (URL-restricted) token so it is safe to call from client components.
// Returns null when no public token is configured (callers should hide the map).

type StaticMapOptions = {
  zoom?: number;
  width?: number;
  height?: number;
  retina?: boolean;
};

export function buildStaticMapUrl(
  latitude: number,
  longitude: number,
  options: StaticMapOptions = {},
): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) return null;

  const zoom = options.zoom ?? 14;
  const width = options.width ?? 640;
  const height = options.height ?? 280;
  const retina = options.retina ? "@2x" : "";
  const marker = `pin-l+ff4d2e(${longitude},${latitude})`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/` +
    `${longitude},${latitude},${zoom}/${width}x${height}${retina}?access_token=${token}`
  );
}
