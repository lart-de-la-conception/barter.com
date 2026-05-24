import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

type StartBody = {
  recipientProfileId?: string;
  body?: string;
  productId?: number;
  productImageUrl?: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json({ error: "Messaging is not configured on the server." }, { status: 503 });
  }

  const profile = await ensureProfileForAuthenticatedUser();
  if (!profile) {
    return NextResponse.json({ error: "You must be signed in to message members." }, { status: 401 });
  }

  let payload: StartBody;
  try {
    payload = (await request.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recipientProfileId = typeof payload.recipientProfileId === "string" ? payload.recipientProfileId.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const productId = payload.productId !== undefined ? Number(payload.productId) : null;
  const productImageUrl = typeof payload.productImageUrl === "string" ? payload.productImageUrl.trim() : null;

  if (!recipientProfileId) {
    return NextResponse.json({ error: "Recipient is required." }, { status: 400 });
  }

  if (recipientProfileId === profile.id) {
    return NextResponse.json({ error: "You can\u2019t message yourself." }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: recipient, error: recipientError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", recipientProfileId)
    .maybeSingle();

  if (recipientError) {
    return NextResponse.json({ error: recipientError.message }, { status: 500 });
  }

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  }

  const conversationId = await findOrCreateDirectConversation(supabase, profile.id, recipientProfileId);

  const timestamp = new Date().toISOString();
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

  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({
      last_message_preview: body,
      display_timestamp: "Just now",
      updated_at: timestamp,
    })
    .eq("id", conversationId);

  if (conversationUpdateError) {
    return NextResponse.json({ error: conversationUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, conversationId });
}

async function findOrCreateDirectConversation(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  senderProfileId: string,
  recipientProfileId: string,
) {
  const { data: mine, error: mineError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", senderProfileId);

  if (mineError) {
    throw new Error(mineError.message);
  }

  const mineIds = (mine ?? []).map((row) => row.conversation_id as number);

  if (mineIds.length) {
    const { data: shared, error: sharedError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("conversation_id", mineIds)
      .eq("profile_id", recipientProfileId);

    if (sharedError) {
      throw new Error(sharedError.message);
    }

    const candidateIds = (shared ?? []).map((row) => row.conversation_id as number);
    if (candidateIds.length) {
      const { data: counts, error: countsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", candidateIds);

      if (countsError) {
        throw new Error(countsError.message);
      }

      const countById = new Map<number, number>();
      for (const row of counts ?? []) {
        const id = row.conversation_id as number;
        countById.set(id, (countById.get(id) ?? 0) + 1);
      }

      const directId = candidateIds.find((id) => countById.get(id) === 2);
      if (directId) {
        return directId;
      }
    }
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({ last_message_preview: "", display_timestamp: "Just now" })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    throw new Error(conversationError?.message ?? "Unable to create conversation.");
  }

  const { error: participantError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, profile_id: senderProfileId },
      { conversation_id: conversation.id, profile_id: recipientProfileId },
    ]);

  if (participantError) {
    throw new Error(participantError.message);
  }

  return conversation.id as number;
}
