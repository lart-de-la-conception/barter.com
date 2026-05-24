import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await ensureProfileForAuthenticatedUser();

  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to send messages." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { conversationId?: number; body?: string; productId?: number; productImageUrl?: string }
    | null;
  const conversationId = Number(payload?.conversationId);
  const body = String(payload?.body ?? "").trim();
  const productId = payload?.productId !== undefined ? Number(payload.productId) : null;
  const productImageUrl = typeof payload?.productImageUrl === "string" ? payload.productImageUrl.trim() : null;

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return NextResponse.json({ error: "A valid conversation is required." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_profile_id: profile.id,
    body,
    product_id: Number.isFinite(productId) && productId && productId > 0 ? productId : null,
    product_image_url: productImageUrl || null,
    display_timestamp: "Just now",
  });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      last_message_preview: body,
      display_timestamp: "Just now",
    })
    .eq("id", conversationId);

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
