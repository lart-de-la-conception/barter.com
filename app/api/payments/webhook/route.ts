import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeWebhookSecret, hasStripeWebhookSecret, isStripeConfigured } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

async function markOrderPaidByCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.client_reference_id ?? session.metadata?.order_id;
  if (!orderId) return;

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data: updatedOrder, error: orderError } = await supabase
    .from("purchase_orders")
    .update({
      status: "awaiting_label",
      checkout_session_id: session.id,
      payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      label_due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      updated_at: nowIso,
    })
    .eq("id", orderId)
    .select("id, product_id, buyer_profile_id, seller_profile_id")
    .maybeSingle();

  if (orderError || !updatedOrder) return;

  await supabase
    .from("products")
    .update({
      sold_at: nowIso,
      sold_to_profile_id: updatedOrder.buyer_profile_id,
      listing_time: "Sold",
      badge: "SOLD",
    })
    .eq("id", updatedOrder.product_id)
    .is("sold_at", null);

  await supabase.from("notifications").insert({
    profile_id: updatedOrder.seller_profile_id,
    type: "sale_created",
    purchase_order_id: updatedOrder.id,
    product_id: updatedOrder.product_id,
    message: "Your item was purchased. Awaiting shipping label from buyer (12h window).",
  });
}

async function markOrderCanceledByCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.client_reference_id ?? session.metadata?.order_id;
  if (!orderId) return;
  await createSupabaseAdminClient()
    .from("purchase_orders")
    .update({
      status: "canceled",
      checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

async function markOrderFailedByPaymentIntent(intent: Stripe.PaymentIntent) {
  await createSupabaseAdminClient()
    .from("purchase_orders")
    .update({
      status: "failed",
      payment_intent_id: intent.id,
      failure_reason: intent.last_payment_error?.message ?? "Payment failed.",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_intent_id", intent.id);
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for payment webhooks." }, { status: 503 });
  }

  if (!isStripeConfigured() || !hasStripeWebhookSecret()) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await markOrderPaidByCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "checkout.session.expired":
      await markOrderCanceledByCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "payment_intent.payment_failed":
      await markOrderFailedByPaymentIntent(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
