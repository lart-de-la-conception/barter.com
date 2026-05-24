import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { getConfiguredAppUrl, isStripeConfigured } from "@/lib/payments/config";
import { getStripeClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

function normalizeBusinessUrl(candidate: string) {
  const trimmed = candidate.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  // Common local/dev case: "localhost:3000"
  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  // Otherwise assume a real domain.
  return `https://${trimmed}`;
}

function getBaseUrl(request: Request) {
  const configured = getConfiguredAppUrl();
  const origin = new URL(request.url).origin;
  if (!configured) return origin;

  const normalized = normalizeBusinessUrl(configured);
  try {
    return new URL(normalized).origin;
  } catch {
    return origin;
  }
}

function isLocalBusinessUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for payment onboarding." }, { status: 503 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured yet. Set STRIPE_SECRET_KEY first." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const stripe = getStripeClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, name, stripe_account_id")
    .eq("id", profile.id)
    .maybeSingle();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 404 });
  }

  let stripeAccountId = profileRow.stripe_account_id as string | null;
  if (!stripeAccountId) {
    const baseUrl = getBaseUrl(request);
    const businessProfile: { product_description: string; url?: string } = {
      product_description: "Secondhand luxury marketplace where sellers list items and buyers purchase through checkout.",
    };
    if (!isLocalBusinessUrl(baseUrl)) {
      businessProfile.url = baseUrl;
    }
    const account = await stripe.accounts.create({
      type: "express",
      email: String(profileRow.email),
      business_type: "individual",
      business_profile: businessProfile,
      metadata: {
        profile_id: String(profile.id),
      },
    });

    stripeAccountId = account.id;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
      })
      .eq("id", profile.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const baseUrl = getBaseUrl(request);
    const businessProfile: { product_description: string; url?: string } = {
      product_description: "Secondhand luxury marketplace where sellers list items and buyers purchase through checkout.",
    };
    if (!isLocalBusinessUrl(baseUrl)) {
      businessProfile.url = baseUrl;
    }
    await stripe.accounts.update(stripeAccountId, {
      business_profile: businessProfile,
    });
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
      })
      .eq("id", profile.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const baseUrl = getBaseUrl(request);
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${baseUrl}/closet?payments=refresh`,
    return_url: `${baseUrl}/closet?payments=ready`,
  });

  return NextResponse.json({
    ok: true,
    onboardingUrl: accountLink.url,
    stripeAccountId,
  });
}
