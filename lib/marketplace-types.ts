export type UserProfile = {
  profileId: string;
  id: string;
  email: string;
  name: string;
  handle: string;
  initials: string;
  location: string;
  memberSince: string;
  rating: number;
  reviews: number;
  completedTrades: number;
  responseRate: string;
  bio: string;
  avatarSeed: string;
  points?: number;
  online?: boolean;
  isAdmin?: boolean;
  stripeAccountId?: string;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
};

export type ModerationStatus = "pending" | "approved" | "denied" | "flagged" | "needs_info";
export type VerificationStatus = "unverified" | "verified" | "failed" | "needs_review";

export type Product = {
  id: number;
  slug: string;
  brand: string;
  title: string;
  subtitle: string;
  category: string;
  size: string;
  condition: string;
  location: string;
  price: number;
  originalPrice?: number;
  sellerId: string;
  sellerProfileId?: string;
  listingTime: string;
  badge?: string;
  color: string;
  images: string[];
  description: string[];
  details: Array<{ label: string; value: string }>;
  sourceName: string;
  sourceUrl: string;
  moderationStatus: ModerationStatus;
  moderationNote?: string;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  createdAt?: string;
  soldAt?: string;
  soldToProfileId?: string;
  archivePieceId?: number;
};

export type BrandDirectoryEntry = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
};

export type ArchiveSeasonKind = "SS" | "FW" | "PRE" | "CRUISE" | "UNKNOWN";

export type ArchivePiece = {
  id: number;
  brandId: number;
  brandSlug: string;
  brand: string;
  slug: string;
  title: string;
  seasonKind: ArchiveSeasonKind;
  seasonYear?: number;
  seasonLabel: string;
  collection?: string;
  category?: string;
  color?: string;
  coverImageUrl?: string;
  description: string[];
  details: Array<{ label: string; value: string }>;
  listingCount: number;
};

export type ArchiveSeasonFilter = {
  key: string;
  label: string;
  count: number;
  seasonKind: ArchiveSeasonKind;
  seasonYear?: number;
};

export type ArchiveBrandEntry = {
  brand: BrandDirectoryEntry;
  pieceCount: number;
  yearMin: number | null;
  yearMax: number | null;
  seasons: ArchiveSeasonFilter[];
};

export type ConversationMessage = {
  id: number;
  sender: "me" | "other";
  text: string;
  timestamp: string;
  product?: {
    id: number;
    imageUrl: string;
  };
};

export type Conversation = {
  id: number;
  userId: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  online: boolean;
  messages: ConversationMessage[];
};

export type TradeProposal = {
  id: number;
  type: "received" | "sent";
  status: "pending" | "accepted" | "declined";
  userId: string;
  yourItemIds: number[];
  theirItemIds: number[];
  yourCash?: number;
  theirCash?: number;
  message: string;
  timestamp: string;
};

export type HeroSlide = {
  id: number;
  image: string;
  subtitle: string;
  title: string;
  ctaHref: string;
};

export type MarketplaceStats = {
  activeListings: number;
  coreBrands: number;
  averageAsk: number;
};

export type Viewer = {
  profileId: string;
  slug: string;
  email: string;
  handle: string;
  initials: string;
  avatarSeed: string;
  name: string;
  isAdmin: boolean;
  points?: number;
};

export type PurchaseOrderStatus =
  | "pending_checkout"
  | "awaiting_label"
  | "label_submitted"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export type PurchaseOrder = {
  id: string;
  productId: number;
  buyerProfileId: string;
  sellerProfileId: string;
  status: PurchaseOrderStatus;
  amount: number;
  currency: string;
  platformFee: number;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  labelDueAt?: string;
  shippingLabelUrl?: string;
  shippingLabelUploadedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType = "sale_created" | "label_submitted";

export type Notification = {
  id: string;
  profileId: string;
  type: NotificationType;
  purchaseOrderId?: string;
  productId?: number;
  message: string;
  readAt?: string;
  createdAt: string;
};
