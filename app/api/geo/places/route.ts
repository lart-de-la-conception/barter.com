import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { geoProvider, isMapboxConfigured } from "@/lib/geo";

// Server-side proxy for Mapbox forward geocoding so the token stays off the client.
// Used by the settings location search and the meetup manual-spot search.
export async function GET(request: Request) {
  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!isMapboxConfigured()) {
    return NextResponse.json(
      { error: "Location search is unavailable right now." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!query) {
    return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  }

  const proximity =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : undefined;

  try {
    const results = await geoProvider.geocode(query, { proximity });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed." },
      { status: 502 },
    );
  }
}
