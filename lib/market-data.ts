import type {
  ArchivePiece,
  ArchiveSeasonKind,
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
    points: 1847,
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
    points: 2340,
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
    points: 5120,
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
    points: 680,
    online: true,
  },
  {
    profileId: "55555555-5555-4555-8555-555555555555",
    id: "james-okafor",
    email: "james@barter.demo",
    name: "James Okafor",
    handle: "@jamesokafor",
    initials: "JO",
    location: "London, UK",
    memberSince: "January 2025",
    rating: 4.9,
    reviews: 28,
    completedTrades: 7,
    responseRate: "100%",
    bio: "Deep into Raf Simons archival pieces and early UNDERCOVER. Always looking for SS01–FW03 season runs.",
    avatarSeed: "james-okafor",
    points: 3120,
    online: true,
  },
];

const productSeed: Array<Omit<Product, "moderationStatus" | "verificationStatus">> = [
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

const testProductTemplates = [
  { brand: "Chrome Hearts", title: "Matty Boy Script Thermal", category: "Longsleeves", size: "L", condition: "Very Good", price: 680, originalPrice: 890, color: "Black", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Chrome Hearts", title: "Horseshoe Cemetery Hoodie", category: "Sweatshirts & Hoodies", size: "XL", condition: "Excellent", price: 1420, originalPrice: 1700, color: "Washed Black", images: ["/products/chrome-hearts-hoodie-2.jpg", "/products/chrome-hearts-hoodie-1.jpg"] },
  { brand: "Chrome Hearts", title: "Scroll Logo Pocket Tee", category: "T-Shirts", size: "M", condition: "Good", price: 410, originalPrice: 520, color: "White", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Chrome Hearts", title: "Cross Patch Zip Hoodie", category: "Sweatshirts & Hoodies", size: "L", condition: "Excellent", price: 2380, originalPrice: 2800, color: "Black", images: ["/products/chrome-hearts-hoodie-2.jpg", "/products/chrome-hearts-hoodie-1.jpg"] },
  { brand: "Chrome Hearts", title: "Thermal Lined Work Jacket", category: "Outerwear", size: "M", condition: "Like New", price: 3250, originalPrice: 3600, color: "Charcoal", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Supreme", title: "Box Logo Hooded Sweatshirt", category: "Sweatshirts & Hoodies", size: "M", condition: "Excellent", price: 610, originalPrice: 698, color: "Ash Grey", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Supreme", title: "Gonz Poems Chore Coat", category: "Outerwear", size: "L", condition: "Very Good", price: 430, originalPrice: 548, color: "Navy", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Supreme", title: "Arabic Logo Soccer Jersey", category: "T-Shirts", size: "M", condition: "Like New", price: 225, originalPrice: 158, color: "Red", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Supreme", title: "Leather Collar Work Shirt", category: "Shirts", size: "XL", condition: "Good", price: 190, originalPrice: 228, color: "Brown Plaid", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Supreme", title: "Motion Logo Varsity Jacket", category: "Outerwear", size: "L", condition: "Excellent", price: 860, originalPrice: 998, color: "Black", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Balenciaga", title: "Runner Sneaker", category: "Shoes", size: "42", condition: "Like New", price: 720, originalPrice: 1090, color: "White / Silver", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Balenciaga", title: "Destroyed Skater Hoodie", category: "Sweatshirts & Hoodies", size: "M", condition: "Very Good", price: 1180, originalPrice: 1550, color: "Faded Black", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Balenciaga", title: "Political Campaign Tee", category: "T-Shirts", size: "L", condition: "Excellent", price: 320, originalPrice: 495, color: "Black / White", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Balenciaga", title: "Wide Leg Cargo Trouser", category: "Pants", size: "32", condition: "Good", price: 690, originalPrice: 1190, color: "Olive", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Balenciaga", title: "Unity Sports Icon Cap", category: "Accessories", size: "One Size", condition: "Like New", price: 210, originalPrice: 350, color: "Black", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Maison Margiela", title: "Replica German Army Trainer", category: "Shoes", size: "43", condition: "Very Good", price: 390, originalPrice: 610, color: "White / Grey", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Maison Margiela", title: "Tabi Ankle Boot", category: "Shoes", size: "41", condition: "Excellent", price: 980, originalPrice: 1320, color: "Black", images: ["/products/maison-margiela-tabi-2.jpg", "/products/maison-margiela-tabi-1.jpg"] },
  { brand: "Maison Margiela", title: "Four Stitch Cardigan", category: "Sweaters", size: "M", condition: "Like New", price: 610, originalPrice: 930, color: "Oatmeal", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Maison Margiela", title: "Paint Splatter Denim Jacket", category: "Outerwear", size: "L", condition: "Good", price: 760, originalPrice: 1180, color: "Indigo", images: ["/products/maison-margiela-tabi-2.jpg", "/products/maison-margiela-tabi-1.jpg"] },
  { brand: "Maison Margiela", title: "Numbers Logo Ring", category: "Accessories", size: "M", condition: "Very Good", price: 260, originalPrice: 390, color: "Silver", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Enfants Riches Deprimes", title: "Hand Distressed Logo Tee", category: "T-Shirts", size: "M", condition: "Excellent", price: 740, originalPrice: 920, color: "Washed Black", images: ["/products/erd-adolf-loos-1.png", "/products/erd-adolf-loos-2.jpg"] },
  { brand: "Enfants Riches Deprimes", title: "Cashmere Skull Cardigan", category: "Sweaters", size: "L", condition: "Like New", price: 1820, originalPrice: 2400, color: "Black / Cream", images: ["/products/erd-adolf-loos-2.jpg", "/products/erd-adolf-loos-3.jpg"] },
  { brand: "Enfants Riches Deprimes", title: "French Punk Work Jacket", category: "Outerwear", size: "M", condition: "Very Good", price: 1510, originalPrice: 1980, color: "Charcoal", images: ["/products/erd-adolf-loos-3.jpg", "/products/erd-adolf-loos-1.png"] },
  { brand: "Enfants Riches Deprimes", title: "Destroyed Flannel Shirt", category: "Shirts", size: "L", condition: "Good", price: 640, originalPrice: 840, color: "Red / Black", images: ["/products/erd-adolf-loos-1.png", "/products/erd-adolf-loos-3.jpg"] },
  { brand: "Enfants Riches Deprimes", title: "Opera Graphic Longsleeve", category: "Longsleeves", size: "XL", condition: "Excellent", price: 880, originalPrice: 1120, color: "Bone", images: ["/products/erd-adolf-loos-2.jpg", "/products/erd-adolf-loos-1.png"] },
  { brand: "Gucci", title: "Horsebit 1953 Loafer", category: "Shoes", size: "42", condition: "Very Good", price: 520, originalPrice: 990, color: "Black", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Gucci", title: "GG Jacquard Track Jacket", category: "Outerwear", size: "M", condition: "Excellent", price: 890, originalPrice: 1600, color: "Brown / Tan", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Gucci", title: "Web Stripe Knit Polo", category: "Shirts", size: "L", condition: "Like New", price: 410, originalPrice: 850, color: "Cream", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Gucci", title: "Interlocking G Belt Bag", category: "Bags", size: "One Size", condition: "Very Good", price: 680, originalPrice: 1250, color: "Black", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Gucci", title: "Washed Logo Sweatshirt", category: "Sweatshirts & Hoodies", size: "S", condition: "Good", price: 360, originalPrice: 980, color: "Heather Grey", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Louis Vuitton", title: "Monogram Denim Jacket", category: "Outerwear", size: "L", condition: "Excellent", price: 2450, originalPrice: 3300, color: "Indigo", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Louis Vuitton", title: "LV Trainer Sneaker", category: "Shoes", size: "43", condition: "Like New", price: 950, originalPrice: 1280, color: "White / Green", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Louis Vuitton", title: "Monogram Eclipse Keepall 45", category: "Bags", size: "One Size", condition: "Very Good", price: 1980, originalPrice: 2600, color: "Eclipse", images: ["/products/chrome-hearts-hoodie-2.jpg", "/products/chrome-hearts-hoodie-1.jpg"] },
  { brand: "Louis Vuitton", title: "Damier Crewneck Knit", category: "Sweaters", size: "M", condition: "Excellent", price: 1210, originalPrice: 1750, color: "Navy", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Louis Vuitton", title: "Virgil Era Chain Bracelet", category: "Accessories", size: "M", condition: "Good", price: 540, originalPrice: 790, color: "Silver", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Raf Simons", title: "Archive Redux Parka", category: "Outerwear", size: "L", condition: "Very Good", price: 1680, originalPrice: 2200, color: "Black", images: ["/products/erd-adolf-loos-3.jpg", "/products/erd-adolf-loos-2.jpg"] },
  { brand: "Raf Simons", title: "Sterling Ruby Graphic Tee", category: "T-Shirts", size: "M", condition: "Excellent", price: 520, originalPrice: 760, color: "White", images: ["/products/erd-adolf-loos-1.png", "/products/erd-adolf-loos-2.jpg"] },
  { brand: "Raf Simons", title: "Oversized Wool Coat", category: "Outerwear", size: "M", condition: "Like New", price: 1540, originalPrice: 2100, color: "Charcoal", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Raf Simons", title: "Consumed Cargo Trouser", category: "Pants", size: "32", condition: "Very Good", price: 720, originalPrice: 980, color: "Black", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Raf Simons", title: "Riot Patch Hoodie", category: "Sweatshirts & Hoodies", size: "XL", condition: "Good", price: 960, originalPrice: 1250, color: "Grey", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "UNDERCOVER", title: "Scab Print Tee", category: "T-Shirts", size: "L", condition: "Excellent", price: 430, originalPrice: 620, color: "Black", images: ["/products/erd-adolf-loos-2.jpg", "/products/erd-adolf-loos-1.png"] },
  { brand: "UNDERCOVER", title: "But Beautiful Hoodie", category: "Sweatshirts & Hoodies", size: "M", condition: "Very Good", price: 780, originalPrice: 1080, color: "Washed Grey", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "UNDERCOVER", title: "Witch Cell Division Coat", category: "Outerwear", size: "L", condition: "Like New", price: 1310, originalPrice: 1850, color: "Black", images: ["/products/chrome-hearts-hoodie-2.jpg", "/products/chrome-hearts-hoodie-1.jpg"] },
  { brand: "UNDERCOVER", title: "Gilapple Longsleeve", category: "Longsleeves", size: "M", condition: "Good", price: 360, originalPrice: 520, color: "White", images: ["/products/erd-adolf-loos-3.jpg", "/products/erd-adolf-loos-2.jpg"] },
  { brand: "UNDERCOVER", title: "Patchwork Denim Jacket", category: "Outerwear", size: "XL", condition: "Excellent", price: 910, originalPrice: 1240, color: "Indigo", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Hedi Slimane", title: "Dior Homme Waxed Biker", category: "Outerwear", size: "48", condition: "Very Good", price: 2200, originalPrice: 3100, color: "Black", images: ["/products/chrome-hearts-hoodie-1.jpg", "/products/chrome-hearts-hoodie-2.jpg"] },
  { brand: "Hedi Slimane", title: "Saint Laurent Teddy Jacket", category: "Outerwear", size: "50", condition: "Excellent", price: 1780, originalPrice: 2490, color: "Black / White", images: ["/products/supreme-mike-kelley-hoodie-1.jpg", "/products/supreme-mike-kelley-hoodie-1.jpg"] },
  { brand: "Hedi Slimane", title: "Celine Triomphe Trucker", category: "Outerwear", size: "M", condition: "Like New", price: 1280, originalPrice: 1900, color: "Blue Denim", images: ["/products/balenciaga-triple-s-1.jpg", "/products/balenciaga-triple-s-1.jpg"] },
  { brand: "Hedi Slimane", title: "Saint Laurent Skinny Denim", category: "Pants", size: "30", condition: "Good", price: 420, originalPrice: 790, color: "Black", images: ["/products/maison-margiela-tabi-1.jpg", "/products/maison-margiela-tabi-2.jpg"] },
  { brand: "Hedi Slimane", title: "Celine Canvas Triomphe Tote", category: "Bags", size: "One Size", condition: "Excellent", price: 1160, originalPrice: 1700, color: "Tan / Brown", images: ["/products/chrome-hearts-hoodie-2.jpg", "/products/chrome-hearts-hoodie-1.jpg"] },
] satisfies Array<
  Pick<Product, "brand" | "title" | "category" | "size" | "condition" | "price" | "originalPrice" | "color" | "images">
>;

const testSellers = ["alex-rivera", currentUserId, "marcus-vale", "sarah-kim", "james-okafor"];
const testLocations = ["New York, NY", "Los Angeles, CA", "Miami, FL", "Chicago, IL", "Atlanta, GA", "London, UK"];
const testBadges = ["AUTHENTICATED", "NEW", undefined, undefined];

const generatedTestProductSeed: Array<Omit<Product, "moderationStatus" | "verificationStatus">> =
  testProductTemplates.map((template, index) => ({
    id: index + 6,
    slug: `${slugifyBrand(template.brand)}-${slugifyBrand(template.title)}`,
    brand: template.brand,
    title: template.title,
    subtitle: `${template.condition} ${template.category.toLowerCase()} selected for test marketplace discovery.`,
    category: template.category,
    size: template.size,
    condition: template.condition,
    location: testLocations[index % testLocations.length],
    price: template.price,
    originalPrice: template.originalPrice,
    sellerId: testSellers[index % testSellers.length],
    listingTime: `${index + 1} ${index === 0 ? "minute" : "minutes"} ago`,
    badge: testBadges[index % testBadges.length],
    color: template.color,
    images: template.images,
    description: [
      `Test listing for ${template.title} by ${template.brand}, built to exercise search, filters, brand pages, and listing cards at scale.`,
      `Condition is marked ${template.condition.toLowerCase()} with a ${template.color.toLowerCase()} color story and reusable seeded imagery.`,
    ],
    details: [
      { label: "Category", value: template.category },
      { label: "Color", value: template.color },
      { label: "Condition", value: template.condition },
      { label: "Test batch", value: "Generated inventory" },
    ],
    sourceName: "Barter Test Inventory",
    sourceUrl: `https://barter.test/listings/${slugifyBrand(template.brand)}-${slugifyBrand(template.title)}`,
    createdAt: new Date(Date.UTC(2026, 4, 23, 12, index)).toISOString(),
  }));

export const products: Product[] = [...productSeed, ...generatedTestProductSeed].map((product, index) => ({
  ...product,
  moderationStatus: "approved",
  verificationStatus: index % 7 === 3 ? "needs_review" : "verified",
}));

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: products[0].images[0],
    subtitle: "CHROME HEARTS, BALENCIAGA, MARGIELA + MORE",
    title: "Luxury Trades Only",
    ctaHref: "/brands/chrome-hearts",
  },
  {
    id: 2,
    image: products[1].images[0],
    subtitle: "REAL PRODUCT PAGES, RESALE-READY LISTINGS",
    title: "Supreme Archive Heat",
    ctaHref: "/brands/supreme",
  },
  {
    id: 3,
    image: products[4].images[0],
    subtitle: "ENFANTS RICHES DÉPRIMÉS EDITS + ARCHIVE FINDS",
    title: "Enfants Riches Deprimes",
    ctaHref: "/brands/enfants-riches-deprimes",
  },
  {
    id: 4,
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
  "james-okafor": [1, 3],
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
  {
    id: 4,
    userId: "james-okafor",
    lastMessage: "Let me know if you'd consider a straight swap.",
    timestamp: "Just now",
    unread: true,
    online: true,
    messages: [
      { id: 1, sender: "other", text: "Hey — noticed you have the Raf Simons SS01 Consumed hoodie listed. Is that still available?", timestamp: "11:02 AM" },
      { id: 2, sender: "me", text: "Yeah it's still up. Been waiting for the right offer.", timestamp: "11:05 AM" },
      { id: 3, sender: "other", text: "I've been hunting that piece for about two years. What are you looking for in return?", timestamp: "11:06 AM" },
      { id: 4, sender: "me", text: "Ideally something from the same era. FW02 or SS03 Raf, or early UNDERCOVER. Open to cash offers too.", timestamp: "11:09 AM" },
      { id: 5, sender: "other", text: "I have an UNDERCOVER AW2002 Witch's Cell Division knit — the black and red intarsia one. Tagged XL but fits like a large.", timestamp: "11:11 AM" },
      { id: 6, sender: "me", text: "That's a serious piece. Do you have photos? Specifically want to check the collar and cuffs.", timestamp: "11:13 AM" },
      { id: 7, sender: "other", text: "Sending them over now. Collar is clean, cuffs have very minor pilling consistent with age. No holes, no fading.", timestamp: "11:15 AM" },
      { id: 8, sender: "me", text: "Looks good from what I can see. What condition would you grade it?", timestamp: "11:18 AM" },
      { id: 9, sender: "other", text: "I'd say Very Good. It's been worn maybe four or five times and stored flat. Let me know if you'd consider a straight swap.", timestamp: "11:20 AM" },
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
    message: "Chrome Hearts plus cash for the Supreme zip-up? Happy to negotiate on the cash component.",
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
  {
    id: 4,
    type: "received",
    status: "declined",
    userId: "sarah-kim",
    yourItemIds: [3],
    theirItemIds: [5],
    message: "Would you trade the Triple S for my ERD tee? Both deadstock.",
    timestamp: "3 days ago",
  },
  {
    id: 5,
    type: "sent",
    status: "pending",
    userId: "alex-rivera",
    yourItemIds: [1],
    theirItemIds: [2],
    yourCash: 50,
    message: "Chrome Hearts hoodie plus $50 cash — let me know if you want to make this work.",
    timestamp: "1 hour ago",
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
  {
    slug: "gucci",
    name: "Gucci",
    tagline: "Italian house codes, tailoring, and logo-led signatures.",
    description:
      "A polished edit of Gucci staples and collectible pieces for members looking across heritage luxury, runway accessories, and recognizable house motifs.",
  },
  {
    slug: "louis-vuitton",
    name: "Louis Vuitton",
    tagline: "Travel heritage, monogram icons, and luxury leather goods.",
    description:
      "A focused Louis Vuitton destination for monogram pieces, runway accessories, and high-signal luxury listings with strong archive appeal.",
  },
  {
    slug: "raf-simons",
    name: "Raf Simons",
    tagline: "Defining archive pieces from the Antwerp avant-garde.",
    description:
      "Rare youth-culture coats, skinny silhouettes, and text-print collectibles spanning two decades of Raf Simons runway and diffusion pieces.",
  },
  {
    slug: "undercover",
    name: "UNDERCOVER",
    tagline: "Jun Takahashi's subversive Tokyo-to-Paris label.",
    description:
      "Deconstructed outerwear, literary-print tees, and experimental knits from one of Japan's most consistently compelling archives.",
  },
  {
    slug: "hedi-slimane",
    name: "Hedi Slimane",
    tagline: "Rock silhouettes across Dior Homme, Saint Laurent, and Celine.",
    description:
      "Archival pieces tracing Hedi Slimane's defining eras — skinny suiting from Dior Homme, leather from Saint Laurent, and structured bags from Celine.",
  },
];

export function getBrandBySlug(slug: string) {
  return brandDirectory.find((brand) => brand.slug === slug);
}

export function getProductsByBrandSlug(slug: string) {
  return products.filter((product) => slugifyBrand(product.brand) === slug);
}

function normalizeArchiveTitle(title: string) {
  return title.trim().toLowerCase();
}

export function archivePieceSlugFromTitle(title: string) {
  return (
    normalizeArchiveTitle(title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "piece"
  );
}

// Deterministically assign a realistic season to a fallback archive piece so
// the year-slider UI has visible data in demo mode.
const DEMO_SEASONS: Array<{ kind: ArchiveSeasonKind; year: number; label: string }> = [
  { kind: "FW",     year: 2026, label: "FW '26" },
  { kind: "SS",     year: 2026, label: "SS '26" },
  { kind: "PRE",    year: 2026, label: "Pre-Fall '26" },
  { kind: "FW",     year: 2025, label: "FW '25" },
  { kind: "SS",     year: 2025, label: "SS '25" },
  { kind: "CRUISE", year: 2025, label: "Cruise '25" },
  { kind: "FW",     year: 2024, label: "FW '24" },
  { kind: "SS",     year: 2024, label: "SS '24" },
  { kind: "PRE",    year: 2024, label: "Pre-Fall '24" },
];

function assignDemoSeason(title: string, brandSlug: string) {
  const hash = [...title, ...brandSlug].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return DEMO_SEASONS[hash % DEMO_SEASONS.length]!;
}

function deriveCollection(category: string | undefined, title: string): string {
  const t = title.toLowerCase();
  const c = (category ?? "").toLowerCase();
  if (c.includes("shoe") || c.includes("boot") || c.includes("sneaker") || t.includes("tabi") || t.includes("loafer")) {
    return "Footwear";
  }
  if (t.includes("mike kelley") || t.includes(" × ") || t.includes("collab") || t.includes("exclusive")) {
    return "Collaboration";
  }
  if (c.includes("jewelry") || c.includes("accessory") || t.includes("ring") || t.includes("necklace") || t.includes("chain")) {
    return "Jewelry & Accessories";
  }
  if (c.includes("t-shirt") || c.includes("tee") || t.includes("graphic")) {
    return "Graphic Tees";
  }
  return "Mainline";
}

export const archivePieces: ArchivePiece[] = (() => {
  const byKey = new Map<string, ArchivePiece>();
  let nextId = 1;

  for (const product of products) {
    const brandSlug = slugifyBrand(product.brand);
    const pieceSlug = archivePieceSlugFromTitle(product.title);
    const key = `${brandSlug}:${pieceSlug}`;
    const existing = byKey.get(key);

    if (existing) {
      existing.listingCount += 1;
      continue;
    }

    const demoSeason = assignDemoSeason(product.title, brandSlug);
    byKey.set(key, {
      id: nextId++,
      brandId: 0,
      brandSlug,
      brand: product.brand,
      slug: pieceSlug,
      title: product.title,
      seasonKind: demoSeason.kind,
      seasonYear: demoSeason.year,
      seasonLabel: demoSeason.label,
      collection: deriveCollection(product.category, product.title),
      category: product.category,
      color: product.color,
      coverImageUrl: product.images?.[0],
      description: product.description,
      details: product.details,
      listingCount: 1,
    });
  }

  // ── Dedicated demo archive catalog ─────────────────────────────────
  // Gives the year-slider and season panel real data to show in demo mode.
  type DemoEntry = { brandSlug: string; brand: string; title: string; kind: ArchiveSeasonKind; year: number; label: string; collection: string; category: string };
  const demoEntries: DemoEntry[] = [
    // Chrome Hearts
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "Cemetery Cross Pendant Necklace",   kind: "FW", year: 2026, label: "FW '26", collection: "Jewelry & Accessories", category: "Jewelry" },
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "Fleur de Lis Leather Jacket",        kind: "SS", year: 2026, label: "SS '26", collection: "Mainline",              category: "Jackets" },
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "Triple Cross Dagger Ring",           kind: "FW", year: 2025, label: "FW '25", collection: "Jewelry & Accessories", category: "Jewelry" },
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "Chrome Hearts Logo Zip Hoodie",      kind: "SS", year: 2025, label: "SS '25", collection: "Mainline",              category: "Sweatshirts & Hoodies" },
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "Cemetery Cross Leather Belt",        kind: "FW", year: 2024, label: "FW '24", collection: "Jewelry & Accessories", category: "Accessories" },
    { brandSlug: "chrome-hearts", brand: "Chrome Hearts", title: "CH Plus Sterling Chain Necklace",    kind: "SS", year: 2024, label: "SS '24", collection: "Jewelry & Accessories", category: "Jewelry" },
    // Supreme
    { brandSlug: "supreme", brand: "Supreme", title: "Box Logo Crewneck Sweatshirt FW26",         kind: "FW", year: 2026, label: "FW '26", collection: "Mainline",    category: "Sweatshirts & Hoodies" },
    { brandSlug: "supreme", brand: "Supreme", title: "Arc Logo Short-Sleeve Tee",                  kind: "SS", year: 2026, label: "SS '26", collection: "Graphic Tees", category: "T-Shirts" },
    { brandSlug: "supreme", brand: "Supreme", title: "Supreme × Umbro Track Jacket",              kind: "FW", year: 2025, label: "FW '25", collection: "Collaboration", category: "Jackets" },
    { brandSlug: "supreme", brand: "Supreme", title: "Supreme × Lacoste Piqué Hoodie",            kind: "SS", year: 2025, label: "SS '25", collection: "Collaboration", category: "Sweatshirts & Hoodies" },
    { brandSlug: "supreme", brand: "Supreme", title: "Box Logo Hooded Sweatshirt FW24",           kind: "FW", year: 2024, label: "FW '24", collection: "Mainline",    category: "Sweatshirts & Hoodies" },
    { brandSlug: "supreme", brand: "Supreme", title: "Supreme Gonz Ramm Tee",                     kind: "SS", year: 2024, label: "SS '24", collection: "Graphic Tees", category: "T-Shirts" },
    // Balenciaga
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Defender Sneaker",              kind: "FW", year: 2026, label: "FW '26", collection: "Footwear", category: "Shoes" },
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Le City Mini Bag",              kind: "SS", year: 2026, label: "SS '26", collection: "Mainline",  category: "Bags" },
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Track Sneaker 3.0",             kind: "FW", year: 2025, label: "FW '25", collection: "Footwear", category: "Shoes" },
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Hourglass XS Top Handle Bag",  kind: "SS", year: 2025, label: "SS '25", collection: "Mainline",  category: "Bags" },
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Knife Boot",                   kind: "FW", year: 2024, label: "FW '24", collection: "Footwear", category: "Shoes" },
    { brandSlug: "balenciaga", brand: "Balenciaga", title: "Le Cagole Shoulder Bag",       kind: "SS", year: 2024, label: "SS '24", collection: "Mainline",  category: "Bags" },
    // Maison Margiela
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "Tabi High Heel Pump",            kind: "FW", year: 2026, label: "FW '26", collection: "Footwear", category: "Shoes" },
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "Replica Low-Top Sneaker",        kind: "SS", year: 2026, label: "SS '26", collection: "Footwear", category: "Shoes" },
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "5AC Micro Bag",                  kind: "FW", year: 2025, label: "FW '25", collection: "Mainline",  category: "Bags" },
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "Tabi Ankle Boot",                kind: "SS", year: 2025, label: "SS '25", collection: "Footwear", category: "Shoes" },
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "Artisanal Decortiqué Blazer",    kind: "FW", year: 2024, label: "FW '24", collection: "Mainline",  category: "Jackets" },
    { brandSlug: "maison-margiela", brand: "Maison Margiela", title: "MM6 Japanese Numeric Logo Tee",  kind: "SS", year: 2024, label: "SS '24", collection: "Graphic Tees", category: "T-Shirts" },
    // Enfants Riches Déprimés
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "ERD Cemetery Denim Jacket",          kind: "FW", year: 2026, label: "FW '26", collection: "Mainline",    category: "Jackets" },
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "ERD Skull Graphic Tee",              kind: "SS", year: 2026, label: "SS '26", collection: "Graphic Tees", category: "T-Shirts" },
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "ERD Distressed Logo Crewneck",       kind: "FW", year: 2025, label: "FW '25", collection: "Mainline",    category: "Sweatshirts & Hoodies" },
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "ERD × Fragment Design Hoodie",       kind: "SS", year: 2025, label: "SS '25", collection: "Collaboration", category: "Sweatshirts & Hoodies" },
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "Punk Collection Leather Jacket",     kind: "FW", year: 2024, label: "FW '24", collection: "Mainline",    category: "Jackets" },
    { brandSlug: "enfants-riches-deprimes", brand: "Enfants Riches Déprimés", title: "Stencil Logo Tee",                  kind: "SS", year: 2024, label: "SS '24", collection: "Graphic Tees", category: "T-Shirts" },
    // Raf Simons
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Consumed Bomber Jacket",             kind: "FW", year: 2026, label: "FW '26", collection: "Mainline",    category: "Jackets" },
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Sterling Ruby Print Tee",            kind: "SS", year: 2026, label: "SS '26", collection: "Graphic Tees", category: "T-Shirts" },
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Riot Riot Riot Oversized Hoodie",    kind: "FW", year: 2025, label: "FW '25", collection: "Mainline",    category: "Sweatshirts & Hoodies" },
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Archive Redux Patched Denim Jacket", kind: "SS", year: 2025, label: "SS '25", collection: "Mainline",    category: "Jackets" },
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Oral Fixation Intarsia Knit",        kind: "FW", year: 2024, label: "FW '24", collection: "Mainline",    category: "Knitwear" },
    { brandSlug: "raf-simons", brand: "Raf Simons", title: "Oversized Printed Wool Coat",        kind: "SS", year: 2024, label: "SS '24", collection: "Mainline",    category: "Coats" },
    // UNDERCOVER
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "Scab Graphic Print Tee",              kind: "FW", year: 2026, label: "FW '26", collection: "Graphic Tees", category: "T-Shirts" },
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "But Beautiful Deconstructed Hoodie",  kind: "SS", year: 2026, label: "SS '26", collection: "Mainline",    category: "Sweatshirts & Hoodies" },
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "Witch's Cell Division Overcoat",      kind: "FW", year: 2025, label: "FW '25", collection: "Mainline",    category: "Coats" },
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "Reconstruction Washed Denim Jacket",  kind: "SS", year: 2025, label: "SS '25", collection: "Mainline",    category: "Jackets" },
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "Gilapple Logo Long-Sleeve Tee",       kind: "FW", year: 2024, label: "FW '24", collection: "Graphic Tees", category: "T-Shirts" },
    { brandSlug: "undercover", brand: "UNDERCOVER", title: "Melting Pot Patchwork Jacket",        kind: "SS", year: 2024, label: "SS '24", collection: "Mainline",    category: "Jackets" },
    // Hedi Slimane
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Dior Homme Waxed Biker Jacket",          kind: "FW", year: 2026, label: "FW '26", collection: "Dior Homme",   category: "Jackets" },
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Celine Triomphe Embroidered Trucker",     kind: "SS", year: 2026, label: "SS '26", collection: "Celine",       category: "Jackets" },
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Saint Laurent Skinny Wool Blazer",        kind: "FW", year: 2025, label: "FW '25", collection: "Saint Laurent", category: "Jackets" },
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Celine 16 Bag Small",                     kind: "SS", year: 2025, label: "SS '25", collection: "Celine",       category: "Bags" },
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Dior Homme Skinny Five-Pocket Jeans",     kind: "FW", year: 2024, label: "FW '24", collection: "Dior Homme",   category: "Trousers" },
    { brandSlug: "hedi-slimane", brand: "Hedi Slimane", title: "Celine Canvas Triomphe Tote",             kind: "SS", year: 2024, label: "SS '24", collection: "Celine",       category: "Bags" },
  ];

  for (const entry of demoEntries) {
    const pieceSlug = archivePieceSlugFromTitle(entry.title);
    const key = `${entry.brandSlug}:${pieceSlug}`;
    if (byKey.has(key)) continue; // product-derived piece takes priority
    byKey.set(key, {
      id: nextId++,
      brandId: 0,
      brandSlug: entry.brandSlug,
      brand: entry.brand,
      slug: pieceSlug,
      title: entry.title,
      seasonKind: entry.kind,
      seasonYear: entry.year,
      seasonLabel: entry.label,
      collection: entry.collection,
      category: entry.category,
      description: [],
      details: [
        { label: "Season",     value: entry.label },
        { label: "Collection", value: entry.collection },
        { label: "Category",   value: entry.category },
      ],
      listingCount: 0,
    });
  }

  return Array.from(byKey.values());
})();

export function getArchivePieceByBrandAndSlug(brandSlug: string, pieceSlug: string) {
  return archivePieces.find(
    (piece) => piece.brandSlug === brandSlug && piece.slug === pieceSlug,
  );
}

export function getArchivePiecesByBrandSlug(brandSlug: string) {
  return archivePieces.filter((piece) => piece.brandSlug === brandSlug);
}

export function getListingsForArchivePiece(brandSlug: string, pieceSlug: string) {
  return products.filter(
    (product) =>
      slugifyBrand(product.brand) === brandSlug &&
      archivePieceSlugFromTitle(product.title) === pieceSlug &&
      !product.soldAt,
  );
}
