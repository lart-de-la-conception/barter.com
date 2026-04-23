"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Grid3X3,
  Heart,
  ImagePlus,
  LayoutGrid,
  MapPin,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  X,
  XCircle,
} from "lucide-react";
import {
  conversations,
  currentUserClosetIds,
  featuredProductIds,
  getBrandBySlug,
  getProductById,
  getProductsByBrandSlug,
  getProductsByIds,
  getUserById,
  heroSlides,
  products,
  tradeProposals,
  userClosetListingIds,
} from "@/lib/market-data";
import { useFavorites } from "@/components/favorites-context";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatMoney(value: number) {
  return currency.format(value);
}

function filterProductsByQuery(items: typeof products, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((product) =>
    [product.brand, product.title, product.category, product.color, product.subtitle]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function avatarClass(seed: string) {
  const palettes = [
    "from-neutral-950 to-neutral-700",
    "from-zinc-700 to-stone-500",
    "from-slate-700 to-zinc-500",
    "from-stone-800 to-neutral-600",
  ];
  const index = seed
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

function Avatar({ userId, className = "h-10 w-10 text-sm" }: { userId: string; className?: string }) {
  const user = getUserById(userId);
  if (!user) return null;

  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        avatarClass(userId),
        className,
      )}
    >
      {user.initials}
    </div>
  );
}

function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
}: {
  src: string;
  alt: string;
  className: string;
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-neutral-100", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 text-black transition hover:bg-black hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ProductCard({
  productId,
  showSeller = false,
  favorite,
  onFavoriteToggle,
}: {
  productId: number;
  showSeller?: boolean;
  favorite?: boolean;
  onFavoriteToggle?: (productId: number) => void;
}) {
  const product = getProductById(productId);
  if (!product) return null;
  const seller = getUserById(product.sellerId);

  return (
    <Link href={`/product/${product.id}`} className="group">
      <div className="space-y-3">
        <div className="relative">
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            className="aspect-[4/5] w-full rounded-[28px] border border-black/5"
          />
          {product.badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
              {product.badge}
            </span>
          ) : null}
          {onFavoriteToggle ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onFavoriteToggle(product.id);
              }}
              className="absolute bottom-3 right-3 rounded-full border border-black/10 bg-white p-2 shadow-sm transition hover:bg-black hover:text-white"
              aria-label="Toggle favorite"
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
            </button>
          ) : null}
        </div>
        <div className="space-y-1">
          {showSeller && seller ? (
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              {product.listingTime} · {seller.handle}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-black">{product.brand}</p>
          <p className="text-sm text-neutral-600">{product.title}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-black">{formatMoney(product.price)}</span>
            {product.originalPrice ? (
              <span className="text-neutral-400 line-through">{formatMoney(product.originalPrice)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{value}</p>
    </div>
  );
}

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const featured = getProductsByIds(featuredProductIds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((value) => (value + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative isolate overflow-hidden border-b border-black/10 bg-black text-white">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              currentSlide === index ? "opacity-100" : "opacity-0",
            )}
          >
            <ProductImage src={slide.image} alt={slide.title} className="h-[72vh] w-full rounded-none opacity-60" sizes="100vw" />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-[72vh] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-white/80">
            {heroSlides[currentSlide].subtitle}
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            {heroSlides[currentSlide].title}
          </h1>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href={heroSlides[currentSlide].ctaHref}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Explore Brand
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse All
            </Link>
          </div>
          <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentSlide((value) => (value - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 rounded-full border border-white/20 p-3 transition hover:bg-white/10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((value) => (value + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 rounded-full border border-white/20 p-3 transition hover:bg-white/10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Daily Picks</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">Real pieces, ready to trade</h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-black">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {featured.map((product) => (
            <ProductCard key={product.id} productId={product.id} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <StatCard label="Active Listings" value={String(products.length)} />
        <StatCard label="Core Brands" value="5" />
        <StatCard label="Average Ask" value={formatMoney(Math.round(products.reduce((sum, item) => sum + item.price, 0) / products.length))} />
      </section>
    </div>
  );
}

export function ProductsPage({
  searchQuery = "",
  brandSlug,
}: {
  searchQuery?: string;
  brandSlug?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const brand = brandSlug ? getBrandBySlug(brandSlug) : undefined;
  const sourceProducts = brandSlug ? getProductsByBrandSlug(brandSlug) : products;
  const searchedProducts = filterProductsByQuery(sourceProducts, searchQuery);
  const [openFilters, setOpenFilters] = useState({
    brand: false,
    size: false,
    condition: false,
    price: false,
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  const brandOptions = [...new Set(sourceProducts.map((product) => product.brand))].sort();
  const sizeOptions = [...new Set(sourceProducts.map((product) => product.size))].sort();
  const conditionOptions = [...new Set(sourceProducts.map((product) => product.condition))].sort();
  const priceOptions = [
    { id: "under-500", label: "Under $500", matches: (price: number) => price < 500 },
    { id: "500-1000", label: "$500 - $1,000", matches: (price: number) => price >= 500 && price <= 1000 },
    { id: "1000-2000", label: "$1,000 - $2,000", matches: (price: number) => price > 1000 && price <= 2000 },
    { id: "over-2000", label: "Over $2,000", matches: (price: number) => price > 2000 },
  ];

  function toggleValue(value: string, selected: string[], setSelected: (value: string[]) => void) {
    setSelected(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  const filteredProducts = searchedProducts.filter((product) => {
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(product.size);
    const matchesCondition =
      selectedConditions.length === 0 || selectedConditions.includes(product.condition);
    const matchesPrice =
      selectedPrices.length === 0 ||
      selectedPrices.some((priceId) => priceOptions.find((option) => option.id === priceId)?.matches(product.price));

    return matchesBrand && matchesSize && matchesCondition && matchesPrice;
  });

  const activeFilterCount =
    selectedBrands.length +
    selectedSizes.length +
    selectedConditions.length +
    selectedPrices.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span>{brand ? brand.name : "Designer Market"}</span>
      </nav>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">
            {brand ? `${brand.name} listings` : "Curated designer listings"}
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            {brand
              ? brand.description
              : "Chrome Hearts, Supreme, Balenciaga, Maison Margiela, and Enfants Riches Deprimes with real product references and local product photography."}
          </p>
          {searchQuery ? (
            <p className="mt-3 text-sm font-medium text-neutral-500">
              Showing results for “{searchQuery}” · {filteredProducts.length} match{filteredProducts.length === 1 ? "" : "es"}
            </p>
          ) : brand ? (
            <p className="mt-3 text-sm font-medium text-neutral-500">{brand.tagline}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <button className="rounded-full border border-black/10 px-4 py-2">Sort: Most Relevant</button>
          <button className="rounded-full border border-black/10 px-4 py-2">
            Filters{activeFilterCount ? ` · ${activeFilterCount}` : ""}
          </button>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <button
              type="button"
              onClick={() => setOpenFilters((current) => ({ ...current, brand: !current.brand }))}
              className="flex w-full items-center justify-between text-sm font-semibold text-black"
            >
              Brand
              <ChevronDown className={cn("h-4 w-4 transition", openFilters.brand && "rotate-180")} />
            </button>
            {openFilters.brand ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {brandOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleValue(option, selectedBrands, setSelectedBrands)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selectedBrands.includes(option)
                        ? "border-black bg-black text-white"
                        : "border-black/10 text-neutral-600 hover:border-black/30",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <button
              type="button"
              onClick={() => setOpenFilters((current) => ({ ...current, size: !current.size }))}
              className="flex w-full items-center justify-between text-sm font-semibold text-black"
            >
              Size
              <ChevronDown className={cn("h-4 w-4 transition", openFilters.size && "rotate-180")} />
            </button>
            {openFilters.size ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleValue(option, selectedSizes, setSelectedSizes)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selectedSizes.includes(option)
                        ? "border-black bg-black text-white"
                        : "border-black/10 text-neutral-600 hover:border-black/30",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <button
              type="button"
              onClick={() => setOpenFilters((current) => ({ ...current, condition: !current.condition }))}
              className="flex w-full items-center justify-between text-sm font-semibold text-black"
            >
              Condition
              <ChevronDown className={cn("h-4 w-4 transition", openFilters.condition && "rotate-180")} />
            </button>
            {openFilters.condition ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {conditionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleValue(option, selectedConditions, setSelectedConditions)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selectedConditions.includes(option)
                        ? "border-black bg-black text-white"
                        : "border-black/10 text-neutral-600 hover:border-black/30",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <button
              type="button"
              onClick={() => setOpenFilters((current) => ({ ...current, price: !current.price }))}
              className="flex w-full items-center justify-between text-sm font-semibold text-black"
            >
              Price
              <ChevronDown className={cn("h-4 w-4 transition", openFilters.price && "rotate-180")} />
            </button>
            {openFilters.price ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {priceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleValue(option.id, selectedPrices, setSelectedPrices)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selectedPrices.includes(option.id)
                        ? "border-black bg-black text-white"
                        : "border-black/10 text-neutral-600 hover:border-black/30",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-5 text-sm text-neutral-600">
            Save your sizes and condition preferences to make trading faster when real inventory arrives.
            {activeFilterCount ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedSizes([]);
                  setSelectedConditions([]);
                  setSelectedPrices([]);
                }}
                className="mt-4 block text-sm font-semibold text-black underline-offset-4 hover:underline"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        </aside>
        {filteredProducts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                productId={product.id}
                showSeller
                favorite={isFavorite(product.id)}
                onFavoriteToggle={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
            No products matched your current search and filter combination.
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductDetailPage({ productId }: { productId: number }) {
  const product = getProductById(productId);
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [cashOffer, setCashOffer] = useState("");
  const [message, setMessage] = useState("");
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!product) return null;
  const seller = getUserById(product.sellerId);
  const currentCloset = getProductsByIds(currentUserClosetIds.filter((id) => id !== product.id));
  const similar = products.filter((item) => item.id !== product.id).slice(0, 4);

  function toggleSelection(itemId: number) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-black">Listings</Link>
        <span>/</span>
        <span>{product.brand}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="grid gap-4 md:grid-cols-[104px_minmax(0,1fr)]">
          <div className="flex gap-3 md:flex-col">
            {product.images.map((image, index) => (
              <button
                key={`${product.id}-${index}`}
                type="button"
                onClick={() => setCurrentImage(index)}
                className={cn(
                  "relative aspect-square w-20 overflow-hidden rounded-2xl border",
                  currentImage === index ? "border-black" : "border-black/10",
                )}
              >
                <Image src={image} alt={`${product.title} view ${index + 1}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="relative">
              <ProductImage
                src={product.images[currentImage]}
                alt={product.title}
                className="aspect-[4/5] w-full rounded-[32px]"
                sizes="(min-width: 1024px) 48vw, 100vw"
              />
              <button
                type="button"
                onClick={() => setCurrentImage((value) => (value - 1 + product.images.length) % product.images.length)}
                className="absolute left-4 top-1/2 rounded-full border border-black/10 bg-white p-3"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentImage((value) => (value + 1) % product.images.length)}
                className="absolute right-4 top-1/2 rounded-full border border-black/10 bg-white p-3"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-5 text-sm text-neutral-600">
              <span className="font-semibold text-black">Reference listing:</span> {product.sourceName}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSaved((value) => !value)}
              className="rounded-full border border-black/10 p-3 transition hover:bg-black hover:text-white"
            >
              <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(product.id)}
              className="rounded-full border border-black/10 p-3 transition hover:bg-black hover:text-white"
            >
              <Heart className={cn("h-5 w-5", isFavorite(product.id) && "fill-current")} />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">{product.brand}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">{product.title}</h1>
            <p className="mt-3 text-neutral-600">{product.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span>Size {product.size}</span>
            <span>•</span>
            <span>{product.condition}</span>
            <span>•</span>
            <span>{product.location}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl font-semibold tracking-tight text-black">{formatMoney(product.price)}</span>
              {product.originalPrice ? (
                <span className="text-2xl text-neutral-400 line-through">{formatMoney(product.originalPrice)}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-neutral-600">Shipping estimate available after trade acceptance or direct message.</p>
          </div>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setTradeOpen(true)}
              className="rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Propose Trade
            </button>
            <button
              type="button"
              onClick={() => setMessageOpen(true)}
              className="rounded-full border border-black px-6 py-4 text-sm font-semibold text-black transition hover:bg-neutral-100"
            >
              Message Seller
            </button>
          </div>
          {seller ? (
            <Link href={`/user/${seller.id}`} className="block rounded-[28px] border border-black/10 bg-white p-5 transition hover:border-black">
              <div className="flex items-start gap-4">
                <Avatar userId={seller.id} className="h-14 w-14 text-base" />
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-black">{seller.name}</p>
                  <p className="text-sm text-neutral-500">{seller.handle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{seller.location}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current" />{seller.rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : null}
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Seller description</h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
              {product.description.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold text-black">Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              {product.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">{detail.label}</span>
                  <span className="font-medium text-black">{detail.value}</span>
                </div>
              ))}
            </div>
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-black underline-offset-4 hover:underline"
            >
              View source reference
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-black">Similar listings</h2>
          <Link href="/products" className="text-sm font-semibold text-black">See more</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((item) => (
            <ProductCard key={item.id} productId={item.id} />
          ))}
        </div>
      </section>

      <Modal open={tradeOpen} onClose={() => setTradeOpen(false)} title="Propose a Trade">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Trade for</p>
            <div className="mt-3 flex gap-4">
              <ProductImage src={product.images[0]} alt={product.title} className="h-28 w-24 rounded-2xl" sizes="96px" />
              <div>
                <p className="font-semibold text-black">{product.brand}</p>
                <p className="text-sm text-neutral-600">{product.title}</p>
                <p className="mt-2 font-semibold text-black">{formatMoney(product.price)}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Select from your closet</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {currentCloset.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelection(item.id)}
                  className={cn(
                    "rounded-[28px] border p-4 text-left transition",
                    selectedIds.includes(item.id) ? "border-black bg-neutral-50" : "border-black/10",
                  )}
                >
                  <div className="flex gap-4">
                    <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                    <div>
                      <p className="font-semibold text-black">{item.brand}</p>
                      <p className="text-sm text-neutral-600">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold text-black">{formatMoney(item.price)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Add cash</label>
            <input
              type="number"
              value={cashOffer}
              onChange={(event) => setCashOffer(event.target.value)}
              placeholder="0"
              className="mt-3 w-full rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setTradeOpen(false)} className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black">
              Cancel
            </button>
            <button type="button" onClick={() => setTradeOpen(false)} className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Send Offer
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title="Message Seller">
        <div className="space-y-5">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder={`Ask about ${product.title.toLowerCase()}...`}
            className="w-full rounded-[28px] border border-black/10 px-5 py-4 outline-none focus:border-black"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setMessageOpen(false)} className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black">
              Cancel
            </button>
            <button type="button" onClick={() => setMessageOpen(false)} className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Send Message
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function MyClosetPage({
  initialTab = "all",
}: {
  initialTab?: "all" | "active" | "pending" | "history";
}) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "history">(initialTab);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [uploads, setUploads] = useState<string[]>([]);
  const pendingIds = useMemo(
    () =>
      new Set(
        tradeProposals
          .filter((trade) => trade.status === "pending")
          .flatMap((trade) => trade.yourItemIds),
      ),
    [],
  );
  const closetItems = getProductsByIds(currentUserClosetIds);
  const historyTrades = tradeProposals.filter((trade) => trade.status === "accepted");
  const visibleItems = closetItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !pendingIds.has(item.id);
    if (activeTab === "pending") return pendingIds.has(item.id);
    return true;
  });

  function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const nextUploads = Array.from(files).map((file) => URL.createObjectURL(file));
    setUploads((current) => [...current, ...nextUploads].slice(0, 8));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">My Closet</h1>
          <p className="mt-2 text-neutral-600">{closetItems.length} designer pieces ready for offers.</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Items" value={String(closetItems.length)} />
        <StatCard label="Closet Value" value={formatMoney(closetItems.reduce((sum, item) => sum + item.price, 0))} />
        <StatCard label="Pending Trades" value={String([...pendingIds].length)} />
        <StatCard label="Completed" value={String(historyTrades.length)} />
      </div>

      <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: `All (${closetItems.length})` },
            { id: "active", label: `Active (${closetItems.filter((item) => !pendingIds.has(item.id)).length})` },
            { id: "pending", label: `Pending (${closetItems.filter((item) => pendingIds.has(item.id)).length})` },
            { id: "history", label: `Trade History (${historyTrades.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "all" | "active" | "pending" | "history")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-black/10 p-2"><SlidersHorizontal className="h-4 w-4" /></button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn("rounded-full border p-2", viewMode === "grid" ? "border-black bg-black text-white" : "border-black/10")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("compact")}
            className={cn("rounded-full border p-2", viewMode === "compact" ? "border-black bg-black text-white" : "border-black/10")}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="space-y-4">
          {historyTrades.map((trade) => {
            const user = getUserById(trade.userId);
            const yourItems = getProductsByIds(trade.yourItemIds);
            const theirItems = getProductsByIds(trade.theirItemIds);

            return (
              <div key={trade.id} className="rounded-[28px] border border-black/10 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user ? <Avatar userId={user.id} className="h-11 w-11 text-sm" /> : null}
                    <div>
                      <p className="font-semibold text-black">{user?.name}</p>
                      <p className="text-sm text-neutral-500">{trade.timestamp}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-black">
                    <ArrowLeftRight className="h-4 w-4" />
                    Completed
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                  <div className="rounded-[24px] border border-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">You gave</p>
                    {yourItems.map((item) => (
                      <div key={item.id} className="mt-3 flex gap-3">
                        <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                        <div>
                          <p className="font-semibold text-black">{item.brand}</p>
                          <p className="text-sm text-neutral-600">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid place-items-center">
                    <ArrowLeftRight className="h-6 w-6 text-neutral-400" />
                  </div>
                  <div className="rounded-[24px] border border-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">You received</p>
                    {theirItems.map((item) => (
                      <div key={item.id} className="mt-3 flex gap-3">
                        <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                        <div>
                          <p className="font-semibold text-black">{item.brand}</p>
                          <p className="text-sm text-neutral-600">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
          {visibleItems.map((item) => (
            <Link key={item.id} href={`/product/${item.id}`} className="group rounded-[28px] border border-black/10 bg-white p-4 transition hover:border-black">
              <ProductImage
                src={item.images[0]}
                alt={item.title}
                className={cn(viewMode === "grid" ? "aspect-[4/5] w-full rounded-[24px]" : "aspect-[5/4] w-full rounded-[24px]")}
              />
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-black">{item.brand}</p>
                    <p className="text-sm text-neutral-600">{item.title}</p>
                  </div>
                  {pendingIds.has(item.id) ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-amber-900">
                      PENDING
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-black">{formatMoney(item.price)}</span>
                  <span className="text-neutral-500">Size {item.size}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Item">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Photos</label>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {uploads.map((image) => (
                <div key={image} className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                  <Image
                    src={image}
                    alt="Upload preview"
                    width={320}
                    height={320}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {uploads.length < 8 ? (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-black/20 bg-neutral-50 text-neutral-500">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-6 w-6" />
                    <p className="mt-2 text-xs font-medium">Add photos</p>
                  </div>
                </label>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {["Title", "Brand", "Size", "Price"].map((label) => (
              <input
                key={label}
                type="text"
                placeholder={label}
                className="rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
              />
            ))}
          </div>
          <textarea
            rows={4}
            placeholder="Description"
            className="w-full rounded-[28px] border border-black/10 px-4 py-4 outline-none focus:border-black"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black">
              Cancel
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Save Draft
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function MessagesPage() {
  const [items, setItems] = useState(conversations);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const filtered = items.filter((item) => {
    const user = getUserById(item.userId);
    return user?.name.toLowerCase().includes(query.toLowerCase());
  });
  const selected = items.find((item) => item.id === selectedId) ?? filtered[0];
  const selectedUser = selected ? getUserById(selected.userId) : undefined;

  function sendMessage() {
    if (!selected || !draft.trim()) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              lastMessage: draft.trim(),
              timestamp: "now",
              unread: false,
              messages: [
                ...item.messages,
                { id: item.messages.length + 1, sender: "me", text: draft.trim(), timestamp: "Now" },
              ],
            }
          : item,
      ),
    );
    setDraft("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white">
        <div className="grid min-h-[72vh] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-black/10 lg:border-b-0 lg:border-r">
            <div className="border-b border-black/10 p-5">
              <h1 className="text-2xl font-semibold tracking-tight text-black">Messages</h1>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="w-full rounded-full border border-black/10 px-11 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
            <div className="max-h-[62vh] overflow-y-auto">
              {filtered.map((conversation) => {
                const user = getUserById(conversation.userId);
                if (!user) return null;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-black/5 px-5 py-4 text-left transition hover:bg-neutral-50",
                      selected?.id === conversation.id && "bg-neutral-50",
                    )}
                  >
                    <Avatar userId={user.id} className="h-11 w-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-black">{user.name}</p>
                        <span className="text-xs text-neutral-400">{conversation.timestamp}</span>
                      </div>
                      <p className={cn("truncate text-sm", conversation.unread ? "font-medium text-black" : "text-neutral-500")}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
          <div className="flex min-h-[72vh] flex-col">
            {selected && selectedUser ? (
              <>
                <div className="flex items-center justify-between border-b border-black/10 p-5">
                  <Link href={`/user/${selectedUser.id}`} className="flex items-center gap-3">
                    <Avatar userId={selectedUser.id} className="h-11 w-11 text-sm" />
                    <div>
                      <p className="font-semibold text-black">{selectedUser.name}</p>
                      <p className="text-sm text-neutral-500">{selectedUser.handle}</p>
                    </div>
                  </Link>
                  <button type="button" className="rounded-full border border-black/10 p-2">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-5">
                  {selected.messages.map((message) => (
                    <div key={message.id} className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-[24px] px-4 py-3 text-sm shadow-sm",
                          message.sender === "me" ? "bg-black text-white" : "bg-white text-black",
                        )}
                      >
                        <p>{message.text}</p>
                        <p className={cn("mt-1 text-xs", message.sender === "me" ? "text-white/60" : "text-neutral-400")}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-black/10 p-5">
                  <div className="flex items-end gap-2">
                    <button type="button" className="rounded-full border border-black/10 p-3"><ImagePlus className="h-4 w-4" /></button>
                    <button type="button" className="rounded-full border border-black/10 p-3"><Paperclip className="h-4 w-4" /></button>
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={1}
                      placeholder="Type a message..."
                      className="min-h-12 flex-1 rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      className="rounded-full bg-black p-3 text-white disabled:bg-neutral-300"
                      disabled={!draft.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TradesPage() {
  const [items, setItems] = useState(tradeProposals);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

  const visible = items.filter((trade) => {
    const matchesTab = trade.type === activeTab;
    const matchesFilter = filter === "all" || trade.status === filter;
    return matchesTab && matchesFilter;
  });

  function updateTrade(id: number, status: "accepted" | "declined") {
    setItems((current) => current.map((trade) => (trade.id === id ? { ...trade, status } : trade)));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">Trade Proposals</h1>
        <p className="mt-2 text-neutral-600">Manage incoming offers and sent requests from your curated closet.</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: "received", label: "Received" },
          { id: "sent", label: "Sent" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as "received" | "sent")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              activeTab === tab.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {["all", "pending", "accepted", "declined"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as "all" | "pending" | "accepted" | "declined")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium capitalize",
              filter === value ? "border border-black bg-black text-white" : "border border-black/10 text-neutral-600",
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="space-y-5">
        {visible.map((trade) => {
          const user = getUserById(trade.userId);
          const yourItems = getProductsByIds(trade.yourItemIds);
          const theirItems = getProductsByIds(trade.theirItemIds);

          return (
            <div key={trade.id} className="rounded-[32px] border border-black/10 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user ? <Avatar userId={user.id} className="h-11 w-11 text-sm" /> : null}
                  <div>
                    <p className="font-semibold text-black">{user?.name}</p>
                    <p className="text-sm text-neutral-500">{trade.timestamp}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                    trade.status === "pending" && "bg-amber-100 text-amber-900",
                    trade.status === "accepted" && "bg-emerald-100 text-emerald-900",
                    trade.status === "declined" && "bg-rose-100 text-rose-900",
                  )}
                >
                  {trade.status === "pending" ? <Clock3 className="h-4 w-4" /> : null}
                  {trade.status === "accepted" ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {trade.status === "declined" ? <XCircle className="h-4 w-4" /> : null}
                  {trade.status}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-[24px] border border-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Your items</p>
                  {yourItems.map((item) => (
                    <Link key={item.id} href={`/product/${item.id}`} className="mt-3 flex gap-3">
                      <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                      <div>
                        <p className="font-semibold text-black">{item.brand}</p>
                        <p className="text-sm text-neutral-600">{item.title}</p>
                        <p className="mt-1 text-sm font-semibold text-black">{formatMoney(item.price)}</p>
                      </div>
                    </Link>
                  ))}
                  {trade.yourCash ? <p className="mt-3 text-sm font-semibold text-black">+ {formatMoney(trade.yourCash)} cash</p> : null}
                </div>
                <div className="grid place-items-center">
                  <ArrowLeftRight className="h-6 w-6 text-neutral-400" />
                </div>
                <div className="rounded-[24px] border border-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Their items</p>
                  {theirItems.map((item) => (
                    <Link key={item.id} href={`/product/${item.id}`} className="mt-3 flex gap-3">
                      <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                      <div>
                        <p className="font-semibold text-black">{item.brand}</p>
                        <p className="text-sm text-neutral-600">{item.title}</p>
                        <p className="mt-1 text-sm font-semibold text-black">{formatMoney(item.price)}</p>
                      </div>
                    </Link>
                  ))}
                  {trade.theirCash ? <p className="mt-3 text-sm font-semibold text-black">+ {formatMoney(trade.theirCash)} cash</p> : null}
                </div>
              </div>
              <div className="mt-5 rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-600">{trade.message}</div>
              {trade.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {trade.type === "received" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateTrade(trade.id, "accepted")}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                      >
                        <Check className="h-4 w-4" />
                        Accept Trade
                      </button>
                      <Link href="/messages" className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
                        Message
                      </Link>
                      <button
                        type="button"
                        onClick={() => updateTrade(trade.id, "declined")}
                        className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateTrade(trade.id, "declined")}
                      className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700"
                    >
                      Cancel Offer
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FavoritesPage() {
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const watchedProducts = getProductsByIds(favoriteIds);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span>Favorites</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">Watched pieces</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          All of the listings you have favorited and are keeping an eye on.
        </p>
      </div>
      {watchedProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {watchedProducts.map((product) => (
            <ProductCard
              key={product.id}
              productId={product.id}
              showSeller
              favorite={isFavorite(product.id)}
              onFavoriteToggle={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
          You are not watching any listings yet.
        </div>
      )}
    </div>
  );
}

export function UserClosetPage({ userId }: { userId: string }) {
  const user = getUserById(userId);
  const listingIds = userClosetListingIds[userId] ?? [];
  const listingProducts = getProductsByIds(listingIds);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black">User not found</h1>
        <Link href="/messages" className="mt-4 inline-block text-sm font-semibold text-black underline">
          Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-black/10 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <Avatar userId={user.id} className="h-24 w-24 text-2xl" />
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-black">{user.name}</h1>
            <p className="mt-1 text-neutral-500">{user.handle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{user.location}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current" />{user.rating} ({user.reviews} reviews)</span>
              <span>Member since {user.memberSince}</span>
            </div>
            <p className="mt-4 max-w-2xl text-neutral-600">{user.bio}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/messages" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
              Message
            </Link>
            <Link href="/trades" className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
              Propose Trade
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Active Listings" value={String(listingProducts.length)} />
        <StatCard label="Completed Trades" value={String(user.completedTrades)} />
        <StatCard label="Response Rate" value={user.responseRate} />
      </div>

      <div className="mt-8 mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-black">Active Listings</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn("rounded-full border p-2", viewMode === "grid" ? "border-black bg-black text-white" : "border-black/10")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn("rounded-full border p-2", viewMode === "list" ? "border-black bg-black text-white" : "border-black/10")}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2")}>
        {listingProducts.map((item) => (
          <ProductCard key={item.id} productId={item.id} />
        ))}
      </div>
    </div>
  );
}

