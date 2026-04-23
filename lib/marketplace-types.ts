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
  online?: boolean;
};

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
  listingTime: string;
  badge?: string;
  color: string;
  images: string[];
  description: string[];
  details: Array<{ label: string; value: string }>;
  sourceName: string;
  sourceUrl: string;
};

export type BrandDirectoryEntry = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
};

export type ConversationMessage = {
  id: number;
  sender: "me" | "other";
  text: string;
  timestamp: string;
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
};
