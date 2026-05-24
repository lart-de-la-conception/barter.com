import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

const moderationStatuses = new Set(["pending", "approved", "denied", "flagged", "needs_info"]);
const verificationStatuses = new Set(["unverified", "verified", "failed", "needs_review"]);

type PatchBody = {
  moderationStatus?: string;
  moderationNote?: string | null;
  verificationStatus?: string;
  verificationNote?: string | null;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for admin actions." }, { status: 503 });
  }

  const { id } = await context.params;
  const productId = Number(id);
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!profile.is_admin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let payload: PatchBody;
  try {
    payload = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof payload.moderationStatus === "string") {
    const value = payload.moderationStatus;
    if (!moderationStatuses.has(value)) {
      return NextResponse.json({ error: "Unknown moderation status." }, { status: 400 });
    }
    update.moderation_status = value;
    update.moderation_note = typeof payload.moderationNote === "string" ? payload.moderationNote.trim() || null : null;
    update.moderation_reviewed_at = new Date().toISOString();
    update.moderation_reviewed_by = profile.id;

    // In v1, moderation approval implies verification.
    if (value === "approved" && typeof payload.verificationStatus !== "string") {
      update.verification_status = "verified";
      update.verification_note = null;
      update.verification_reviewed_at = new Date().toISOString();
      update.verification_reviewed_by = profile.id;
    }
  }

  if (typeof payload.verificationStatus === "string") {
    const value = payload.verificationStatus;
    if (!verificationStatuses.has(value)) {
      return NextResponse.json({ error: "Unknown verification status." }, { status: 400 });
    }
    update.verification_status = value;
    update.verification_note = typeof payload.verificationNote === "string" ? payload.verificationNote.trim() || null : null;
    update.verification_reviewed_at = new Date().toISOString();
    update.verification_reviewed_by = profile.id;
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Provide a status change." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").update(update).eq("id", productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
