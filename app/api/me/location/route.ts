import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { fuzzCoordinates, geoProvider, isMapboxConfigured } from "@/lib/geo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LocationBody = {
  latitude?: number;
  longitude?: number;
  label?: string;
};

export async function PUT(request: Request) {
  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to update your location." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as LocationBody | null;
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: "Valid coordinates are required." }, { status: 400 });
  }

  // Derive a coarse label if the client didn't supply one.
  let label = String(payload?.label ?? "").trim();
  if (!label && isMapboxConfigured()) {
    try {
      label = await geoProvider.reverseGeocode({ latitude, longitude });
    } catch {
      label = "";
    }
  }

  const fuzzed = fuzzCoordinates({ latitude, longitude });
  const locationLabel = label || "Saved location";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      // Only the private meetup fields are updated here. `location` is the
      // user's public, deliberately-coarse profile location ("Members Only" by
      // default) and must NOT be overwritten with their reverse-geocoded
      // neighborhood — the settings UI promises this is never made public.
      latitude: fuzzed.latitude,
      longitude: fuzzed.longitude,
      location_label: locationLabel,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    location: { latitude: fuzzed.latitude, longitude: fuzzed.longitude, label: locationLabel },
  });
}
