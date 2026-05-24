import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { getConfiguredAppUrl, getPaymentDefaultCurrency, getPaymentPlatformFeeBps, isPaymentTestModeEnabled, isStripeConfigured } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

type PurchaseBody = {
  productId?: number;
  testMode?: boolean;
};

export async function POST(request: Request) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for purchases." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to purchase items." }, { status: 401 });
  }

  let payload: PurchaseBody;
  try {
    payload = (await request.json()) as PurchaseBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const productId = Number(payload.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "A valid product is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, price, seller_profile_id, sold_at, moderation_status")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (product.seller_profile_id === profile.id) {
    return NextResponse.json({ error: "You cannot purchase your own listing." }, { status: 400 });
  }

  if (product.sold_at) {
    return NextResponse.json({ error: "This listing has already been sold." }, { status: 409 });
  }

  if (product.moderation_status === "denied" || product.moderation_status === "needs_info") {
    return NextResponse.json({ error: "This listing is not available for purchase." }, { status: 400 });
  }

  const currency = getPaymentDefaultCurrency();
  const platformFee = Math.round((product.price * getPaymentPlatformFeeBps()) / 10000);
  const shouldUseTestMode = payload.testMode === true || !isStripeConfigured() || isPaymentTestModeEnabled();
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .insert({
      product_id: product.id,
      buyer_profile_id: profile.id,
      seller_profile_id: product.seller_profile_id,
      provider: shouldUseTestMode ? "test" : "stripe",
      status: "pending_checkout",
      amount: product.price,
      currency,
      platform_fee: platformFee,
      metadata: { requested_test_mode: payload.testMode === true },
    })
    .select("id")
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Unable to create purchase order." }, { status: 500 });
  }

  const labelDueAtIso = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  if (shouldUseTestMode) {
    const soldAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update({
        sold_at: soldAt,
        sold_to_profile_id: profile.id,
        listing_time: "Sold",
        badge: "SOLD",
      })
      .eq("id", productId)
      .is("sold_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      await supabase
        .from("purchase_orders")
        .update({ status: "failed", failure_reason: updateError.message, updated_at: soldAt })
        .eq("id", order.id);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      await supabase
        .from("purchase_orders")
        .update({
          status: "failed",
          failure_reason: "Listing was sold while processing purchase.",
          updated_at: soldAt,
        })
        .eq("id", order.id);
      return NextResponse.json({ error: "This listing was just sold to someone else." }, { status: 409 });
    }

    await supabase
      .from("purchase_orders")
      .update({ status: "awaiting_label", label_due_at: labelDueAtIso, updated_at: soldAt })
      .eq("id", order.id);

    await supabase.from("notifications").insert({
      profile_id: product.seller_profile_id,
      type: "sale_created",
      purchase_order_id: order.id,
      product_id: product.id,
      message: `Your item "${product.title}" was purchased (test). Awaiting shipping label from buyer.`,
    });

    return NextResponse.json({ ok: true, mode: "test", productId: product.id, title: product.title, orderId: order.id });
  }

  const { data: sellerProfile, error: sellerError } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
    .eq("id", product.seller_profile_id)
    .maybeSingle();

  if (sellerError || !sellerProfile) {
    return NextResponse.json({ error: sellerError?.message ?? "Seller payout profile not found." }, { status: 500 });
  }

  if (!sellerProfile.stripe_account_id || !sellerProfile.stripe_charges_enabled || !sellerProfile.stripe_payouts_enabled) {
    return NextResponse.json(
      {
        error:
          "Seller is not fully onboarded for payouts yet. Ask the seller to complete payment onboarding before purchasing.",
      },
      { status: 409 },
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getConfiguredAppUrl() ?? new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/product/${product.id}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/product/${product.id}?purchase=cancelled`,
    client_reference_id: order.id,
    metadata: {
      order_id: order.id,
      product_id: String(product.id),
      buyer_profile_id: String(profile.id),
      seller_profile_id: String(product.seller_profile_id),
    },
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerProfile.stripe_account_id,
      },
      metadata: {
        order_id: order.id,
        product_id: String(product.id),
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: product.price,
          product_data: {
            name: product.title,
            description: `Listing #${product.id} on BARTER`,
          },
        },
      },
    ],
  });

  const { error: sessionUpdateError } = await supabase
    .from("purchase_orders")
    .update({
      checkout_session_id: session.id,
      label_due_at: labelDueAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (sessionUpdateError) {
    return NextResponse.json({ error: sessionUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "stripe",
    checkoutUrl: session.url,
    productId: product.id,
    title: product.title,
  });
}
