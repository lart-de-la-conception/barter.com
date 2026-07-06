import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await ensureProfileForAuthenticatedUser();

  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to manage trades." }, { status: 401 });
  }

  const { id } = await params;
  const tradeId = Number(id);
  const payload = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (!Number.isInteger(tradeId) || tradeId <= 0) {
    return NextResponse.json({ error: "Invalid trade id." }, { status: 400 });
  }

  if (status !== "accepted" && status !== "declined") {
    return NextResponse.json({ error: "Invalid trade status." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .select("id, status, initiator_profile_id, recipient_profile_id")
    .eq("id", tradeId)
    .single();

  if (tradeError || !trade) {
    return NextResponse.json({ error: "Trade not found." }, { status: 404 });
  }

  if (trade.recipient_profile_id !== profile.id) {
    return NextResponse.json({ error: "Only the recipient can review this trade." }, { status: 403 });
  }

  if (trade.status !== "pending") {
    return NextResponse.json({ error: "Only pending trades can be updated." }, { status: 400 });
  }

  const { error: updateError } = await supabase.from("trades").update({ status }).eq("id", tradeId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Let the initiator know their offer was accepted so they can arrange the meetup.
  if (status === "accepted" && hasSupabaseServiceRoleKey()) {
    const admin = createSupabaseAdminClient();
    await admin.from("notifications").insert({
      profile_id: trade.initiator_profile_id,
      type: "trade_accepted",
      trade_id: tradeId,
      message: `${profile.name} accepted your trade offer. Arrange a meetup to complete it.`,
    });
  }

  return NextResponse.json({ ok: true });
}
