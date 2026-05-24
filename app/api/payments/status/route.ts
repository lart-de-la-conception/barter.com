import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { isStripeConfigured } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST() {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for payment status sync." }, { status: 503 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured yet. Set STRIPE_SECRET_KEY first." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .eq("id", profile.id)
    .maybeSingle();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 404 });
  }

  const stripeAccountId = profileRow.stripe_account_id as string | null;
  if (!stripeAccountId) {
    return NextResponse.json({
      ok: true,
      stripeAccountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
    });
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    stripeAccountId,
    chargesEnabled,
    payoutsEnabled,
  });
}

