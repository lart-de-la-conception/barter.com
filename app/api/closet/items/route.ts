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
    const size = String(formData.get("size") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? "");
    const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!title || !brand || !size || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Title, brand, size, and a valid price are required." }, { status: 400 });
    }

    if (!images.length) {
      return NextResponse.json({ error: "Add at least one product image." }, { status: 400 });
    }

    const timestamp = Date.now();
    const baseSlug = slugify(`${brand}-${title}`) || `listing-${timestamp}`;
    const productSlug = `${baseSlug}-${timestamp}`;

    for (const [sortOrder, image] of images.slice(0, 8).entries()) {
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
      uploadedImages.push({
        storagePath,
        publicUrl: data.publicUrl,
        sortOrder,
      });
    }

    const location = typeof profile.location === "string" && profile.location.trim() ? profile.location : "Members Only";
    const handle = typeof profile.handle === "string" ? profile.handle : "member";

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        slug: productSlug,
        brand,
        brand_slug: slugify(brand) || brand.toLowerCase(),
        title,
        subtitle: "Freshly added closet listing.",
        category: "Closet Add",
        size,
        condition: "New Listing",
        location,
        price,
        seller_profile_id: profile.id,
        listing_time: "Just now",
        color: "Unspecified",
        description: [description || `New ${brand} listing added to ${handle}'s closet.`],
        detail_items: [
          { label: "Category", value: "Closet Add" },
          { label: "Condition", value: "New Listing" },
          { label: "Added By", value: handle },
        ],
        source_name: "Member Closet",
        source_url: "#",
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
