import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

type TradeAccessRow = {
  id: number;
  status: string;
  initiator_profile_id: string;
  recipient_profile_id: string;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

// Each party independently checks off "I have the item and it's good." When both
// have confirmed, the trade completes: items change hands and counts increment.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for meetups." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const tradeId = Number((await params).id);
  if (!Number.isInteger(tradeId) || tradeId <= 0) {
    return NextResponse.json({ error: "Invalid trade id." }, { status: 400 });
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
    .select("status")
    .eq("trade_id", tradeId)
    .maybeSingle();
  const meetup = meetupData as { status: string } | null;

  if (trade.status !== "scheduled" || !meetup || meetup.status !== "agreed") {
    return NextResponse.json(
      { error: "You can confirm the exchange once the meetup is scheduled." },
      { status: 400 },
    );
  }

  const isInitiator = trade.initiator_profile_id === profile.id;
  const column = isInitiator ? "initiator_confirmed_at" : "recipient_confirmed_at";
  const nowIso = new Date().toISOString();

  // Record this party's confirmation once (idempotent — never overwrites an earlier time).
  const { error: confirmError } = await supabase
    .from("trade_meetups")
    .update({ [column]: nowIso, updated_at: nowIso })
    .eq("trade_id", tradeId)
    .is(column, null);

  if (confirmError) {
    return NextResponse.json({ error: confirmError.message }, { status: 500 });
  }

  const { data: freshData } = await supabase
    .from("trade_meetups")
    .select("initiator_confirmed_at, recipient_confirmed_at")
    .eq("trade_id", tradeId)
    .maybeSingle();
  const fresh = freshData as
    | { initiator_confirmed_at: string | null; recipient_confirmed_at: string | null }
    | null;

  const bothConfirmed = Boolean(fresh?.initiator_confirmed_at) && Boolean(fresh?.recipient_confirmed_at);
  if (!bothConfirmed) {
    return NextResponse.json({ ok: true, completed: false });
  }

  // Flip scheduled -> completed atomically; only the winning request runs side-effects.
  const { data: completedTrade } = await supabase
    .from("trades")
    .update({ status: "completed", completed_at: nowIso, updated_at: nowIso })
    .eq("id", tradeId)
    .eq("status", "scheduled")
    .select("id")
    .maybeSingle();

  if (completedTrade) {
    await completeTrade(supabase, trade, nowIso);
  }

  return NextResponse.json({ ok: true, completed: true });
}

async function completeTrade(supabase: SupabaseAdmin, trade: TradeAccessRow, nowIso: string) {
  await supabase
    .from("trade_meetups")
    .update({ status: "completed", updated_at: nowIso })
    .eq("trade_id", trade.id);

  // Bump both members' completed-trade counts.
  const { data: counts } = await supabase
    .from("profiles")
    .select("id, completed_trades")
    .in("id", [trade.initiator_profile_id, trade.recipient_profile_id]);

  for (const row of (counts ?? []) as Array<{ id: string; completed_trades: number | null }>) {
    await supabase
      .from("profiles")
      .update({ completed_trades: (row.completed_trades ?? 0) + 1, updated_at: nowIso })
      .eq("id", row.id);
  }

  // The traded items change hands and leave the marketplace.
  const { data: items } = await supabase
    .from("trade_items")
    .select("product_id, side")
    .eq("trade_id", trade.id);

  for (const item of (items ?? []) as Array<{ product_id: number; side: string }>) {
    const soldTo =
      item.side === "initiator" ? trade.recipient_profile_id : trade.initiator_profile_id;
    await supabase
      .from("products")
      .update({
        sold_at: nowIso,
        sold_to_profile_id: soldTo,
        listing_time: "Traded",
        badge: "TRADED",
        updated_at: nowIso,
      })
      .eq("id", item.product_id)
      .is("sold_at", null);
  }

  await supabase.from("notifications").insert([
    {
      profile_id: trade.initiator_profile_id,
      type: "trade_completed",
      trade_id: trade.id,
      message: "Your trade is complete — both members confirmed the exchange.",
    },
    {
      profile_id: trade.recipient_profile_id,
      type: "trade_completed",
      trade_id: trade.id,
      message: "Your trade is complete — both members confirmed the exchange.",
    },
  ]);
}
