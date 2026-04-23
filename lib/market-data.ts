import type {
  BrandDirectoryEntry,
  Conversation,
  HeroSlide,
  Product,
  TradeProposal,
  UserProfile,
} from "@/lib/marketplace-types";

export const currentUserId = "tsuki911";

export const users: UserProfile[] = [
  {
    profileId: "11111111-1111-4111-8111-111111111111",
    id: currentUserId,
    email: "tsuki@barter.demo",
    name: "Tsuki N.",
    handle: "@tsuki911",
    initials: "TN",
    location: "Los Angeles, CA",
    memberSince: "January 2024",
    rating: 4.9,
    reviews: 118,
    completedTrades: 24,
    responseRate: "98%",
    bio: "Trading archive streetwear, runway footwear, and hard-to-find graphic pieces.",
    avatarSeed: currentUserId,
  },
  {
    profileId: "22222222-2222-4222-8222-222222222222",
    id: "alex-rivera",
    email: "alex@barter.demo",
    name: "Alex Rivera",
    handle: "@alexrivera",
    initials: "AR",
    location: "New York, NY",
    memberSince: "May 2023",
    rating: 4.8,
    reviews: 67,
    completedTrades: 14,
    responseRate: "96%",
    bio: "Mostly Chrome Hearts and jewelry-adjacent streetwear. Fast shipper, open to fair swaps.",
    avatarSeed: "alex-rivera",
    online: true,
  },
  {
    profileId: "33333333-3333-4333-8333-333333333333",
    id: "marcus-vale",
    email: "marcus@barter.demo",
    name: "Marcus Vale",
    handle: "@marcusvale",
    initials: "MV",
    location: "Miami, FL",
    memberSince: "September 2022",
    rating: 5,
    reviews: 142,
    completedTrades: 31,
    responseRate: "99%",
    bio: "Into oversized sneakers, tailoring, and runway outerwear. Looking for clean-condition pairs.",
    avatarSeed: "marcus-vale",
    online: false,
  },
  {
    profileId: "44444444-4444-4444-8444-444444444444",
    id: "sarah-kim",
    email: "sarah@barter.demo",
    name: "Sarah Kim",
    handle: "@sarahkim",
    initials: "SK",
    location: "Chicago, IL",
    memberSince: "March 2024",
    rating: 4.7,
    reviews: 53,
    completedTrades: 11,
    responseRate: "95%",
    bio: "Collecting Maison Margiela and ERD staples with a focus on black and washed neutrals.",
    avatarSeed: "sarah-kim",
    online: true,
  },
];

export const products: Product[] = [
  {
    id: 1,
    slug: "chrome-hearts-paris-exclusive-pullover-graphic-print-hoodie",
    brand: "Chrome Hearts",
    title: "Paris Exclusive Pullover Graphic Print Hoodie",
    subtitle: "Authenticated resale listing with double-sided graphic print.",
    category: "Sweatshirts & Hoodies",
    size: "L",
    condition: "Excellent",
    location: "New York, NY",
    price: 2895,
    originalPrice: 3400,
    sellerId: "alex-rivera",
    listingTime: "37 minutes ago",
    badge: "AUTHENTICATED",
    color: "Black",
    images: [
      "/products/chrome-hearts-hoodie-1.jpg",
      "/products/chrome-hearts-hoodie-2.jpg",
    ],
    description: [
      "Hard-to-find Chrome Hearts pullover with Paris-exclusive graphic placement and heavyweight fleece body.",
      "Excellent pre-owned condition with clean cuffs, no cracking on the front print, and no notable stains.",
    ],
    details: [
      { label: "Category", value: "Sweatshirts & Hoodies" },
      { label: "Color", value: "Black" },
      { label: "Condition", value: "Excellent" },
      { label: "Fit", value: "Boxy" },
    ],
    sourceName: "The RealReal",
    sourceUrl:
      "https://www.therealreal.com/products/men/clothing/sweatshirts-and-hoodies/chrome-hearts-paris-exclusive-pullover-graphic-print-hoodie-f7war",
  },
  {
    id: 2,
    slug: "supreme-mike-kelley-zip-up-hooded-sweatshirt",
    brand: "Supreme",
    title: "Supreme/Mike Kelley Zip Up Hooded Sweatshirt",
    subtitle: "SS26 release with full-zip closure and Mike Kelley artwork.",
    category: "Sweatshirts & Hoodies",
    size: "M",
    condition: "Like New",
    location: "Los Angeles, CA",
    price: 355,
    originalPrice: 228,
    sellerId: currentUserId,
    listingTime: "1 hour ago",
    color: "Multicolor",
    images: [
      "/products/supreme-mike-kelley-hoodie-1.jpg",
      "/products/supreme-mike-kelley-hoodie-1.jpg",
    ],
    description: [
      "Seasonal Supreme zip-up featuring Mike Kelley artwork, embroidered chest logo, and brushed-back fleece.",
      "Like new condition with no fading, no pulls around the zipper tape, and a crisp hood shape.",
    ],
    details: [
      { label: "Category", value: "Sweatshirts & Hoodies" },
      { label: "Color", value: "Multicolor" },
      { label: "Condition", value: "Like New" },
      { label: "Season", value: "SS26" },
    ],
    sourceName: "Supreme",
    sourceUrl: "https://us.supreme.com/products/wfwbt-ifnbadrko1",
  },
  {
    id: 3,
    slug: "balenciaga-triple-s-2-sneaker",
    brand: "Balenciaga",
    title: "Triple S.2 Sneaker",
    subtitle: "Current Triple S refresh with layered sole and oversized proportions.",
    category: "Shoes",
    size: "43",
    condition: "New with Box",
    location: "Miami, FL",
    price: 1090,
    sellerId: "marcus-vale",
    listingTime: "2 hours ago",
    badge: "NEW",
    color: "Black / Dark Grey",
    images: [
      "/products/balenciaga-triple-s-1.jpg",
      "/products/balenciaga-triple-s-1.jpg",
    ],
    description: [
      "Latest Triple S.2 in black and dark grey with the updated aerodynamic upper and stacked outsole.",
      "Brand-new pair stored with box and dust bags. Great trade target for other designer footwear.",
    ],
    details: [
      { label: "Category", value: "Shoes" },
      { label: "Color", value: "Black / Dark Grey" },
      { label: "Condition", value: "New with Box" },
      { label: "Style", value: "Chunky Runner" },
    ],
    sourceName: "Balenciaga",
    sourceUrl:
      "https://www.balenciaga.com/en-us/triple-s.2-sneaker-black-dark-grey-865849WTRS21011.html",
  },
  {
    id: 4,
    slug: "maison-margiela-tabi-loafers",
    brand: "Maison Margiela",
    title: "Tabi Loafers",
    subtitle: "Brushed leather Tabi split-toe loafers from the permanent line.",
    category: "Shoes",
    size: "42",
    condition: "Very Good",
    location: "Los Angeles, CA",
    price: 1220,
    sellerId: currentUserId,
    listingTime: "4 hours ago",
    color: "Black",
    images: [
      "/products/maison-margiela-tabi-1.jpg",
      "/products/maison-margiela-tabi-2.jpg",
    ],
    description: [
      "Maison Margiela brushed leather Tabi loafers with signature split toe and white stitch detail at the heel.",
      "Very good condition with light sole wear and clean uppers. Includes dust bags.",
    ],
    details: [
      { label: "Category", value: "Shoes" },
      { label: "Color", value: "Black" },
      { label: "Condition", value: "Very Good" },
      { label: "Material", value: "Brushed calf leather" },
    ],
    sourceName: "Maison Margiela",
    sourceUrl:
      "https://www.maisonmargiela.com/en-us/tabi-loafers-S58WR0035PS679T8013.html",
  },
  {
    id: 5,
    slug: "enfants-riches-deprimes-adolf-loos-t-shirt",
    brand: "Enfants Riches Deprimes",
    title: "Adolf Loos T-Shirt",
    subtitle: "Washed black ERD tee with distressed graphic treatment.",
    category: "T-Shirts",
    size: "L",
    condition: "Excellent",
    location: "Los Angeles, CA",
    price: 960,
    sellerId: currentUserId,
    listingTime: "6 hours ago",
    color: "Washed Black",
    images: [
      "/products/erd-adolf-loos-1.png",
      "/products/erd-adolf-loos-2.jpg",
      "/products/erd-adolf-loos-3.jpg",
    ],
    description: [
      "ERD Adolf Loos tee in washed black with distressed finish and soft, broken-in hand feel.",
      "Excellent condition with intentional distressing intact and no additional flaws beyond the factory wash.",
    ],
    details: [
      { label: "Category", value: "T-Shirts" },
      { label: "Color", value: "Washed Black" },
      { label: "Condition", value: "Excellent" },
      { label: "Material", value: "Cotton jersey" },
    ],
    sourceName: "Enfants Riches Deprimes",
    sourceUrl: "https://enfantsrichesdeprimes.com/products/adolf-loos-t-shirt",
  },
];

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: products[1].images[0],
    subtitle: "REAL PRODUCT PAGES, RESALE-READY LISTINGS",
    title: "Supreme Archive Heat",
    ctaHref: "/brands/supreme",
  },
  {
    id: 2,
    image: products[0].images[0],
    subtitle: "CHROME HEARTS, BALENCIAGA, MARGIELA + MORE",
    title: "Luxury Trades Only",
    ctaHref: "/brands/chrome-hearts",
  },
  {
    id: 3,
    image: products[4].images[0],
    subtitle: "CURATED PIECES FROM ERD TO RUNWAY FOOTWEAR",
    title: "Daily Picks For You",
    ctaHref: "/brands/enfants-riches-deprimes",
  },
];

export const featuredProductIds = [2, 1, 3, 4, 5];
export const currentUserClosetIds = [2, 4, 5];
export const favoriteProductIds = [1, 3, 5];
export const userClosetListingIds: Record<string, number[]> = {
  [currentUserId]: [2, 4, 5],
  "alex-rivera": [1, 2],
  "marcus-vale": [3, 4],
  "sarah-kim": [5, 4],
};

export const conversations: Conversation[] = [
  {
    id: 1,
    userId: "alex-rivera",
    lastMessage: "Would you trade the Mike Kelley zip-up toward my Chrome Hearts hoodie?",
    timestamp: "2m ago",
    unread: true,
    online: true,
    messages: [
      { id: 1, sender: "other", text: "Hey, I saw your Supreme zip-up.", timestamp: "10:32 AM" },
      { id: 2, sender: "me", text: "Still available if the offer is right.", timestamp: "10:34 AM" },
      { id: 3, sender: "other", text: "Would you trade it toward my Chrome Hearts hoodie?", timestamp: "10:36 AM" },
    ],
  },
  {
    id: 2,
    userId: "marcus-vale",
    lastMessage: "The Triple S pair is DS with box and dust bags.",
    timestamp: "1h ago",
    unread: false,
    online: false,
    messages: [
      { id: 1, sender: "other", text: "Interested in a Margiela-for-Balenciaga trade?", timestamp: "Yesterday" },
      { id: 2, sender: "me", text: "Potentially. How clean is the pair?", timestamp: "Yesterday" },
      { id: 3, sender: "other", text: "The Triple S pair is DS with box and dust bags.", timestamp: "Today" },
    ],
  },
  {
    id: 3,
    userId: "sarah-kim",
    lastMessage: "That ERD tee is exactly my size.",
    timestamp: "3h ago",
    unread: true,
    online: true,
    messages: [
      { id: 1, sender: "other", text: "That ERD tee is exactly my size.", timestamp: "8:14 AM" },
      { id: 2, sender: "me", text: "I can trade or sell depending on your offer.", timestamp: "8:18 AM" },
    ],
  },
];

export const tradeProposals: TradeProposal[] = [
  {
    id: 1,
    type: "received",
    status: "pending",
    userId: "alex-rivera",
    yourItemIds: [2],
    theirItemIds: [1],
    yourCash: 150,
    message: "Chrome Hearts plus cash for the Supreme zip-up?",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "received",
    status: "pending",
    userId: "marcus-vale",
    yourItemIds: [4],
    theirItemIds: [3],
    theirCash: 125,
    message: "Happy to add cash if you want to swap the Tabi loafers for the Triple S pair.",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "sent",
    status: "accepted",
    userId: "sarah-kim",
    yourItemIds: [5],
    theirItemIds: [4],
    message: "Sent a straight swap request for your spare Tabi pair.",
    timestamp: "1 day ago",
  },
];

export function getUserById(userId: string) {
  return users.find((user) => user.id === userId);
}

export function getProductById(id: number | string) {
  const numericId = Number(id);
  return products.find((product) => product.id === numericId);
}

export function getProductsByIds(ids: number[]) {
  return ids.map((id) => getProductById(id)).filter(Boolean) as Product[];
}

export function slugifyBrand(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const brandDirectory: BrandDirectoryEntry[] = [
  {
    slug: "chrome-hearts",
    name: "Chrome Hearts",
    tagline: "Authenticated graphic-heavy luxury staples.",
    description:
      "Rare hoodies, jewelry-adjacent streetwear, and hard-to-find exclusives sourced from trusted resale and archive references.",
  },
  {
    slug: "supreme",
    name: "Supreme",
    tagline: "Seasonal archive and artist-collab streetwear.",
    description:
      "A tighter feed of contemporary Supreme pieces, graphics, and limited releases suited for trade-up deals.",
  },
  {
    slug: "balenciaga",
    name: "Balenciaga",
    tagline: "Runway sneakers and statement silhouettes.",
    description:
      "Oversized footwear, layered proportions, and current-season statement pieces with strong trade value.",
  },
  {
    slug: "maison-margiela",
    name: "Maison Margiela",
    tagline: "Quiet luxury with instantly recognizable signatures.",
    description:
      "Tabi footwear and directional essentials for users trading into refined archive pieces.",
  },
  {
    slug: "enfants-riches-deprimes",
    name: "Enfants Riches Deprimes",
    tagline: "Washed graphics and high-end punk references.",
    description:
      "A focused rack of ERD tees and collectible runway-adjacent tops for niche buyers and watchers.",
  },
];

export function getBrandBySlug(slug: string) {
  return brandDirectory.find((brand) => brand.slug === slug);
}

export function getProductsByBrandSlug(slug: string) {
  return products.filter((product) => slugifyBrand(product.brand) === slug);
}
