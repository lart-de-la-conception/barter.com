import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

export const runtime = "nodejs";

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length) return message;
  }
  return "Unable to upload shipping label.";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Server is not configured for order updates." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const orderId = String((await context.params).id ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .select("id, product_id, buyer_profile_id, seller_profile_id, status, label_due_at")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.buyer_profile_id !== profile.id) {
      return NextResponse.json({ error: "Only the buyer can upload the shipping label." }, { status: 403 });
    }

    if (order.status !== "awaiting_label" && order.status !== "label_submitted") {
      return NextResponse.json({ error: "This order is not awaiting a shipping label." }, { status: 409 });
    }

    const formData = await request.formData();
    const file = formData.get("label");
    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Attach a label file (PDF or image)." }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const dueAt = order.label_due_at ? new Date(order.label_due_at) : null;
    const isLate = Boolean(dueAt && now.getTime() > dueAt.getTime());

    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `${orderId}/${Date.now()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const upload = await supabase.storage.from("shipping-labels").upload(storagePath, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (upload.error) {
      throw upload.error;
    }

    const { data: urlData } = supabase.storage.from("shipping-labels").getPublicUrl(storagePath);
    const shippingLabelUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({
        status: "label_submitted",
        shipping_label_url: shippingLabelUrl,
        shipping_label_storage_path: storagePath,
        shipping_label_uploaded_at: nowIso,
        updated_at: nowIso,
        metadata: { label_late: isLate },
      })
      .eq("id", orderId);
    if (updateError) throw updateError;

    // Notify seller + buyer (simple in-app notifications).
    await supabase.from("notifications").insert([
      {
        profile_id: order.seller_profile_id,
        type: "label_submitted",
        purchase_order_id: orderId,
        product_id: order.product_id,
        message: `Buyer uploaded a shipping label for order ${orderId}.`,
      },
      {
        profile_id: order.buyer_profile_id,
        type: "label_submitted",
        purchase_order_id: orderId,
        product_id: order.product_id,
        message: `Shipping label uploaded. The seller has been notified.`,
      },
    ]);

    return NextResponse.json({ ok: true, orderId, shippingLabelUrl, late: isLate });
  } catch (error) {
    return NextResponse.json({ error: formatErrorMessage(error) }, { status: 500 });
  }
}

