import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";
import { serverErrorResponse } from "@/lib/api-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { error: "Server is not configured for this operation." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Verify the item belongs to this user before deleting
  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("id, seller_profile_id")
    .eq("id", productId)
    .maybeSingle();

  if (fetchError) {
    return serverErrorResponse("closet.itemFetch", fetchError, "Unable to delete item.");
  }

  if (!product) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (product.seller_profile_id !== profile.id) {
    return NextResponse.json({ error: "You can only delete your own items." }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    return serverErrorResponse("closet.itemDelete", deleteError, "Unable to delete item.");
  }

  return NextResponse.json({ ok: true });
}
