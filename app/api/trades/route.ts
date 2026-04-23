import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await ensureProfileForAuthenticatedUser();

  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to send offers." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        productId?: number;
        yourItemIds?: number[];
        cashOffer?: number;
        message?: string;
      }
    | null;

  const productId = Number(payload?.productId);
  const yourItemIds = Array.isArray(payload?.yourItemIds)
    ? payload.yourItemIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];
  const cashOffer = Math.max(0, Number(payload?.cashOffer) || 0);
  const message = String(payload?.message ?? "").trim() || "Trade offer sent.";

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "A valid product is required." }, { status: 400 });
  }

  if (!yourItemIds.length && cashOffer <= 0) {
    return NextResponse.json({ error: "Select at least one item or add cash to send an offer." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: targetProduct, error: targetError } = await supabase
    .from("products")
    .select("id, seller_profile_id")
    .eq("id", productId)
    .single();

  if (targetError || !targetProduct) {
    return NextResponse.json({ error: "The requested product could not be found." }, { status: 404 });
  }

  if (targetProduct.seller_profile_id === profile.id) {
    return NextResponse.json({ error: "You cannot send a trade offer for your own listing." }, { status: 400 });
  }

  const { data: initiatorItems, error: itemError } = yourItemIds.length
    ? await supabase.from("products").select("id").eq("seller_profile_id", profile.id).in("id", yourItemIds)
    : { data: [], error: null };

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 400 });
  }

  if ((initiatorItems ?? []).length !== yourItemIds.length) {
    return NextResponse.json({ error: "One or more selected items do not belong to your closet." }, { status: 400 });
  }

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .insert({
      initiator_profile_id: profile.id,
      recipient_profile_id: targetProduct.seller_profile_id,
      status: "pending",
      message,
      display_timestamp: "Just now",
      initiator_cash: cashOffer > 0 ? cashOffer : null,
      recipient_cash: null,
    })
    .select("id")
    .single();

  if (tradeError || !trade) {
    return NextResponse.json({ error: tradeError?.message ?? "Unable to create trade." }, { status: 500 });
  }

  const { error: tradeItemsError } = await supabase.from("trade_items").insert([
    ...yourItemIds.map((itemId) => ({
      trade_id: trade.id,
      product_id: itemId,
      side: "initiator" as const,
    })),
    {
      trade_id: trade.id,
      product_id: productId,
      side: "recipient" as const,
    },
  ]);

  if (tradeItemsError) {
    await supabase.from("trades").delete().eq("id", trade.id);
    return NextResponse.json({ error: tradeItemsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tradeId: trade.id });
}
