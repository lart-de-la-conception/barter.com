import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  conversations,
  currentUserId,
  favoriteProductIds,
  products,
  slugifyBrand,
  tradeProposals,
  users,
} from "../lib/market-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicProductsDir = path.join(repoRoot, "public", "products");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const profileIdBySlug = new Map(users.map((user) => [user.id, user.profileId]));

async function uploadProductImages() {
  const uploaded: Array<{
    productId: number;
    storagePath: string;
    publicUrl: string;
    sortOrder: number;
  }> = [];

  for (const product of products) {
    for (const [sortOrder, imagePath] of product.images.entries()) {
      const filename = imagePath.replace("/products/", "");
      const storagePath = `${product.id}/${filename}`;
      const fileBuffer = await readFile(path.join(publicProductsDir, filename));

      const uploadResponse = await supabase.storage
        .from("product-media")
        .upload(storagePath, fileBuffer, {
          contentType: filename.endsWith(".png") ? "image/png" : "image/jpeg",
          upsert: true,
        });

      if (uploadResponse.error) {
        throw uploadResponse.error;
      }

      const { data } = supabase.storage.from("product-media").getPublicUrl(storagePath);
      uploaded.push({
        productId: product.id,
        storagePath,
        publicUrl: data.publicUrl,
        sortOrder,
      });
    }
  }

  return uploaded;
}

async function main() {
  const productImages = await uploadProductImages();

  const { error: profilesError } = await supabase.from("profiles").upsert(
    users.map((user) => ({
      id: user.profileId,
      email: user.email.toLowerCase(),
      slug: user.id,
      name: user.name,
      handle: user.handle,
      initials: user.initials,
      location: user.location,
      member_since: user.memberSince,
      rating: user.rating,
      reviews: user.reviews,
      completed_trades: user.completedTrades,
      response_rate: user.responseRate,
      bio: user.bio,
      avatar_seed: user.avatarSeed,
      is_online: user.online ?? false,
    })),
    { onConflict: "id" },
  );

  if (profilesError) {
    throw profilesError;
  }

  const { error: productsError } = await supabase.from("products").upsert(
    products.map((product) => ({
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      brand_slug: slugifyBrand(product.brand),
      title: product.title,
      subtitle: product.subtitle,
      category: product.category,
      size: product.size,
      condition: product.condition,
      location: product.location,
      price: product.price,
      original_price: product.originalPrice ?? null,
      seller_profile_id: profileIdBySlug.get(product.sellerId),
      listing_time: product.listingTime,
      badge: product.badge ?? null,
      color: product.color,
      description: product.description,
      detail_items: product.details,
      source_name: product.sourceName,
      source_url: product.sourceUrl,
    })),
    { onConflict: "id" },
  );

  if (productsError) {
    throw productsError;
  }

  const { error: syncSequenceError } = await supabase.rpc("sync_products_id_sequence");
  if (syncSequenceError) {
    throw new Error(
      `Products seeded but sync_products_id_sequence failed (${syncSequenceError.message}). ` +
        "Apply the latest supabase/schema.sql (function sync_products_id_sequence) to your project, then re-run the seed.",
    );
  }

  await supabase.from("product_images").delete().in("product_id", products.map((product) => product.id));
  const { error: productImagesError } = await supabase.from("product_images").insert(
    productImages.map((image) => ({
      product_id: image.productId,
      storage_path: image.storagePath,
      public_url: image.publicUrl,
      sort_order: image.sortOrder,
    })),
  );

  if (productImagesError) {
    throw productImagesError;
  }

  const currentProfileId = profileIdBySlug.get(currentUserId);
  if (!currentProfileId) {
    throw new Error("Missing current user profile mapping.");
  }

  await supabase.from("favorites").delete().eq("profile_id", currentProfileId);
  const { error: favoritesError } = await supabase.from("favorites").insert(
    favoriteProductIds.map((productId) => ({
      profile_id: currentProfileId,
      product_id: productId,
    })),
  );

  if (favoritesError) {
    throw favoritesError;
  }

  const { error: conversationsError } = await supabase.from("conversations").upsert(
    conversations.map((conversation) => ({
      id: conversation.id,
      last_message_preview: conversation.lastMessage,
      display_timestamp: conversation.timestamp,
    })),
    { onConflict: "id" },
  );

  if (conversationsError) {
    throw conversationsError;
  }

  await supabase.from("conversation_participants").delete().in("conversation_id", conversations.map((conversation) => conversation.id));
  const { error: participantError } = await supabase.from("conversation_participants").insert(
    conversations.flatMap((conversation) => [
      {
        conversation_id: conversation.id,
        profile_id: currentProfileId,
      },
      {
        conversation_id: conversation.id,
        profile_id: profileIdBySlug.get(conversation.userId),
      },
    ]),
  );

  if (participantError) {
    throw participantError;
  }

  await supabase.from("messages").delete().in("conversation_id", conversations.map((conversation) => conversation.id));
  const { error: messageError } = await supabase.from("messages").insert(
    conversations.flatMap((conversation) =>
      conversation.messages.map((message) => ({
        conversation_id: conversation.id,
        sender_profile_id: message.sender === "me" ? currentProfileId : profileIdBySlug.get(conversation.userId),
        body: message.text,
        display_timestamp: message.timestamp,
      })),
    ),
  );

  if (messageError) {
    throw messageError;
  }

  const { error: tradesError } = await supabase.from("trades").upsert(
    tradeProposals.map((trade) => {
      const isSent = trade.type === "sent";
      return {
        id: trade.id,
        initiator_profile_id: isSent ? currentProfileId : profileIdBySlug.get(trade.userId),
        recipient_profile_id: isSent ? profileIdBySlug.get(trade.userId) : currentProfileId,
        status: trade.status,
        message: trade.message,
        display_timestamp: trade.timestamp,
        initiator_cash: isSent ? trade.yourCash ?? null : trade.theirCash ?? null,
        recipient_cash: isSent ? trade.theirCash ?? null : trade.yourCash ?? null,
      };
    }),
    { onConflict: "id" },
  );

  if (tradesError) {
    throw tradesError;
  }

  await supabase.from("trade_items").delete().in("trade_id", tradeProposals.map((trade) => trade.id));
  const { error: tradeItemError } = await supabase.from("trade_items").insert(
    tradeProposals.flatMap((trade) => {
      const isSent = trade.type === "sent";
      return [
        ...trade.yourItemIds.map((productId) => ({
          trade_id: trade.id,
          product_id: productId,
          side: isSent ? "initiator" : "recipient",
        })),
        ...trade.theirItemIds.map((productId) => ({
          trade_id: trade.id,
          product_id: productId,
          side: isSent ? "recipient" : "initiator",
        })),
      ];
    }),
  );

  if (tradeItemError) {
    throw tradeItemError;
  }

  console.log("Supabase seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
