import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey } from "@/lib/supabase/config";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function archivePieceSlug(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "piece"
  );
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length) {
      return message;
    }
  }

  return "Unable to add item to closet.";
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      {
        error:
          "Server is not configured for closet uploads. Set SUPABASE_SERVICE_ROLE_KEY in the environment (needed for storage and listing creation).",
      },
      { status: 503 },
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const uploadedImages: Array<{ storagePath: string; publicUrl: string; sortOrder: number }> = [];

  try {
    const profile = await ensureProfileForAuthenticatedUser();

    if (!profile) {
      return NextResponse.json({ error: "You must be signed in to add items." }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const itemType = String(formData.get("itemType") ?? "").trim();
    const conditionKey = String(formData.get("condition") ?? "").trim();
    const size = String(formData.get("size") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? "");
    const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!title || !brand || !itemType || !conditionKey || !size || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Title, brand, type, condition, size, and a valid price are required." },
        { status: 400 },
      );
    }

    if (!images.length) {
      return NextResponse.json({ error: "Add at least one product image." }, { status: 400 });
    }

    const timestamp = Date.now();
    const brandSlug = slugify(brand) || brand.toLowerCase();
    const baseSlug = slugify(`${brand}-${title}`) || `listing-${timestamp}`;
    const productSlug = `${baseSlug}-${timestamp}`;

    const results = await Promise.all(
      images.slice(0, 8).map(async (image, sortOrder) => {
        const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
        const storagePath = `${profile.id}/${timestamp}-${sortOrder}.${extension}`;
        const arrayBuffer = await image.arrayBuffer();
        const uploadResponse = await supabaseAdmin.storage.from("product-media").upload(storagePath, arrayBuffer, {
          contentType: image.type || "application/octet-stream",
          upsert: false,
        });

        if (uploadResponse.error) {
          throw uploadResponse.error;
        }

        const { data } = supabaseAdmin.storage.from("product-media").getPublicUrl(storagePath);
        return { storagePath, publicUrl: data.publicUrl, sortOrder };
      }),
    );
    uploadedImages.push(...results);

    const location = typeof profile.location === "string" && profile.location.trim() ? profile.location : "Members Only";
    const handle = typeof profile.handle === "string" ? profile.handle : "member";
    const typeEntry = {
      shoes: { label: "Shoes", category: "Shoes" },
      pants: { label: "Pants", category: "Pants" },
      shorts: { label: "Shorts", category: "Shorts" },
      tshirt: { label: "T-Shirt", category: "T-Shirts" },
      longsleeve: { label: "Longsleeve", category: "Longsleeves" },
      hoodie: { label: "Hoodie", category: "Sweatshirts & Hoodies" },
      "zip-hoodie": { label: "Zip Hoodie", category: "Sweatshirts & Hoodies" },
      sweater: { label: "Sweater / Knit", category: "Sweaters" },
      jacket: { label: "Jacket", category: "Outerwear" },
      hat: { label: "Hat", category: "Accessories" },
      accessory: { label: "Accessory", category: "Accessories" },
    } as const;

    const resolvedType = (typeEntry as Record<string, { label: string; category: string }>)[itemType];
    if (!resolvedType) {
      return NextResponse.json({ error: "Invalid item type." }, { status: 400 });
    }

    const conditionEntry = {
      new: "New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
    } as const;

    const resolvedCondition = (conditionEntry as Record<string, string>)[conditionKey];
    if (!resolvedCondition) {
      return NextResponse.json({ error: "Invalid condition." }, { status: 400 });
    }

    const { data: resolvedBrand, error: brandError } = await supabaseAdmin
      .from("brands")
      .upsert(
        {
          slug: brandSlug,
          name: brand,
          is_active: true,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (brandError || !resolvedBrand) {
      throw brandError ?? new Error("Unable to resolve brand.");
    }

    const pieceSlug = archivePieceSlug(title);
    let archivePieceId: number | null = null;
    {
      const { data: existingPiece, error: existingPieceError } = await supabaseAdmin
        .from("brand_archive_pieces")
        .select("id")
        .eq("brand_id", resolvedBrand.id)
        .eq("slug", pieceSlug)
        .limit(1)
        .maybeSingle();

      if (existingPieceError) {
        throw existingPieceError;
      }

      if (existingPiece?.id) {
        archivePieceId = Number(existingPiece.id);
      } else {
        const { data: newPiece, error: newPieceError } = await supabaseAdmin
          .from("brand_archive_pieces")
          .insert({
            brand_id: resolvedBrand.id,
            brand_slug: brandSlug,
            slug: pieceSlug,
            title,
            season_kind: "UNKNOWN",
            season_year: null,
            season_label: "Unknown",
            category: resolvedType.category,
            color: "Unspecified",
            cover_image_url: uploadedImages[0]?.publicUrl ?? null,
            description: [description || `New ${brand} listing added to ${handle}'s closet.`],
            details: [
              { label: "Category", value: resolvedType.category },
              { label: "Added By", value: handle },
            ],
          })
          .select("id")
          .single();

        if (newPieceError || !newPiece) {
          throw newPieceError ?? new Error("Unable to create archive piece.");
        }

        archivePieceId = Number(newPiece.id);
      }
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        slug: productSlug,
        brand_id: resolvedBrand.id,
        brand,
        brand_slug: brandSlug,
        title,
        subtitle: `Member closet listing (${resolvedType.label}).`,
        category: resolvedType.category,
        size,
        condition: resolvedCondition,
        location,
        price,
        seller_profile_id: profile.id,
        listing_time: "Just now",
        color: "Unspecified",
        description: [description || `New ${brand} listing added to ${handle}'s closet.`],
        detail_items: [
          { label: "Category", value: resolvedType.category },
          { label: "Condition", value: resolvedCondition },
          { label: "Added By", value: handle },
        ],
        source_name: "Member Closet",
        source_url: "#",
        archive_piece_id: archivePieceId,
      })
      .select("id")
      .single();

    if (productError || !product) {
      throw productError ?? new Error("Unable to create product.");
    }

    const { error: imageError } = await supabaseAdmin.from("product_images").insert(
      uploadedImages.map((image) => ({
        product_id: product.id,
        storage_path: image.storagePath,
        public_url: image.publicUrl,
        sort_order: image.sortOrder,
      })),
    );

    if (imageError) {
      await supabaseAdmin.from("products").delete().eq("id", product.id);
      throw imageError;
    }

    return NextResponse.json({ ok: true, productId: product.id });
  } catch (error) {
    if (uploadedImages.length) {
      await supabaseAdmin.storage.from("product-media").remove(uploadedImages.map((image) => image.storagePath));
    }

    const message = formatErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
