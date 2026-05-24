export const productSortOptions = ["latest", "price-asc", "price-desc", "watched"] as const;
export type ProductSortOption = (typeof productSortOptions)[number];

export type ProductSearchFilters = {
  q: string;
  brand: string;
  category: string;
  condition: string;
  verified: boolean;
  tradeReady: boolean;
  size: string;
  minPrice: string;
  maxPrice: string;
  sort: ProductSortOption;
  page: number;
};

export const defaultProductSearchFilters: ProductSearchFilters = {
  q: "",
  brand: "",
  category: "",
  condition: "",
  verified: false,
  tradeReady: false,
  size: "",
  minPrice: "",
  maxPrice: "",
  sort: "latest",
  page: 1,
};

export type ListingActionContract = {
  productId: number;
  buyerProfileId?: string;
  sellerProfileId?: string;
  listingStatus: "available" | "sold" | "own_listing";
  verificationStatus: "unverified" | "verified" | "failed" | "needs_review";
};
