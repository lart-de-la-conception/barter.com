import { redirect } from "next/navigation";
import {
  conversations as fallbackConversations,
  currentUserClosetIds,
  currentUserId,
  favoriteProductIds,
  featuredProductIds,
  getArchivePieceByBrandAndSlug,
  getArchivePiecesByBrandSlug,
  getBrandBySlug,
  getListingsForArchivePiece,
  getProductById,
  getProductsByBrandSlug,
  getProductsByIds,
  getUserById,
  heroSlides as fallbackHeroSlides,
  products as fallbackProducts,
  slugifyBrand,
  tradeProposals as fallbackTrades,
  userClosetListingIds,
  brandDirectory as fallbackBrandDirectory,
} from "@/lib/market-data";
import type {
  ArchiveBrandEntry,
  ArchivePiece,
  ArchiveSeasonFilter,
  ArchiveSeasonKind,
  BrandDirectoryEntry,
  Conversation,
  HeroSlide,
  MarketplaceStats,
  Notification,
  Product,
  PurchaseOrder,
  TradeProposal,
  UserProfile,
  Viewer,
} from "@/lib/marketplace-types";
import { isDevelopmentAuthBypassEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  slug: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  handle: string;
  initials: string;
  location: string;
  member_since: string;
  rating: number;
  reviews: number;
  completed_trades: number;
  response_rate: string;
  bio: string;
  avatar_seed: string;
  is_online: boolean;
  is_admin?: boolean;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  points?: number | null;
};

type ProductRow = {
  id: number;
  slug: string;
  brand_id?: number | null;
  brand: string;
  brand_slug: string;
  title: string;
  subtitle: string;
  category: string;
  size: string;
  condition: string;
  location: string;
  price: number;
  original_price: number | null;
  seller_profile_id: string;
  listing_time: string;
  badge: string | null;
  color: string;
  description: string[];
  detail_items: Array<{ label: string; value: string }>;
  source_name: string;
  source_url: string;
  moderation_status?: "pending" | "approved" | "denied" | "flagged" | "needs_info" | null;
  moderation_note?: string | null;
  verification_status?: "unverified" | "verified" | "failed" | "needs_review" | null;
  verification_note?: string | null;
  created_at?: string | null;
  sold_at?: string | null;
  sold_to_profile_id?: string | null;
  archive_piece_id?: number | null;
};

type ArchivePieceRow = {
  id: number;
  brand_id: number;
  brand_slug: string;
  slug: string;
  title: string;
  season_kind: ArchiveSeasonKind;
  season_year: number | null;
  season_label: string;
  category: string | null;
  color: string | null;
  cover_image_url: string | null;
  description: string[];
  details: Array<{ label: string; value: string }>;
};

type ProductImageRow = {
  product_id: number;
  public_url: string;
  sort_order: number;
};

type FavoriteRow = {
  product_id: number;
};

type ConversationRow = {
  id: number;
  last_message_preview: string;
  display_timestamp: string;
};

type ConversationParticipantRow = {
  conversation_id: number;
  profile_id: string;
};

type MessageRow = {
  id: number;
  conversation_id: number;
  sender_profile_id: string;
  body: string;
  display_timestamp: string;
  product_id?: number | null;
  product_image_url?: string | null;
};

type TradeRow = {
  id: number;
  initiator_profile_id: string;
  recipient_profile_id: string;
  status: "pending" | "accepted" | "declined";
  message: string;
  display_timestamp: string;
  initiator_cash: number | null;
  recipient_cash: number | null;
};

type TradeItemRow = {
  trade_id: number;
  product_id: number;
  side: "initiator" | "recipient";
};

type PurchaseOrderRow = {
  id: string;
  product_id: number;
  buyer_profile_id: string;
  seller_profile_id: string;
  status: "pending_checkout" | "awaiting_label" | "label_submitted" | "paid" | "failed" | "canceled" | "refunded";
  amount: number;
  currency: string;
  platform_fee: number;
  checkout_session_id: string | null;
  payment_intent_id: string | null;
  label_due_at: string | null;
  shipping_label_url: string | null;
  shipping_label_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: string;
  profile_id: string;
  type: "sale_created" | "label_submitted";
  purchase_order_id: string | null;
  product_id: number | null;
  message: string;
  read_at: string | null;
  created_at: string;
};

type BrandRow = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  is_active: boolean;
};

function isRecoverableSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "PGRST205" ||
    candidate.code === "42P01" ||
    candidate.message?.includes("schema cache") === true ||
    candidate.message?.includes("Could not find the table") === true
  );
}

function makeStats(items: Product[]): MarketplaceStats {
  return {
    activeListings: items.length,
    coreBrands: new Set(items.map((product) => product.brand)).size,
    averageAsk: Math.round(items.reduce((sum, item) => sum + item.price, 0) / Math.max(items.length, 1)),
  };
}

function toViewer(profile: UserProfile): Viewer {
  return {
    profileId: profile.profileId,
    slug: profile.id,
    email: profile.email,
    handle: profile.handle,
    initials: profile.initials,
    avatarSeed: profile.avatarSeed,
    name: profile.name,
    isAdmin: profile.isAdmin === true,
    points: profile.points,
  };
}

function fallbackViewer() {
  const user = getUserById(currentUserId);
  return user ? toViewer(user) : null;
}

function shouldUseFallbackMarketplaceData() {
  return !isSupabaseConfigured() || isDevelopmentAuthBypassEnabled();
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    profileId: row.id,
    id: row.slug,
    email: row.email,
    name: row.name,
    handle: row.handle,
    initials: row.initials,
    location: row.location,
    memberSince: row.member_since,
    rating: row.rating,
    reviews: row.reviews,
    completedTrades: row.completed_trades,
    responseRate: row.response_rate,
    bio: row.bio,
    avatarSeed: row.avatar_seed,
    online: row.is_online,
    isAdmin: row.is_admin === true,
    stripeAccountId: row.stripe_account_id ?? undefined,
    stripeChargesEnabled: row.stripe_charges_enabled === true,
    stripePayoutsEnabled: row.stripe_payouts_enabled === true,
    points: row.points ?? undefined,
  };
}

function mapProducts(productRows: ProductRow[], imageRows: ProductImageRow[], profiles: UserProfile[]) {
  const profileById = new Map(profiles.map((profile) => [profile.profileId, profile]));
  const imagesByProductId = new Map<number, string[]>();

  for (const image of imageRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const current = imagesByProductId.get(image.product_id) ?? [];
    current.push(image.public_url);
    imagesByProductId.set(image.product_id, current);
  }

  return productRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    size: row.size,
    condition: row.condition,
    location: row.location,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    sellerId: profileById.get(row.seller_profile_id)?.id ?? "",
    sellerProfileId: row.seller_profile_id,
    listingTime: row.listing_time,
    badge: row.badge ?? undefined,
    color: row.color,
    images: imagesByProductId.get(row.id) ?? [],
    description: row.description,
    details: row.detail_items,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    moderationStatus: row.moderation_status ?? "pending",
    moderationNote: row.moderation_note ?? undefined,
    verificationStatus: row.verification_status ?? "unverified",
    verificationNote: row.verification_note ?? undefined,
    createdAt: row.created_at ?? undefined,
    soldAt: row.sold_at ?? undefined,
    soldToProfileId: row.sold_to_profile_id ?? undefined,
    archivePieceId: row.archive_piece_id ?? undefined,
  })) satisfies Product[];
}

function mapArchivePiece(row: ArchivePieceRow, brandName: string, listingCount: number): ArchivePiece {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandSlug: row.brand_slug,
    brand: brandName,
    slug: row.slug,
    title: row.title,
    seasonKind: row.season_kind,
    seasonYear: row.season_year ?? undefined,
    seasonLabel: row.season_label,
    category: row.category ?? undefined,
    color: row.color ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    description: row.description ?? [],
    details: row.details ?? [],
    listingCount,
  };
}

function seasonSortKey(piece: { seasonKind: ArchiveSeasonKind; seasonYear?: number }) {
  if (piece.seasonKind === "UNKNOWN") return -Infinity;
  const kindOrder: Record<ArchiveSeasonKind, number> = {
    FW: 3,
    SS: 2,
    PRE: 1,
    CRUISE: 0,
    UNKNOWN: -1,
  };
  return (piece.seasonYear ?? 0) * 10 + kindOrder[piece.seasonKind];
}

function seasonFilterKey(seasonKind: ArchiveSeasonKind, seasonYear: number | null | undefined) {
  if (seasonKind === "UNKNOWN") return "unknown";
  return `${seasonKind.toLowerCase()}${seasonYear ?? ""}`;
}

function buildSeasonFilters(pieces: ArchivePiece[]): ArchiveSeasonFilter[] {
  const byKey = new Map<string, ArchiveSeasonFilter>();

  for (const piece of pieces) {
    const key = seasonFilterKey(piece.seasonKind, piece.seasonYear);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        key,
        label: piece.seasonLabel,
        count: 1,
        seasonKind: piece.seasonKind,
        seasonYear: piece.seasonYear,
      });
    }
  }

  return Array.from(byKey.values()).sort((a, b) => seasonSortKey(b) - seasonSortKey(a));
}

async function getSupabaseViewerProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

async function getProfilesByIds(profileIds: string[]) {
  if (!profileIds.length) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").in("id", profileIds);
  if (error) throw error;
  return (data ?? []).map((row) => mapProfile(row as ProfileRow));
}

async function getFavoriteIds(profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("favorites").select("product_id").eq("profile_id", profileId);
  if (error) throw error;
  return ((data ?? []) as FavoriteRow[]).map((row) => row.product_id);
}

async function getProductsAndSellersByFilter(filters?: {
  ids?: number[];
  brandSlug?: string;
  sellerProfileId?: string;
  includeNonMarketplace?: boolean;
  includeSold?: boolean;
  buyerProfileId?: string;
  archivePieceId?: number;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select("*").order("id");

  if (filters?.ids?.length) query = query.in("id", filters.ids);
  if (typeof filters?.archivePieceId === "number") {
    query = query.eq("archive_piece_id", filters.archivePieceId);
  }
  if (filters?.brandSlug) {
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", filters.brandSlug)
      .limit(1)
      .maybeSingle();

    if (brandError) throw brandError;
    if (brandData?.id) {
      query = query.eq("brand_id", brandData.id);
    } else {
      // Keep supporting legacy rows while migrating old datasets.
      query = query.eq("brand_slug", filters.brandSlug);
    }
  }
  if (filters?.sellerProfileId) query = query.eq("seller_profile_id", filters.sellerProfileId);
  if (filters?.buyerProfileId) query = query.eq("sold_to_profile_id", filters.buyerProfileId);
  if (!filters?.includeNonMarketplace) {
    query = query.not("moderation_status", "in", "(denied,needs_info)");
  }
  if (!filters?.includeSold) {
    query = query.is("sold_at", null);
  }

  const { data: productData, error } = await query;
  if (error) throw error;

  const productRows = (productData ?? []) as ProductRow[];
  const productIds = productRows.map((row) => row.id);
  const sellerIds = Array.from(new Set(productRows.map((row) => row.seller_profile_id)));
  const [profiles, imageResponse] = await Promise.all([
    getProfilesByIds(sellerIds),
    productIds.length
      ? supabase.from("product_images").select("product_id, public_url, sort_order").in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (imageResponse.error) throw imageResponse.error;
  const products = mapProducts(productRows, (imageResponse.data ?? []) as ProductImageRow[], profiles);
  return { products, sellers: profiles };
}

async function getProductsByFilter(filters?: Parameters<typeof getProductsAndSellersByFilter>[0]) {
  const { products } = await getProductsAndSellersByFilter(filters);
  return products;
}

async function getBrandBySlugFromDatabase(brandSlug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, slug, name, tagline, description, is_active")
    .eq("slug", brandSlug)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const row = data as BrandRow | null;
  if (!row || row.is_active === false) {
    return undefined;
  }

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
  };
}

export async function getProductsByIdsData(ids: number[]) {
  if (!ids.length) return [];
  return shouldUseFallbackMarketplaceData() ? getProductsByIds(ids) : getProductsByFilter({ ids });
}

async function getConversationsForViewer(viewer: UserProfile) {
  const supabase = await createSupabaseServerClient();
  const participantsResponse = await supabase
    .from("conversation_participants")
    .select("conversation_id, profile_id")
    .eq("profile_id", viewer.profileId);

  if (participantsResponse.error) throw participantsResponse.error;

  const conversationIds = (participantsResponse.data ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const [conversationResponse, participantResponse, messageResponse] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, last_message_preview, display_timestamp")
      .in("id", conversationIds)
      .order("id"),
    supabase.from("conversation_participants").select("conversation_id, profile_id").in("conversation_id", conversationIds),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_profile_id, body, display_timestamp, product_id, product_image_url")
      .in("conversation_id", conversationIds)
      .order("id"),
  ]);

  if (conversationResponse.error) throw conversationResponse.error;
  if (participantResponse.error) throw participantResponse.error;
  if (messageResponse.error) throw messageResponse.error;

  const participantRows = (participantResponse.data ?? []) as ConversationParticipantRow[];
  const otherProfileIds = Array.from(
    new Set(
      participantRows
        .filter((row) => row.profile_id !== viewer.profileId)
        .map((row) => row.profile_id),
    ),
  );
  const otherProfiles = await getProfilesByIds(otherProfileIds);
  const profileById = new Map(otherProfiles.map((profile) => [profile.profileId, profile]));
  const messagesByConversation = new Map<number, MessageRow[]>();

  for (const message of (messageResponse.data ?? []) as MessageRow[]) {
    const current = messagesByConversation.get(message.conversation_id) ?? [];
    current.push(message);
    messagesByConversation.set(message.conversation_id, current);
  }

  return ((conversationResponse.data ?? []) as ConversationRow[]).map((conversation) => {
    const otherParticipant = participantRows.find(
      (row) => row.conversation_id === conversation.id && row.profile_id !== viewer.profileId,
    );
    const otherProfile = otherParticipant ? profileById.get(otherParticipant.profile_id) : undefined;

    return {
      id: conversation.id,
      userId: otherProfile?.id ?? viewer.id,
      lastMessage: conversation.last_message_preview,
      timestamp: conversation.display_timestamp,
      unread: false,
      online: otherProfile?.online ?? false,
      messages: (messagesByConversation.get(conversation.id) ?? []).map((message) => ({
        id: message.id,
        sender: message.sender_profile_id === viewer.profileId ? "me" : "other",
        text: message.body,
        timestamp: message.display_timestamp,
        product:
          typeof message.product_id === "number" &&
          message.product_id > 0 &&
          typeof message.product_image_url === "string" &&
          message.product_image_url.length
            ? { id: message.product_id, imageUrl: message.product_image_url }
            : undefined,
      })),
    } satisfies Conversation;
  });
}

async function getTradesForViewer(viewer: UserProfile) {
  const supabase = await createSupabaseServerClient();
  const tradesResponse = await supabase
    .from("trades")
    .select("id, initiator_profile_id, recipient_profile_id, status, message, display_timestamp, initiator_cash, recipient_cash")
    .or(`initiator_profile_id.eq.${viewer.profileId},recipient_profile_id.eq.${viewer.profileId}`)
    .order("id");

  if (tradesResponse.error) throw tradesResponse.error;

  const tradeRows = (tradesResponse.data ?? []) as TradeRow[];
  if (!tradeRows.length) return [];

  const tradeIds = tradeRows.map((trade) => trade.id);
  const [tradeItemsResponse, relatedProfiles] = await Promise.all([
    supabase.from("trade_items").select("trade_id, product_id, side").in("trade_id", tradeIds),
    getProfilesByIds(
      Array.from(
        new Set(tradeRows.flatMap((trade) => [trade.initiator_profile_id, trade.recipient_profile_id])),
      ),
    ),
  ]);

  if (tradeItemsResponse.error) throw tradeItemsResponse.error;

  const tradeItemsById = new Map<number, TradeItemRow[]>();
  for (const item of (tradeItemsResponse.data ?? []) as TradeItemRow[]) {
    const current = tradeItemsById.get(item.trade_id) ?? [];
    current.push(item);
    tradeItemsById.set(item.trade_id, current);
  }

  const profileById = new Map(relatedProfiles.map((profile) => [profile.profileId, profile]));

  return tradeRows.map((trade) => {
    const isInitiator = trade.initiator_profile_id === viewer.profileId;
    const relatedItems = tradeItemsById.get(trade.id) ?? [];
    const otherProfileId = isInitiator ? trade.recipient_profile_id : trade.initiator_profile_id;

    return {
      id: trade.id,
      type: isInitiator ? "sent" : "received",
      status: trade.status,
      userId: profileById.get(otherProfileId)?.id ?? viewer.id,
      yourItemIds: relatedItems
        .filter((item) => item.side === (isInitiator ? "initiator" : "recipient"))
        .map((item) => item.product_id),
      theirItemIds: relatedItems
        .filter((item) => item.side === (isInitiator ? "recipient" : "initiator"))
        .map((item) => item.product_id),
      yourCash: isInitiator ? trade.initiator_cash ?? undefined : trade.recipient_cash ?? undefined,
      theirCash: isInitiator ? trade.recipient_cash ?? undefined : trade.initiator_cash ?? undefined,
      message: trade.message,
      timestamp: trade.display_timestamp,
    } satisfies TradeProposal;
  });
}

export async function getViewer() {
  if (shouldUseFallbackMarketplaceData()) {
    return fallbackViewer();
  }

  try {
    const profile = await getSupabaseViewerProfile();
    return profile ? toViewer(profile) : null;
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getViewerFavoriteIds() {
  if (shouldUseFallbackMarketplaceData()) {
    return favoriteProductIds;
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    return viewerProfile ? getFavoriteIds(viewerProfile.profileId) : [];
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return favoriteProductIds;
    }

    throw error;
  }
}

export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return viewer;
}

export async function getBrandsPageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return { brands: fallbackBrandDirectory };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, slug, name, tagline, description, is_active")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    const brands = (data as BrandRow[]).map((row) => ({
      slug: row.slug,
      name: row.name,
      tagline: row.tagline ?? "",
      description: row.description ?? "",
    }));
    return { brands: brands.length ? brands : fallbackBrandDirectory };
  } catch (err) {
    if (isRecoverableSupabaseError(err)) return { brands: fallbackBrandDirectory };
    throw err;
  }
}

export async function getArchiveIndexPageData(): Promise<ArchiveBrandEntry[]> {
  // Build from fallback data — one call per brand, all in-process.
  function fromFallback(): ArchiveBrandEntry[] {
    return fallbackBrandDirectory.map((brand) => {
      const pieces = getArchivePiecesByBrandSlug(brand.slug);
      const seasons = buildSeasonFilters(pieces);
      const years = seasons
        .map((s) => s.seasonYear)
        .filter((y): y is number => y != null);
      return {
        brand,
        pieceCount: pieces.length,
        yearMin: years.length ? Math.min(...years) : null,
        yearMax: years.length ? Math.max(...years) : null,
        seasons,
      };
    }).filter((e) => e.pieceCount > 0);
  }

  if (shouldUseFallbackMarketplaceData()) {
    return fromFallback();
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Fetch all active brands
    const { data: brandRows, error: brandError } = await supabase
      .from("brands")
      .select("id, slug, name, tagline, description, is_active")
      .eq("is_active", true)
      .order("name");
    if (brandError) throw brandError;

    // Fetch aggregate stats per brand from archive pieces
    const { data: pieceRows, error: pieceError } = await supabase
      .from("brand_archive_pieces")
      .select("brand_id, season_kind, season_year, season_label");
    if (pieceError) throw pieceError;

    type PieceMeta = { brand_id: number; season_kind: ArchiveSeasonKind; season_year: number | null; season_label: string };
    const pieces = (pieceRows ?? []) as PieceMeta[];

    // Group by brand_id
    const byBrandId = new Map<number, PieceMeta[]>();
    for (const p of pieces) {
      const list = byBrandId.get(p.brand_id) ?? [];
      list.push(p);
      byBrandId.set(p.brand_id, list);
    }

    const entries: ArchiveBrandEntry[] = [];
    for (const row of (brandRows ?? []) as BrandRow[]) {
      const brandPieces = byBrandId.get(row.id) ?? [];
      if (brandPieces.length === 0) continue;

      const brand: BrandDirectoryEntry = {
        slug: row.slug,
        name: row.name,
        tagline: row.tagline ?? "",
        description: row.description ?? "",
      };

      // Build season filters from raw rows
      const asPieces = brandPieces.map((p) => ({
        id: 0, brandId: row.id, brandSlug: row.slug, brand: row.name,
        slug: "", title: "", seasonKind: p.season_kind,
        seasonYear: p.season_year ?? undefined, seasonLabel: p.season_label,
        description: [], details: [], listingCount: 0,
      })) satisfies ArchivePiece[];
      const seasons = buildSeasonFilters(asPieces);
      const years = seasons.map((s) => s.seasonYear).filter((y): y is number => y != null);

      entries.push({
        brand,
        pieceCount: brandPieces.length,
        yearMin: years.length ? Math.min(...years) : null,
        yearMax: years.length ? Math.max(...years) : null,
        seasons,
      });
    }

    // Fall back if DB has no archive data yet
    return entries.length ? entries : fromFallback();
  } catch (err) {
    if (isRecoverableSupabaseError(err)) return fromFallback();
    throw err;
  }
}

export async function getHomePageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      heroSlides: fallbackHeroSlides,
      featuredProducts: fallbackProducts.filter((product) => !product.soldAt).slice(0, 12),
      stats: makeStats(fallbackProducts),
    };
  }

  try {
    const allProducts = await getProductsByFilter();
    const featuredProducts = [
      ...allProducts.filter((product) => featuredProductIds.includes(product.id)),
      ...allProducts.filter((product) => !featuredProductIds.includes(product.id)),
    ].slice(0, 12);
    const heroSlides = fallbackHeroSlides.map((slide, index) => {
      const brandSlug = slide.ctaHref.startsWith("/brands/") ? slide.ctaHref.replace("/brands/", "") : "";
      const matchingProduct = brandSlug ? allProducts.find((product) => slugifyBrand(product.brand) === brandSlug) : undefined;
      return {
        id: index + 1,
        image: matchingProduct?.images[0] ?? slide.image,
        subtitle: slide.subtitle,
        title: slide.title,
        ctaHref: slide.ctaHref,
      } satisfies HeroSlide;
    });

    return {
      heroSlides,
      featuredProducts,
      stats: makeStats(allProducts),
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        heroSlides: fallbackHeroSlides,
        featuredProducts: fallbackProducts.filter((product) => !product.soldAt).slice(0, 12),
        stats: makeStats(fallbackProducts),
      };
    }

    throw error;
  }
}

function brandFallbackEntry(brandSlug: string): BrandDirectoryEntry | undefined {
  return getBrandBySlug(brandSlug);
}

function fallbackBrandArchive(brandSlug: string, seasonKey: string | undefined) {
  const brand = brandFallbackEntry(brandSlug);
  if (!brand) return null;

  const allPieces = getArchivePiecesByBrandSlug(brandSlug)
    .map((piece) => ({
      ...piece,
      listingCount: getListingsForArchivePiece(brandSlug, piece.slug).length,
    }))
    .sort((a, b) => seasonSortKey(b) - seasonSortKey(a) || a.title.localeCompare(b.title));

  const seasons = buildSeasonFilters(allPieces);
  const pieces = seasonKey
    ? allPieces.filter((piece) => seasonFilterKey(piece.seasonKind, piece.seasonYear) === seasonKey)
    : allPieces;

  return { brand, pieces, seasons };
}

export async function getBrandArchivePageData(brandSlug: string, options?: { season?: string }) {
  const seasonKey = options?.season?.toLowerCase();

  if (shouldUseFallbackMarketplaceData()) {
    return fallbackBrandArchive(brandSlug, seasonKey);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("id, slug, name, tagline, description, is_active")
      .eq("slug", brandSlug)
      .limit(1)
      .maybeSingle();

    if (brandError) throw brandError;
    const brandRow = brandData as BrandRow | null;
    if (!brandRow) return fallbackBrandArchive(brandSlug, seasonKey);
    if (brandRow.is_active === false) return null;

    const { data: pieceRows, error: pieceError } = await supabase
      .from("brand_archive_pieces")
      .select("*")
      .eq("brand_id", brandRow.id);

    if (pieceError) throw pieceError;

    const rows = (pieceRows ?? []) as ArchivePieceRow[];
    const pieceIds = rows.map((row) => row.id);

    let countsByPiece = new Map<number, number>();
    if (pieceIds.length) {
      const { data: listingRows, error: listingError } = await supabase
        .from("products")
        .select("archive_piece_id, sold_at, moderation_status")
        .in("archive_piece_id", pieceIds)
        .is("sold_at", null)
        .not("moderation_status", "in", "(denied,needs_info)");

      if (listingError) throw listingError;

      countsByPiece = new Map<number, number>();
      for (const listing of listingRows ?? []) {
        const id = (listing as { archive_piece_id: number | null }).archive_piece_id;
        if (id == null) continue;
        countsByPiece.set(id, (countsByPiece.get(id) ?? 0) + 1);
      }
    }

    const allPieces = rows
      .map((row) => mapArchivePiece(row, brandRow.name, countsByPiece.get(row.id) ?? 0))
      .sort((a, b) => seasonSortKey(b) - seasonSortKey(a) || a.title.localeCompare(b.title));

    const dbBrand: BrandDirectoryEntry = {
      slug: brandRow.slug,
      name: brandRow.name,
      tagline: brandRow.tagline,
      description: brandRow.description,
    };

    // If the DB archive has no season data yet, enrich with the demo catalog
    // so the year-slider UI always has content. Once real DB data has seasons
    // this branch is skipped automatically.
    const hasSeasonData = allPieces.some(
      (p) => p.seasonKind !== "UNKNOWN" && p.seasonYear != null,
    );
    if (!hasSeasonData) {
      const demo = fallbackBrandArchive(brandSlug, seasonKey);
      if (demo) {
        return { brand: dbBrand, pieces: demo.pieces, seasons: demo.seasons };
      }
    }

    const seasons = buildSeasonFilters(allPieces);
    const pieces = seasonKey
      ? allPieces.filter((piece) => seasonFilterKey(piece.seasonKind, piece.seasonYear) === seasonKey)
      : allPieces;

    return { brand: dbBrand, pieces, seasons };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return fallbackBrandArchive(brandSlug, seasonKey);
    }

    throw error;
  }
}

function fallbackArchivePieceDetail(brandSlug: string, pieceSlug: string) {
  const brand = brandFallbackEntry(brandSlug);
  if (!brand) return null;

  const piece = getArchivePieceByBrandAndSlug(brandSlug, pieceSlug);
  if (!piece) return null;

  const listings = getListingsForArchivePiece(brandSlug, pieceSlug);
  const sellersById = Object.fromEntries(
    Array.from(new Set(listings.map((listing) => listing.sellerId)))
      .map((id) => [id, getUserById(id)])
      .filter(([, profile]) => profile),
  );

  return {
    brand,
    piece: { ...piece, listingCount: listings.length },
    listings,
    sellersById,
  };
}

export async function getArchivePieceDetail(brandSlug: string, pieceSlug: string) {
  if (shouldUseFallbackMarketplaceData()) {
    return fallbackArchivePieceDetail(brandSlug, pieceSlug);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("id, slug, name, tagline, description, is_active")
      .eq("slug", brandSlug)
      .limit(1)
      .maybeSingle();

    if (brandError) throw brandError;
    const brandRow = brandData as BrandRow | null;
    if (!brandRow || brandRow.is_active === false) return null;

    const { data: pieceData, error: pieceError } = await supabase
      .from("brand_archive_pieces")
      .select("*")
      .eq("brand_id", brandRow.id)
      .eq("slug", pieceSlug)
      .limit(1)
      .maybeSingle();

    if (pieceError) throw pieceError;
    const pieceRow = pieceData as ArchivePieceRow | null;
    if (!pieceRow) return null;

    const listings = await getProductsByFilter({
      archivePieceId: pieceRow.id,
      includeNonMarketplace: false,
      includeSold: false,
    });

    const sellerIds = Array.from(new Set(listings.map((listing) => listing.sellerProfileId).filter(Boolean) as string[]));
    const sellers = sellerIds.length ? await getProfilesByIds(sellerIds) : [];
    const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

    return {
      brand: {
        slug: brandRow.slug,
        name: brandRow.name,
        tagline: brandRow.tagline,
        description: brandRow.description,
      } satisfies BrandDirectoryEntry,
      piece: mapArchivePiece(pieceRow, brandRow.name, listings.length),
      listings,
      sellersById,
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return fallbackArchivePieceDetail(brandSlug, pieceSlug);
    }

    throw error;
  }
}

function fallbackSellersForProducts(products: Product[]): Record<string, UserProfile> {
  const result: Record<string, UserProfile> = {};
  for (const slug of new Set(products.map((product) => product.sellerId).filter(Boolean))) {
    const profile = getUserById(slug);
    if (profile) result[profile.id] = profile;
  }
  return result;
}

export async function getCatalogPageData({
  searchQuery = "",
  brandSlug,
}: {
  searchQuery?: string;
  brandSlug?: string;
}) {
  if (shouldUseFallbackMarketplaceData()) {
    const products = brandSlug ? getProductsByBrandSlug(brandSlug) : fallbackProducts;
    return {
      brand: brandSlug ? getBrandBySlug(brandSlug) : undefined,
      products,
      sellersById: fallbackSellersForProducts(products),
      searchQuery,
      viewer: fallbackViewer(),
      initialFavoriteIds: favoriteProductIds,
    };
  }

  try {
    const [viewerProfile, brand, productResult] = await Promise.all([
      getSupabaseViewerProfile(),
      brandSlug ? getBrandBySlugFromDatabase(brandSlug) : Promise.resolve(undefined),
      getProductsAndSellersByFilter({
        brandSlug,
        // Marketplace lists should never show denied/needs_info or sold listings (even for admins).
        includeNonMarketplace: false,
        includeSold: false,
      }),
    ]);

    const sellersById = Object.fromEntries(productResult.sellers.map((seller) => [seller.id, seller]));

    return {
      brand: brand ?? (brandSlug ? getBrandBySlug(brandSlug) : undefined),
      products: productResult.products,
      sellersById,
      searchQuery,
      viewer: viewerProfile ? toViewer(viewerProfile) : null,
      initialFavoriteIds: viewerProfile ? await getFavoriteIds(viewerProfile.profileId) : [],
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      const products = brandSlug ? getProductsByBrandSlug(brandSlug) : fallbackProducts;
      return {
        brand: brandSlug ? getBrandBySlug(brandSlug) : undefined,
        products,
        sellersById: fallbackSellersForProducts(products),
        searchQuery,
        viewer: null,
        initialFavoriteIds: [],
      };
    }

    throw error;
  }
}

export async function getProductPageData(productId: number) {
  if (shouldUseFallbackMarketplaceData()) {
    const product = getProductById(productId);
    if (!product) return null;
    return {
      product,
      seller: getUserById(product.sellerId) ?? null,
      currentCloset: getProductsByIds(currentUserClosetIds.filter((id) => id !== product.id)),
      similar: fallbackProducts.filter((item) => item.id !== product.id).slice(0, 12),
      viewer: fallbackViewer(),
      initialFavoriteIds: favoriteProductIds,
    };
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    const products = await getProductsByFilter({
      includeNonMarketplace: viewerProfile?.isAdmin === true,
      includeSold: true,
    });
    const product = products.find((item) => item.id === productId);
    if (!product) return null;

    return {
      product,
      seller: await getPublicProfileBySlug(product.sellerId),
      currentCloset: viewerProfile ? await getProductsByFilter({ sellerProfileId: viewerProfile.profileId, includeSold: true }) : [],
      similar: products.filter((item) => item.id !== product.id).slice(0, 12),
      viewer: viewerProfile ? toViewer(viewerProfile) : null,
      initialFavoriteIds: viewerProfile ? await getFavoriteIds(viewerProfile.profileId) : [],
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      const product = getProductById(productId);
      if (!product) return null;

      return {
        product,
        seller: getUserById(product.sellerId) ?? null,
        currentCloset: [],
        similar: fallbackProducts.filter((item) => item.id !== product.id).slice(0, 12),
        viewer: null,
        initialFavoriteIds: [],
      };
    }

    throw error;
  }
}

export async function getFavoritesPageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      viewer: fallbackViewer(),
      favoriteIds: favoriteProductIds,
      watchedProducts: getProductsByIds(favoriteProductIds),
    };
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    if (!viewerProfile) {
      return {
        viewer: null,
        favoriteIds: [],
        watchedProducts: [],
      };
    }

    const favoriteIds = await getFavoriteIds(viewerProfile.profileId);
    return {
      viewer: toViewer(viewerProfile),
      favoriteIds,
      watchedProducts: favoriteIds.length ? await getProductsByFilter({ ids: favoriteIds, includeSold: true }) : [],
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        viewer: null,
        favoriteIds: favoriteProductIds,
        watchedProducts: getProductsByIds(favoriteProductIds),
      };
    }

    throw error;
  }
}

export async function getClosetPageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      viewer: fallbackViewer(),
      currentUser: getUserById(currentUserId) ?? null,
      closetItems: getProductsByIds(currentUserClosetIds),
      trades: fallbackTrades,
      purchases: [],
      purchaseOrders: [],
      salesOrders: [],
      notifications: [],
    };
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    if (!viewerProfile) {
      return {
        viewer: null,
        currentUser: null,
        closetItems: [],
        trades: [],
        purchases: [],
        purchaseOrders: [],
        salesOrders: [],
        notifications: [],
      };
    }

    const [closetItems, trades, purchases, purchaseOrders, salesOrders, notifications] = await Promise.all([
      getProductsByFilter({
        sellerProfileId: viewerProfile.profileId,
        includeSold: true,
        includeNonMarketplace: true,
      }),
      getTradesForViewer(viewerProfile),
      getProductsByFilter({
        buyerProfileId: viewerProfile.profileId,
        includeSold: true,
        includeNonMarketplace: true,
      }),
      getPurchaseOrdersForBuyer(viewerProfile.profileId),
      getPurchaseOrdersForSeller(viewerProfile.profileId),
      getNotificationsForProfile(viewerProfile.profileId),
    ]);

    return {
      viewer: toViewer(viewerProfile),
      currentUser: viewerProfile,
      closetItems,
      trades,
      purchases,
      purchaseOrders,
      salesOrders,
      notifications,
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        viewer: null,
        currentUser: null,
        closetItems: [],
        trades: [],
        purchases: [],
        purchaseOrders: [],
        salesOrders: [],
        notifications: [],
      };
    }

    throw error;
  }
}

async function getPurchaseOrdersForBuyer(profileId: string): Promise<PurchaseOrder[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, product_id, buyer_profile_id, seller_profile_id, status, amount, currency, platform_fee, checkout_session_id, payment_intent_id, label_due_at, shipping_label_url, shipping_label_uploaded_at, created_at, updated_at",
    )
    .eq("buyer_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PurchaseOrderRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    buyerProfileId: row.buyer_profile_id,
    sellerProfileId: row.seller_profile_id,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    platformFee: row.platform_fee,
    checkoutSessionId: row.checkout_session_id ?? undefined,
    paymentIntentId: row.payment_intent_id ?? undefined,
    labelDueAt: row.label_due_at ?? undefined,
    shippingLabelUrl: row.shipping_label_url ?? undefined,
    shippingLabelUploadedAt: row.shipping_label_uploaded_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function getPurchaseOrdersForSeller(profileId: string): Promise<PurchaseOrder[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      "id, product_id, buyer_profile_id, seller_profile_id, status, amount, currency, platform_fee, checkout_session_id, payment_intent_id, label_due_at, shipping_label_url, shipping_label_uploaded_at, created_at, updated_at",
    )
    .eq("seller_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PurchaseOrderRow[]).map((row) => ({
    id: row.id,
    productId: row.product_id,
    buyerProfileId: row.buyer_profile_id,
    sellerProfileId: row.seller_profile_id,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    platformFee: row.platform_fee,
    checkoutSessionId: row.checkout_session_id ?? undefined,
    paymentIntentId: row.payment_intent_id ?? undefined,
    labelDueAt: row.label_due_at ?? undefined,
    shippingLabelUrl: row.shipping_label_url ?? undefined,
    shippingLabelUploadedAt: row.shipping_label_uploaded_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function getNotificationsForProfile(profileId: string): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, profile_id, type, purchase_order_id, product_id, message, read_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    type: row.type,
    purchaseOrderId: row.purchase_order_id ?? undefined,
    productId: row.product_id ?? undefined,
    message: row.message,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getMessagesPageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      viewer: fallbackViewer(),
      conversations: fallbackConversations,
    };
  }

  const viewerProfile = await getSupabaseViewerProfile();
  if (!viewerProfile) {
    return { viewer: null, conversations: [] };
  }

  const liveConversations = await getConversationsForViewer(viewerProfile);

  // No real conversations yet — surface demo data so the UI is testable
  if (liveConversations.length === 0) {
    return {
      viewer: toViewer(viewerProfile),
      conversations: fallbackConversations,
      usingFallbackConversations: true,
    };
  }

  return {
    viewer: toViewer(viewerProfile),
    conversations: liveConversations,
  };
}

export async function getTradesPageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      viewer: fallbackViewer(),
      trades: fallbackTrades,
    };
  }

  const viewerProfile = await getSupabaseViewerProfile();
  if (!viewerProfile) {
    return { viewer: null, trades: [] };
  }

  return {
    viewer: toViewer(viewerProfile),
    trades: await getTradesForViewer(viewerProfile),
  };
}

export async function getPublicProfileBySlug(userSlug: string) {
  if (shouldUseFallbackMarketplaceData()) {
    return getUserById(userSlug) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("slug", userSlug).maybeSingle();
    if (error) throw error;
    // Not found in DB — try demo users (covers fallback conversation participants)
    return data ? mapProfile(data as ProfileRow) : (getUserById(userSlug) ?? null);
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return getUserById(userSlug) ?? null;
    }

    throw error;
  }
}

export async function getProfilesBySlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  if (uniqueSlugs.length === 0) return [];

  if (shouldUseFallbackMarketplaceData()) {
    return uniqueSlugs.map((slug) => getUserById(slug)).filter(Boolean) as UserProfile[];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("*").in("slug", uniqueSlugs);
    if (error) throw error;

    const found = new Map<string, UserProfile>();
    for (const row of (data ?? []) as ProfileRow[]) {
      const profile = mapProfile(row);
      found.set(profile.slug, profile);
    }

    return uniqueSlugs
      .map((slug) => found.get(slug) ?? getUserById(slug) ?? null)
      .filter(Boolean) as UserProfile[];
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return uniqueSlugs.map((slug) => getUserById(slug)).filter(Boolean) as UserProfile[];
    }

    throw error;
  }
}

export async function getPublicProfilePageData(userSlug: string) {
  if (shouldUseFallbackMarketplaceData()) {
    const user = getUserById(userSlug);
    if (!user) return null;
    return {
      user,
      listingProducts: getProductsByIds(userClosetListingIds[userSlug] ?? []),
    };
  }

  try {
    const user = await getPublicProfileBySlug(userSlug);
    if (!user) return null;

    return {
      user,
      listingProducts: await getProductsByFilter({ sellerProfileId: user.profileId, includeSold: true }),
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      const user = getUserById(userSlug);
      if (!user) return null;
      return {
        user,
        listingProducts: getProductsByIds(userClosetListingIds[userSlug] ?? []),
      };
    }

    throw error;
  }
}

export async function getAdminDashboardData() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const viewerProfile = await getSupabaseViewerProfile();
  if (!viewerProfile?.isAdmin) {
    return null;
  }

  const products = await getProductsByFilter({ includeNonMarketplace: true, includeSold: true });
  return {
    viewer: toViewer(viewerProfile),
    products,
  };
}
