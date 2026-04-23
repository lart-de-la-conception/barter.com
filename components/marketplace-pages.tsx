"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Grid3X3,
  Heart,
  ImagePlus,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-context";
import type {
  BrandDirectoryEntry,
  Conversation,
  HeroSlide,
  MarketplaceStats,
  Product,
  TradeProposal,
  UserProfile,
  Viewer,
} from "@/lib/marketplace-types";
import { LoginForm } from "@/components/login-form";

type UploadedImage = {
  file: File;
  previewUrl: string;
};

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

function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  eager = false,
}: {
  src: string;
  alt: string;
  className: string;
  sizes?: string;
  eager?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-neutral-100", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        loading={eager ? "eager" : undefined}
        unoptimized={src.startsWith("blob:")}
      />
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-black transition hover:opacity-60"
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

function AuthPromptModal({
  open,
  onClose,
  next,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  next: string;
  title: string;
  description: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <p className="max-w-xl text-sm text-neutral-600">{description}</p>
        <LoginForm next={next} />
      </div>
    </Modal>
  );
}

function Avatar({ user, className = "h-10 w-10 text-sm" }: { user: UserProfile; className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
        avatarClass(user.avatarSeed),
        className,
      )}
    >
      {user.initials}
    </div>
  );
}

function ProductCard({
  product,
  seller,
  showSeller = false,
}: {
  product: Product;
  seller?: UserProfile;
  showSeller?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();

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
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              void toggleFavorite(product.id);
            }}
            className="absolute bottom-3 right-3 rounded-full border border-black/10 bg-white p-2 shadow-sm transition hover:bg-black hover:text-white"
            aria-label="Toggle favorite"
          >
            <Heart className={cn("h-4 w-4", isFavorite(product.id) && "fill-current")} />
          </button>
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

export function HomePage({
  heroSlides,
  featuredProducts,
  stats,
  sellersById,
}: {
  heroSlides: HeroSlide[];
  featuredProducts: Product[];
  stats: MarketplaceStats;
  sellersById: Record<string, UserProfile | undefined>;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

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
            <ProductImage
              src={slide.image}
              alt={slide.title}
              className="h-[72vh] w-full rounded-none opacity-60"
              sizes="100vw"
              eager={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-[72vh] max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-white/80">
            {heroSlides[currentSlide]?.subtitle}
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            {heroSlides[currentSlide]?.title}
          </h1>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href={heroSlides[currentSlide]?.ctaHref ?? "/products"}
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
                className={cn("h-2 rounded-full transition-all", currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50")}
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
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} seller={sellersById[product.sellerId]} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <StatCard label="Active Listings" value={String(stats.activeListings)} />
        <StatCard label="Core Brands" value={String(stats.coreBrands)} />
        <StatCard label="Average Ask" value={formatMoney(stats.averageAsk)} />
      </section>
    </div>
  );
}

export function ProductsPage({
  products,
  brand,
  searchQuery = "",
  sellersById,
}: {
  products: Product[];
  brand?: BrandDirectoryEntry;
  searchQuery?: string;
  sellersById: Record<string, UserProfile | undefined>;
}) {
  const [query, setQuery] = useState(searchQuery);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      [product.brand, product.title, product.category, product.color, product.subtitle]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
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
              : "Chrome Hearts, Supreme, Balenciaga, Maison Margiela, and Enfants Riches Deprimes with real listings and member-owned closets."}
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the marketplace"
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>
      </div>
      {filteredProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} seller={sellersById[product.sellerId]} showSeller />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
          No products matched your current search.
        </div>
      )}
    </div>
  );
}

export function ProductDetailPage({
  product,
  seller,
  currentCloset,
  similar,
  viewer,
}: {
  product: Product;
  seller: UserProfile | null;
  currentCloset: Product[];
  similar: Product[];
  viewer: Viewer | null;
}) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [cashOffer, setCashOffer] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<null | "trade" | "message">(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const selectedClosetItems = useMemo(
    () => currentCloset.filter((item) => selectedIds.includes(item.id)),
    [currentCloset, selectedIds],
  );
  const selectedItemValue = selectedClosetItems.reduce((total, item) => total + item.price, 0);
  const cashOfferValue = Math.max(0, Number(cashOffer) || 0);
  const estimatedOfferValue = selectedItemValue + cashOfferValue;
  const estimatedDifference = estimatedOfferValue - product.price;

  function toggleTradeSelection(itemId: number) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  async function handleSendTradeOffer() {
    setTradeSubmitting(true);
    setTradeError(null);

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          yourItemIds: selectedIds,
          cashOffer: cashOfferValue,
          message: tradeMessage.trim() || `Trade offer sent for ${product.title}.`,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send trade offer.");
      }

      setTradeOpen(false);
      setSelectedIds([]);
      setCashOffer("");
      setTradeMessage("");
      router.push("/trades?tab=sent&filter=pending");
      router.refresh();
    } catch (error) {
      setTradeError(error instanceof Error ? error.message : "Unable to send trade offer.");
    } finally {
      setTradeSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-black">
          Listings
        </Link>
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
                className={cn("relative aspect-square w-20 overflow-hidden rounded-2xl border", currentImage === index ? "border-black" : "border-black/10")}
              >
                <Image src={image} alt={`${product.title} view ${index + 1}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <ProductImage
              src={product.images[currentImage]}
              alt={product.title}
              className="aspect-[4/5] w-full rounded-[32px]"
              sizes="(min-width: 1024px) 48vw, 100vw"
            />
            <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-5 text-sm text-neutral-600">
              <span className="font-semibold text-black">Reference listing:</span> {product.sourceName}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => void toggleFavorite(product.id)}
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
          </div>
          <div className="grid gap-3">
            {viewer ? (
              <button
                type="button"
                onClick={() => setTradeOpen(true)}
                className="rounded-full bg-black px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Propose Trade
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal("trade")}
                className="rounded-full bg-black px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Propose Trade
              </button>
            )}
            {viewer ? (
              <Link
                href="/messages"
                className="rounded-full border border-black px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-neutral-100"
              >
                Message Seller
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal("message")}
                className="rounded-full border border-black px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-neutral-100"
              >
                Message Seller
              </button>
            )}
          </div>
          {seller ? (
            <Link href={`/user/${seller.id}`} className="block rounded-[28px] border border-black/10 bg-white p-5 transition hover:border-black">
              <div className="flex items-start gap-4">
                <Avatar user={seller} className="h-14 w-14 text-base" />
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-black">{seller.name}</p>
                  <p className="text-sm text-neutral-500">{seller.handle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {seller.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current" />
                      {seller.rating}
                    </span>
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

      {viewer && currentCloset.length ? (
        <section className="mt-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-black">Your closet</h2>
            <Link href="/closet" className="text-sm font-semibold text-black">
              Manage closet
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {currentCloset.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-black">Similar listings</h2>
          <Link href="/products" className="text-sm font-semibold text-black">
            See more
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((item) => (
            <ProductCard key={item.id} product={item} />
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
            {currentCloset.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {currentCloset.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleTradeSelection(item.id)}
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
            ) : (
              <div className="mt-4 rounded-[28px] border border-dashed border-black/15 bg-white p-5 text-sm text-neutral-600">
                Add a few items to your closet before sending a trade offer.
              </div>
            )}
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
          <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-neutral-500">Selected items</span>
              <span className="font-semibold text-black">{formatMoney(selectedItemValue)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-neutral-500">Cash add-on</span>
              <span className="font-semibold text-black">{formatMoney(cashOfferValue)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-black/10 pt-3">
              <span className="text-sm font-semibold text-black">Estimated offer value</span>
              <span className="text-lg font-semibold text-black">{formatMoney(estimatedOfferValue)}</span>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              {estimatedDifference === 0
                ? "Your offer matches the listing estimate."
                : estimatedDifference > 0
                  ? `Your offer is about ${formatMoney(estimatedDifference)} above the listing estimate.`
                  : `Your offer is about ${formatMoney(Math.abs(estimatedDifference))} below the listing estimate.`}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Message to seller</label>
            <textarea
              value={tradeMessage}
              onChange={(event) => setTradeMessage(event.target.value)}
              rows={4}
              placeholder={`Interested in trading for ${product.title.toLowerCase()}...`}
              className="mt-3 w-full rounded-[28px] border border-black/10 px-5 py-4 outline-none focus:border-black"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTradeOpen(false)}
              className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendTradeOffer}
              disabled={tradeSubmitting || (!selectedIds.length && cashOfferValue <= 0)}
              className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {tradeSubmitting ? "Sending..." : "Send Offer"}
            </button>
          </div>
          {tradeError ? <p className="text-sm text-rose-700">{tradeError}</p> : null}
        </div>
      </Modal>
      <AuthPromptModal
        open={authModal !== null}
        onClose={() => setAuthModal(null)}
        next={`/product/${product.id}`}
        title={authModal === "trade" ? "Sign in to propose a trade" : "Sign in to message the seller"}
        description={
          authModal === "trade"
            ? "Create an account or sign in to send offers, track responses, and manage your trade history."
            : "Create an account or sign in to message members and keep your conversations in one place."
        }
      />
    </div>
  );
}

export function MyClosetPage({
  currentUser,
  closetItems,
  trades,
  initialTab = "all",
}: {
  currentUser: UserProfile;
  closetItems: Product[];
  trades: TradeProposal[];
  initialTab?: "all" | "active" | "pending" | "history";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "history">(initialTab);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    brand: "",
    size: "",
    price: "",
    description: "",
  });
  const items = closetItems;
  const pendingIds = useMemo(
    () => new Set(trades.filter((trade) => trade.status === "pending").flatMap((trade) => trade.yourItemIds)),
    [trades],
  );
  const historyTrades = trades.filter((trade) => trade.status === "accepted");
  const visibleItems = items.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !pendingIds.has(item.id);
    if (activeTab === "pending") return pendingIds.has(item.id);
    return true;
  });

  function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const nextUploads = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploads((current) => [...current, ...nextUploads].slice(0, 8));
  }

  async function saveDraftItem() {
    const title = draft.title.trim();
    const brand = draft.brand.trim();
    const size = draft.size.trim();
    const price = Number(draft.price);

    if (!title || !brand || !size || !Number.isFinite(price) || price <= 0) {
      setSaveError("Title, brand, size, price, and at least one image are required.");
      return;
    }

    if (!uploads.length) {
      setSaveError("Add at least one image before creating a listing.");
      return;
    }

    setSavingItem(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("brand", brand);
      formData.set("size", size);
      formData.set("price", String(price));
      formData.set("description", draft.description.trim());
      uploads.forEach((upload) => {
        formData.append("images", upload.file);
      });

      const response = await fetch("/api/closet/items", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to add item to closet.");
      }

      setDraft({
        title: "",
        brand: "",
        size: "",
        price: "",
        description: "",
      });
      setUploads([]);
      setAddOpen(false);
      setActiveTab("all");
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to add item to closet.");
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">My Closet</h1>
          <p className="mt-2 text-neutral-600">{items.length} designer pieces ready for offers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-black/10 px-5 py-3 text-sm text-neutral-500">
            {currentUser.handle}
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Items" value={String(items.length)} />
        <StatCard label="Closet Value" value={formatMoney(items.reduce((sum, item) => sum + item.price, 0))} />
        <StatCard label="Pending Trades" value={String([...pendingIds].length)} />
        <StatCard label="Completed" value={String(historyTrades.length)} />
      </div>
      <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: `All (${items.length})` },
            { id: "active", label: `Active (${items.filter((item) => !pendingIds.has(item.id)).length})` },
            { id: "pending", label: `Pending (${items.filter((item) => pendingIds.has(item.id)).length})` },
            { id: "history", label: `Trade History (${historyTrades.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "all" | "active" | "pending" | "history")}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", activeTab === tab.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
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
        <TradesPage trades={historyTrades} compact />
      ) : (
        <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
          {visibleItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add item to closet">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Photos</label>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {uploads.map((image) => (
                <div key={image.previewUrl} className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                  <Image src={image.previewUrl} alt="Upload preview" fill unoptimized className="object-cover" />
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
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title"
              className="rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
            <input
              type="text"
              value={draft.brand}
              onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}
              placeholder="Brand"
              className="rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
            <input
              type="text"
              value={draft.size}
              onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
              placeholder="Size"
              className="rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
            <input
              type="number"
              min="0"
              value={draft.price}
              onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
              className="rounded-full border border-black/10 px-4 py-3 outline-none focus:border-black"
            />
          </div>
          <textarea
            rows={4}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            className="w-full rounded-[28px] border border-black/10 px-4 py-4 outline-none focus:border-black"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraftItem}
              disabled={savingItem}
              className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {savingItem ? "Saving..." : "Add to Closet"}
            </button>
          </div>
          {saveError ? <p className="text-sm text-rose-700">{saveError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}

export function MessagesPage({
  conversations,
  usersById,
}: {
  conversations: Conversation[];
  usersById: Record<string, UserProfile | undefined>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? 0);
  const [query, setQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const filtered = conversations.filter((item) => {
    const user = usersById[item.userId];
    return user?.name.toLowerCase().includes(query.toLowerCase());
  });
  const selected = conversations.find((item) => item.id === selectedId) ?? filtered[0];
  const selectedUser = selected ? usersById[selected.userId] : undefined;

  async function handleSendMessage() {
    if (!selected) return;

    const nextMessage = draftMessage.trim();
    if (!nextMessage) {
      setMessageError("Enter a message before sending.");
      return;
    }

    setSendingMessage(true);
    setMessageError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selected.id,
          body: nextMessage,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send message.");
      }

      setDraftMessage("");
      router.refresh();
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Unable to send message.");
    } finally {
      setSendingMessage(false);
    }
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
                const user = usersById[conversation.userId];
                if (!user) return null;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn("flex w-full items-start gap-3 border-b border-black/5 px-5 py-4 text-left transition hover:bg-neutral-50", selected?.id === conversation.id && "bg-neutral-50")}
                  >
                    <Avatar user={user} className="h-11 w-11 text-sm" />
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
                    <Avatar user={selectedUser} className="h-11 w-11 text-sm" />
                    <div>
                      <p className="font-semibold text-black">{selectedUser.name}</p>
                      <p className="text-sm text-neutral-500">{selectedUser.handle}</p>
                    </div>
                  </Link>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    {selectedUser.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-5">
                  {selected.messages.map((message) => (
                    <div key={message.id} className={cn("flex", message.sender === "me" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn("max-w-[75%] rounded-[24px] px-4 py-3 text-sm shadow-sm", message.sender === "me" ? "bg-black text-white" : "bg-white text-black")}
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
                  <div className="flex gap-3">
                    <input
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      placeholder={`Message ${selectedUser.name.split(" ")[0]}...`}
                      className="flex-1 rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sendingMessage}
                      className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {sendingMessage ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {messageError ? <p className="mt-3 text-sm text-rose-700">{messageError}</p> : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TradesPage({
  trades,
  compact = false,
  usersById,
  productsById,
  initialActiveTab = "received",
  initialFilter = "all",
}: {
  trades: TradeProposal[];
  compact?: boolean;
  usersById?: Record<string, UserProfile | undefined>;
  productsById?: Record<number, Product | undefined>;
  initialActiveTab?: "received" | "sent";
  initialFilter?: "all" | "pending" | "accepted" | "declined";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"received" | "sent">(initialActiveTab);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">(initialFilter);
  const [tradeStatusOverrides, setTradeStatusOverrides] = useState<Record<number, TradeProposal["status"]>>({});
  const [tradeActionError, setTradeActionError] = useState<string | null>(null);

  async function updateTradeStatus(tradeId: number, status: "accepted" | "declined") {
    setTradeActionError(null);

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update trade.");
      }

      setTradeStatusOverrides((current) => ({ ...current, [tradeId]: status }));
      router.refresh();
    } catch (error) {
      setTradeActionError(error instanceof Error ? error.message : "Unable to update trade.");
    }
  }

  const visible = trades
    .map((trade) => ({
      ...trade,
      status: tradeStatusOverrides[trade.id] ?? trade.status,
    }))
    .filter((trade) => {
    const matchesTab = compact || trade.type === activeTab;
    const matchesFilter = filter === "all" || trade.status === filter;
    return matchesTab && matchesFilter;
    });

  return (
    <div className={compact ? "" : "mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"}>
      {compact ? null : (
        <>
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
                className={cn("rounded-full px-4 py-2 text-sm font-semibold", activeTab === tab.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600")}
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
                className={cn("rounded-full px-4 py-2 text-sm font-medium capitalize", filter === value ? "border border-black bg-black text-white" : "border border-black/10 text-neutral-600")}
              >
                {value}
              </button>
            ))}
          </div>
        </>
      )}
      {tradeActionError ? <p className="mb-5 text-sm text-rose-700">{tradeActionError}</p> : null}
      <div className="space-y-5">
        {visible.map((trade) => {
          const user = usersById?.[trade.userId];
          return (
            <div key={trade.id} className="rounded-[32px] border border-black/10 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user ? <Avatar user={user} className="h-11 w-11 text-sm" /> : null}
                  <div>
                    <p className="font-semibold text-black">{user?.name ?? "Member"}</p>
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
                  {trade.yourItemIds.map((id) => {
                    const item = productsById?.[id];
                    if (!item) return null;
                    return (
                      <Link key={item.id} href={`/product/${item.id}`} className="mt-3 flex gap-3">
                        <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                        <div>
                          <p className="font-semibold text-black">{item.brand}</p>
                          <p className="text-sm text-neutral-600">{item.title}</p>
                        </div>
                      </Link>
                    );
                  })}
                  {trade.yourCash ? <p className="mt-3 text-sm font-semibold text-black">+ {formatMoney(trade.yourCash)} cash</p> : null}
                </div>
                <div className="grid place-items-center">
                  <ArrowLeftRight className="h-6 w-6 text-neutral-400" />
                </div>
                <div className="rounded-[24px] border border-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Their items</p>
                  {trade.theirItemIds.map((id) => {
                    const item = productsById?.[id];
                    if (!item) return null;
                    return (
                      <Link key={item.id} href={`/product/${item.id}`} className="mt-3 flex gap-3">
                        <ProductImage src={item.images[0]} alt={item.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
                        <div>
                          <p className="font-semibold text-black">{item.brand}</p>
                          <p className="text-sm text-neutral-600">{item.title}</p>
                        </div>
                      </Link>
                    );
                  })}
                  {trade.theirCash ? <p className="mt-3 text-sm font-semibold text-black">+ {formatMoney(trade.theirCash)} cash</p> : null}
                </div>
              </div>
              <div className="mt-5 rounded-[24px] bg-neutral-50 p-4 text-sm text-neutral-600">{trade.message}</div>
              {!compact && trade.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {trade.type === "received" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateTradeStatus(trade.id, "accepted")}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                      >
                        <Check className="h-4 w-4" />
                        Accept Trade
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTradeStatus(trade.id, "declined")}
                        className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black"
                      >
                        Decline
                      </button>
                      <Link href="/messages" className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
                        Message
                      </Link>
                    </>
                  ) : (
                    <span className="rounded-full border border-black/10 px-5 py-3 text-sm text-neutral-500">
                      Sent offer
                    </span>
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

export function FavoritesPage({
  watchedProducts,
  sellersById,
}: {
  watchedProducts: Product[];
  sellersById: Record<string, UserProfile | undefined>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <span>Favorites</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">Watched pieces</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">All of the listings you have favorited and are keeping an eye on.</p>
      </div>
      {watchedProducts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {watchedProducts.map((product) => (
            <ProductCard key={product.id} product={product} seller={sellersById[product.sellerId]} showSeller />
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

export function UserClosetPage({
  user,
  listingProducts,
  viewer,
}: {
  user: UserProfile;
  listingProducts: Product[];
  viewer: Viewer | null;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [authModal, setAuthModal] = useState<null | "trade" | "message">(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-black/10 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <Avatar user={user} className="h-24 w-24 text-2xl" />
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-black">{user.name}</h1>
            <p className="mt-1 text-neutral-500">{user.handle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                {user.rating} ({user.reviews} reviews)
              </span>
              <span>Member since {user.memberSince}</span>
            </div>
            <p className="mt-4 max-w-2xl text-neutral-600">{user.bio}</p>
          </div>
          <div className="flex gap-3">
            {viewer ? (
              <Link href="/messages" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Message
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal("message")}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Message
              </button>
            )}
            {viewer ? (
              <Link href="/trades" className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black">
                Propose Trade
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal("trade")}
                className="rounded-full border border-black px-5 py-3 text-sm font-semibold text-black"
              >
                Propose Trade
              </button>
            )}
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
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
      <AuthPromptModal
        open={authModal !== null}
        onClose={() => setAuthModal(null)}
        next={`/user/${user.id}`}
        title={authModal === "trade" ? "Sign in to propose a trade" : "Sign in to message this member"}
        description={
          authModal === "trade"
            ? "Create an account or sign in to send trade offers and manage them from your closet."
            : "Create an account or sign in to message members and continue the conversation later."
        }
      />
    </div>
  );
}
