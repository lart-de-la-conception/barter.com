import { redirect } from "next/navigation";
import {
  conversations as fallbackConversations,
  currentUserClosetIds,
  currentUserId,
  favoriteProductIds,
  featuredProductIds,
  getBrandBySlug,
  getProductById,
  getProductsByBrandSlug,
  getProductsByIds,
  getUserById,
  heroSlides as fallbackHeroSlides,
  products as fallbackProducts,
  tradeProposals as fallbackTrades,
  userClosetListingIds,
} from "@/lib/market-data";
import type {
  Conversation,
  HeroSlide,
  MarketplaceStats,
  Product,
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
};

type ProductRow = {
  id: number;
  slug: string;
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
    listingTime: row.listing_time,
    badge: row.badge ?? undefined,
    color: row.color,
    images: imagesByProductId.get(row.id) ?? [],
    description: row.description,
    details: row.detail_items,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
  })) satisfies Product[];
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

async function getProductsByFilter(filters?: {
  ids?: number[];
  brandSlug?: string;
  sellerProfileId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select("*").order("id");

  if (filters?.ids?.length) query = query.in("id", filters.ids);
  if (filters?.brandSlug) query = query.eq("brand_slug", filters.brandSlug);
  if (filters?.sellerProfileId) query = query.eq("seller_profile_id", filters.sellerProfileId);

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
  return mapProducts(productRows, (imageResponse.data ?? []) as ProductImageRow[], profiles);
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
      .select("id, conversation_id, sender_profile_id, body, display_timestamp")
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

export async function getHomePageData() {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      heroSlides: fallbackHeroSlides,
      featuredProducts: getProductsByIds(featuredProductIds),
      stats: makeStats(fallbackProducts),
    };
  }

  try {
    const featuredProducts = await getProductsByFilter({ ids: featuredProductIds });
    const allProducts = await getProductsByFilter();
    return {
      heroSlides: featuredProducts.slice(0, 3).map((product, index) => ({
        id: index + 1,
        image: product.images[0] ?? "",
        subtitle: fallbackHeroSlides[index]?.subtitle ?? product.brand.toUpperCase(),
        title: fallbackHeroSlides[index]?.title ?? product.title,
        ctaHref: fallbackHeroSlides[index]?.ctaHref ?? "/products",
      })) satisfies HeroSlide[],
      featuredProducts,
      stats: makeStats(allProducts),
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        heroSlides: fallbackHeroSlides,
        featuredProducts: getProductsByIds(featuredProductIds),
        stats: makeStats(fallbackProducts),
      };
    }

    throw error;
  }
}

export async function getCatalogPageData({
  searchQuery = "",
  brandSlug,
}: {
  searchQuery?: string;
  brandSlug?: string;
}) {
  if (shouldUseFallbackMarketplaceData()) {
    return {
      brand: brandSlug ? getBrandBySlug(brandSlug) : undefined,
      products: brandSlug ? getProductsByBrandSlug(brandSlug) : fallbackProducts,
      searchQuery,
      viewer: fallbackViewer(),
      initialFavoriteIds: favoriteProductIds,
    };
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    return {
      brand: brandSlug ? getBrandBySlug(brandSlug) : undefined,
      products: await getProductsByFilter({ brandSlug }),
      searchQuery,
      viewer: viewerProfile ? toViewer(viewerProfile) : null,
      initialFavoriteIds: viewerProfile ? await getFavoriteIds(viewerProfile.profileId) : [],
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        brand: brandSlug ? getBrandBySlug(brandSlug) : undefined,
        products: brandSlug ? getProductsByBrandSlug(brandSlug) : fallbackProducts,
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
      similar: fallbackProducts.filter((item) => item.id !== product.id).slice(0, 4),
      viewer: fallbackViewer(),
      initialFavoriteIds: favoriteProductIds,
    };
  }

  try {
    const viewerProfile = await getSupabaseViewerProfile();
    const products = await getProductsByFilter();
    const product = products.find((item) => item.id === productId);
    if (!product) return null;

    return {
      product,
      seller: await getPublicProfileBySlug(product.sellerId),
      currentCloset: viewerProfile ? await getProductsByFilter({ sellerProfileId: viewerProfile.profileId }) : [],
      similar: products.filter((item) => item.id !== product.id).slice(0, 4),
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
        similar: fallbackProducts.filter((item) => item.id !== product.id).slice(0, 4),
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
      watchedProducts: favoriteIds.length ? await getProductsByFilter({ ids: favoriteIds }) : [],
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
      };
    }

    return {
      viewer: toViewer(viewerProfile),
      currentUser: viewerProfile,
      closetItems: await getProductsByFilter({ sellerProfileId: viewerProfile.profileId }),
      trades: await getTradesForViewer(viewerProfile),
    };
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return {
        viewer: null,
        currentUser: null,
        closetItems: [],
        trades: [],
      };
    }

    throw error;
  }
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

  return {
    viewer: toViewer(viewerProfile),
    conversations: await getConversationsForViewer(viewerProfile),
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
    return data ? mapProfile(data as ProfileRow) : null;
  } catch (error) {
    if (isRecoverableSupabaseError(error)) {
      return getUserById(userSlug) ?? null;
    }

    throw error;
  }
}

export async function getProfilesBySlugs(slugs: string[]) {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  const profiles = await Promise.all(uniqueSlugs.map((slug) => getPublicProfileBySlug(slug)));
  return profiles.filter(Boolean) as UserProfile[];
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
      listingProducts: await getProductsByFilter({ sellerProfileId: user.profileId }),
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
