import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

const PLACE_SOURCES = new Set(["auto_suggested", "curated_safe_zone", "manual"]);

type TradeAccessRow = {
  id: number;
  status: string;
  initiator_profile_id: string;
  recipient_profile_id: string;
};

type ProposeBody = {
  placeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeSource?: string;
  mapboxPlaceId?: string;
  scheduledFor?: string;
};

type RespondBody = {
  action?: "agree" | "cancel";
};

function parseTradeId(value: string): number | null {
  const tradeId = Number(value);
  return Number.isInteger(tradeId) && tradeId > 0 ? tradeId : null;
}

// Propose (or counter-propose) the meetup location and time.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for meetups." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to arrange a meetup." }, { status: 401 });
  }

  const tradeId = parseTradeId((await params).id);
  if (tradeId === null) {
    return NextResponse.json({ error: "Invalid trade id." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as ProposeBody | null;
  const placeName = String(payload?.placeName ?? "").trim();
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);
  const placeSource = String(payload?.placeSource ?? "");
  const address = payload?.address ? String(payload.address).trim() : null;
  const mapboxPlaceId = payload?.mapboxPlaceId ? String(payload.mapboxPlaceId) : null;
  const scheduledFor = payload?.scheduledFor ? new Date(payload.scheduledFor) : null;

  if (!placeName) {
    return NextResponse.json({ error: "A meetup place is required." }, { status: 400 });
  }
  if (!PLACE_SOURCES.has(placeSource)) {
    return NextResponse.json({ error: "Invalid place source." }, { status: 400 });
  }
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
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json({ error: "Invalid meetup time." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error: tradeError } = await supabase
    .from("trades")
    .select("id, status, initiator_profile_id, recipient_profile_id")
    .eq("id", tradeId)
    .maybeSingle();

  if (tradeError) {
    return NextResponse.json({ error: tradeError.message }, { status: 500 });
  }
  const trade = data as TradeAccessRow | null;
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }
  if (trade.initiator_profile_id !== profile.id && trade.recipient_profile_id !== profile.id) {
    return NextResponse.json({ error: "You are not part of this trade." }, { status: 403 });
  }
  if (trade.status !== "accepted" && trade.status !== "scheduled") {
    return NextResponse.json(
      { error: "A meetup can only be arranged once the trade is accepted." },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();
  const { error: upsertError } = await supabase.from("trade_meetups").upsert(
    {
      trade_id: tradeId,
      status: "proposed",
      place_name: placeName,
      address,
      latitude,
      longitude,
      place_source: placeSource,
      mapbox_place_id: mapboxPlaceId,
      scheduled_for: scheduledFor ? scheduledFor.toISOString() : null,
      proposed_by_profile_id: profile.id,
      // A new proposal restarts the at-meetup check-off.
      initiator_confirmed_at: null,
      recipient_confirmed_at: null,
      updated_at: nowIso,
    },
    { onConflict: "trade_id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // If they were already scheduled, a fresh proposal re-opens arrangement.
  if (trade.status === "scheduled") {
    await supabase.from("trades").update({ status: "accepted", updated_at: nowIso }).eq("id", tradeId);
  }

  const otherProfileId =
    trade.initiator_profile_id === profile.id
      ? trade.recipient_profile_id
      : trade.initiator_profile_id;

  await supabase.from("notifications").insert({
    profile_id: otherProfileId,
    type: "trade_meetup_proposed",
    trade_id: tradeId,
    message: `${profile.name} proposed meeting at ${placeName}.`,
  });

  return NextResponse.json({ ok: true });
}

// Respond to a proposed meetup: agree (lock it in) or cancel (re-open arrangement).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for meetups." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const tradeId = parseTradeId((await params).id);
  if (tradeId === null) {
    return NextResponse.json({ error: "Invalid trade id." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as RespondBody | null;
  const action = payload?.action;
  if (action !== "agree" && action !== "cancel") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: tradeData, error: tradeError } = await supabase
    .from("trades")
    .select("id, status, initiator_profile_id, recipient_profile_id")
    .eq("id", tradeId)
    .maybeSingle();

  if (tradeError) {
    return NextResponse.json({ error: tradeError.message }, { status: 500 });
  }
  const trade = tradeData as TradeAccessRow | null;
  if (!trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }
  if (trade.initiator_profile_id !== profile.id && trade.recipient_profile_id !== profile.id) {
    return NextResponse.json({ error: "You are not part of this trade." }, { status: 403 });
  }

  const { data: meetupData } = await supabase
    .from("trade_meetups")
    .select("status, place_name, proposed_by_profile_id")
    .eq("trade_id", tradeId)
    .maybeSingle();
  const meetup = meetupData as
    | { status: string; place_name: string; proposed_by_profile_id: string }
    | null;

  if (!meetup) {
    return NextResponse.json({ error: "There is no meetup to respond to." }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const otherProfileId =
    trade.initiator_profile_id === profile.id
      ? trade.recipient_profile_id
      : trade.initiator_profile_id;

  if (action === "agree") {
    if (meetup.status !== "proposed") {
      return NextResponse.json({ error: "This meetup is not awaiting agreement." }, { status: 400 });
    }
    if (meetup.proposed_by_profile_id === profile.id) {
      return NextResponse.json(
        { error: "Waiting for the other member to agree to your proposal." },
        { status: 400 },
      );
    }

    await supabase
      .from("trade_meetups")
      .update({ status: "agreed", updated_at: nowIso })
      .eq("trade_id", tradeId);
    await supabase.from("trades").update({ status: "scheduled", updated_at: nowIso }).eq("id", tradeId);
    await supabase.from("notifications").insert({
      profile_id: otherProfileId,
      type: "trade_meetup_agreed",
      trade_id: tradeId,
      message: `${profile.name} agreed to meet at ${meetup.place_name}.`,
    });

    return NextResponse.json({ ok: true, status: "scheduled" });
  }

  // cancel — only valid while the trade is still being arranged. Without this
  // guard, canceling a meetup on an already-completed trade would regress it to
  // "accepted" while the swapped items stay marked sold and completed_trades
  // stays incremented.
  if (trade.status !== "accepted" && trade.status !== "scheduled") {
    return NextResponse.json(
      { error: "This trade's meetup can no longer be canceled." },
      { status: 400 },
    );
  }
  if (meetup.status === "completed") {
    return NextResponse.json({ error: "This meetup has already been completed." }, { status: 400 });
  }

  await supabase
    .from("trade_meetups")
    .update({
      status: "canceled",
      initiator_confirmed_at: null,
      recipient_confirmed_at: null,
      updated_at: nowIso,
    })
    .eq("trade_id", tradeId);
  await supabase.from("trades").update({ status: "accepted", updated_at: nowIso }).eq("id", tradeId);
  await supabase.from("notifications").insert({
    profile_id: otherProfileId,
    type: "trade_meetup_proposed",
    trade_id: tradeId,
    message: `${profile.name} canceled the meetup plan. Suggest a new spot to continue.`,
  });

  return NextResponse.json({ ok: true, status: "accepted" });
}
