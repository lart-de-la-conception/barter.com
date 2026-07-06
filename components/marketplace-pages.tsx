"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  Grid3X3,
  Heart,
  ImagePlus,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  ArrowUp,
  MoreHorizontal,
  Globe,
  CalendarDays,
  Flame,
  PenSquare,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-context";
import { useCommunities } from "@/components/communities-context";
import { brandDiscoveryLogos } from "@/lib/brand-logos";
import { trackEvent } from "@/lib/analytics/events";
import {
  defaultProductSearchFilters,
  type ListingActionContract,
  type ProductSearchFilters,
  type ProductSortOption,
} from "@/lib/marketplace-contracts";
import {
  users as allUsers,
  slugifyBrand,
  brandDirectory,
} from "@/lib/market-data";
import type {
  ArchivePiece,
  ArchiveSeasonFilter,
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
import { LoginForm } from "@/components/login-form";
import { ModerationPill, VerificationPill } from "@/components/admin-dashboard";

type UploadedImage = {
  file: File;
  previewUrl: string;
};

type ProductFilterMenuId = "applied" | "brand" | "category" | "size" | "condition" | "price" | "buyingFormat" | "all";

function ProductFilterPill({
  id,
  label,
  count = 0,
  openFilter,
  setOpenFilter,
  children,
}: {
  id: ProductFilterMenuId;
  label: string;
  count?: number;
  openFilter: ProductFilterMenuId | null;
  setOpenFilter: (id: ProductFilterMenuId | null) => void;
  children: ReactNode;
}) {
  const active = count > 0;
  const open = openFilter === id;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpenFilter(open ? null : id)}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition",
          active || open
            ? "border-black bg-[#1a1212] text-white"
            : "border-black/30 bg-white text-black hover:border-black",
        )}
      >
        {label}
        {count ? <span>({count})</span> : null}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

type ClosetItemType =
  | "shoes"
  | "pants"
  | "shorts"
  | "tshirt"
  | "longsleeve"
  | "hoodie"
  | "zip-hoodie"
  | "jacket"
  | "sweater"
  | "hat"
  | "accessory";

type ClosetItemCondition = "new" | "like_new" | "good" | "fair";

type ClosetDraft = {
  title: string;
  brand: string;
  itemType: "" | ClosetItemType;
  condition: "" | ClosetItemCondition;
  size: string;
  price: string;
  description: string;
};

const closetItemTypes: Array<{ value: ClosetItemType; label: string; category: string }> = [
  { value: "shoes", label: "Shoes", category: "Shoes" },
  { value: "pants", label: "Pants", category: "Pants" },
  { value: "shorts", label: "Shorts", category: "Shorts" },
  { value: "tshirt", label: "T-Shirt", category: "T-Shirts" },
  { value: "longsleeve", label: "Longsleeve", category: "Longsleeves" },
  { value: "hoodie", label: "Hoodie", category: "Sweatshirts & Hoodies" },
  { value: "zip-hoodie", label: "Zip Hoodie", category: "Sweatshirts & Hoodies" },
  { value: "sweater", label: "Sweater / Knit", category: "Sweaters" },
  { value: "jacket", label: "Jacket", category: "Outerwear" },
  { value: "hat", label: "Hat", category: "Accessories" },
  { value: "accessory", label: "Accessory", category: "Accessories" },
];

const closetItemConditions: Array<{ value: ClosetItemCondition; label: string; dbValue: string }> = [
  { value: "new", label: "New", dbValue: "New" },
  { value: "like_new", label: "Like new", dbValue: "Like New" },
  { value: "good", label: "Good", dbValue: "Good" },
  { value: "fair", label: "Fair", dbValue: "Fair" },
];

function closetSizeOptions(itemType: ClosetItemType) {
  if (itemType === "shoes") {
    return ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
  }

  if (itemType === "pants" || itemType === "shorts") {
    return ["28", "29", "30", "31", "32", "33", "34", "35", "36", "38", "40"];
  }

  if (itemType === "hat") {
    return ["One Size", "S/M", "M/L", "L/XL"];
  }

  return ["XS", "S", "M", "L", "XL", "XXL"];
}

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

function MessageComposeModal({
  open,
  onClose,
  recipient,
  product,
}: {
  open: boolean;
  onClose: () => void;
  recipient: UserProfile | null;
  product?: Product | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!recipient) {
      setError("Recipient is missing.");
      return;
    }

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Write a message before sending.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientProfileId: recipient.profileId,
          body: trimmed,
          productId: product?.id,
          productImageUrl: product?.images?.[0] ?? null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send your message.");
      }

      setSent(true);
      setBody("");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setError(null);
    setSent(false);
    setBody("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={recipient ? `Message ${recipient.name.split(" ")[0] || recipient.handle}` : "Send a message"}
    >
      {recipient ? (
        <div className="space-y-5">
          {product ? (
            <Link
              href={`/product/${product.id}`}
              className="group flex items-center gap-3 rounded-[24px] border border-black/10 bg-white p-4 transition hover:border-black"
            >
              <div className="relative h-16 w-14 overflow-hidden rounded-2xl border border-black/5 bg-neutral-50">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={product.images[0].startsWith("blob:")}
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">About</p>
                <p className="truncate font-semibold text-black transition group-hover:underline">{product.title}</p>
                <p className="text-sm text-neutral-500">{product.brand}</p>
              </div>
            </Link>
          ) : null}
          <div className="flex items-center gap-3 rounded-[24px] border border-black/10 bg-neutral-50 p-4">
            <Avatar user={recipient} className="h-12 w-12 text-sm" />
            <div>
              <p className="font-semibold text-black">{recipient.name}</p>
              <p className="text-sm text-neutral-500">{recipient.handle}</p>
            </div>
          </div>
          {sent ? (
            <div className="space-y-4">
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Message sent. {recipient.name.split(" ")[0] || "They"} will see it in their inbox.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/messages"
                  className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                >
                  Open messages
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-black"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`Write a note to ${recipient.name.split(" ")[0] || recipient.handle}...`}
                rows={5}
                className="w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              />
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {sending ? "Sending..." : "Send message"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

function PurchaseModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState<"test" | "live" | null>(null);

  async function handlePurchase() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; checkoutUrl?: string; mode?: "stripe" | "test" }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to complete purchase.");
      }

      if (payload?.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      setSuccess(true);
      setSuccessMode(payload?.mode === "test" ? "test" : "live");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to complete purchase.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setError(null);
    setSuccess(false);
    setSuccessMode(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirm purchase">
      <div className="space-y-5">
        <div className="rounded-[24px] border border-black/10 bg-neutral-50 p-4">
          <div className="flex items-start gap-4">
            <ProductImage src={product.images[0]} alt={product.title} className="h-24 w-20 rounded-2xl" sizes="80px" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-500">{product.brand}</p>
              <p className="mt-1 font-semibold text-black">{product.title}</p>
              <p className="mt-3 text-xl font-semibold text-black">{formatMoney(product.price)}</p>
            </div>
          </div>
        </div>

        {success ? (
          <div className="space-y-4">
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              {successMode === "test"
                ? "Test purchase complete. This listing is now marked as sold."
                : "Purchase complete. This listing is now marked as sold."}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              Confirm your purchase to mark this listing sold and remove it from active buying.
            </p>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={submitting}
                className="flex-1 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {submitting ? "Processing..." : `Pay ${formatMoney(product.price)}`}
              </button>
            </div>
          </>
        )}
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

function VoteButtons({ productId }: { productId: number }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  // Deterministic seed counts so each card looks populated
  const baseUp = ((productId * 13) % 23) + 9;
  const baseDown = ((productId * 7) % 9) + 2;
  const upvotes = baseUp + (vote === "up" ? 1 : 0);
  const downvotes = baseDown + (vote === "down" ? 1 : 0);

  function handleVote(direction: "up" | "down", event: React.MouseEvent) {
    event.preventDefault();
    // Stop the click from bubbling to the ProductCard wrapper, which would
    // navigate to the product page and discard the vote.
    event.stopPropagation();
    setVote((current) => (current === direction ? null : direction));
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      <button
        type="button"
        onClick={(e) => handleVote("up", e)}
        aria-label="Upvote authenticity"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] transition",
          vote === "up"
            ? "border-black bg-black text-white"
            : "border-black/10 text-neutral-500 hover:border-black/30 hover:text-black",
        )}
      >
        <ThumbsUp className="h-3 w-3 shrink-0" />
        <span>LOOKS GOOD</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", vote === "up" ? "bg-white/20" : "bg-black/5")}>
          {upvotes}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => handleVote("down", e)}
        aria-label="Downvote authenticity"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] transition",
          vote === "down"
            ? "border-black bg-black text-white"
            : "border-black/10 text-neutral-500 hover:border-black/30 hover:text-black",
        )}
      >
        <ThumbsDown className="h-3 w-3 shrink-0" />
        <span>NO GOOD</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", vote === "down" ? "bg-white/20" : "bg-black/5")}>
          {downvotes}
        </span>
      </button>
    </div>
  );
}

function ProductQuickViewModal({
  open,
  onClose,
  product,
  seller,
  favorite,
  onToggleFavorite,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  seller?: UserProfile;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Quick view">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            className="aspect-[4/5] w-full rounded-[28px]"
            sizes="(min-width: 1024px) 340px, 100vw"
          />
          {product.images.length > 1 ? (
            <div className="grid grid-cols-3 gap-2">
              {product.images.slice(0, 3).map((image, index) => (
                <div key={`${product.id}-quick-${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                  <Image src={image} alt={`${product.title} view ${index + 1}`} fill className="object-cover" sizes="96px" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col">
          <div>
            <Link
              href={`/brands/${slugifyBrand(product.brand)}`}
              onClick={onClose}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 transition hover:text-black"
            >
              {product.brand}
            </Link>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-black">{product.title}</h3>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{product.subtitle}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-neutral-600">
              Size {product.size}
            </span>
            <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-neutral-600">
              {product.condition}
            </span>
            <VerificationPill status={product.verificationStatus} />
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl font-semibold tracking-tight text-black">{formatMoney(product.price)}</span>
              {product.originalPrice ? (
                <span className="pb-1 text-lg text-neutral-400 line-through">{formatMoney(product.originalPrice)}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-400">{product.location}</p>
          </div>

          {seller ? (
            <Link
              href={`/user/${seller.id}`}
              onClick={onClose}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 bg-neutral-50 p-4 transition hover:border-black"
            >
              <Avatar user={seller} className="h-11 w-11 text-sm" />
              <div className="min-w-0">
                <p className="font-semibold text-black">{seller.name}</p>
                <p className="text-sm text-neutral-500">
                  {seller.handle} · {seller.completedTrades} trades · {seller.responseRate} response
                </p>
              </div>
            </Link>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-neutral-500">
            {product.details.slice(0, 4).map((detail) => (
              <div key={detail.label} className="rounded-2xl border border-black/8 px-3 py-2">
                <p className="uppercase tracking-[0.16em] text-neutral-400">{detail.label}</p>
                <p className="mt-1 font-semibold text-black">{detail.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-[1fr_auto]">
            <Link
              href={`/product/${product.id}`}
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <ShoppingBag className="h-4 w-4" />
              View listing
            </Link>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition",
                favorite ? "border-black bg-black text-white" : "border-black/15 text-black hover:border-black",
              )}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
              {favorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ProductCard({
  product,
  seller,
  showSeller = false,
  showVotes = false,
}: {
  product: Product;
  seller?: UserProfile;
  showSeller?: boolean;
  showVotes?: boolean;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const favorite = isFavorite(product.id);
  const displayBadge = product.badge && product.badge !== "UNDER RETAIL" ? product.badge : undefined;

  return (
    <>
      <div
        className="group cursor-pointer"
        onClick={() => router.push(`/product/${product.id}`)}
      >
        <div className="space-y-3">
          <div className="relative">
            <ProductImage
              src={product.images[0]}
              alt={product.title}
              className="aspect-[4/5] w-full rounded-[28px] border border-black/5 transition group-hover:border-black/10"
            />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {displayBadge ? (
                <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
                  {displayBadge}
                </span>
              ) : null}
            </div>
            {product.soldAt ? (
              <span className="absolute left-3 bottom-3 rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
                SOLD
              </span>
            ) : null}
            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              {product.moderationStatus !== "approved" ? <ModerationPill status={product.moderationStatus} /> : null}
              {product.verificationStatus === "verified" ? <VerificationPill status={product.verificationStatus} /> : null}
            </div>
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setQuickViewOpen(true);
                }}
                className="inline-flex translate-y-1 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-black opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
              >
                <Eye className="h-3.5 w-3.5" />
                Quick view
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void toggleFavorite(product.id);
                }}
                className="rounded-full border border-black/10 bg-white p-2 shadow-sm transition hover:bg-black hover:text-white"
                aria-label="Toggle favorite"
              >
                <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {showSeller && seller ? (
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                {product.listingTime} · {seller.handle}
              </p>
            ) : null}
            <div>
              <Link
                href={`/brands/${slugifyBrand(product.brand)}`}
                onClick={(e) => e.stopPropagation()}
                className="block text-sm font-semibold text-black hover:underline"
              >
                {product.brand}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-neutral-600">{product.title}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                Size {product.size}
              </span>
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                {product.condition}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-black">{formatMoney(product.price)}</span>
              {product.originalPrice ? (
                <span className="text-neutral-400 line-through">{formatMoney(product.originalPrice)}</span>
              ) : null}
            </div>
            {seller ? (
              <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-neutral-500">
                <Avatar user={seller} className="h-5 w-5 text-[8px]" />
                <span>{seller.completedTrades} trades</span>
                <span>·</span>
                <span>{seller.responseRate} response</span>
              </div>
            ) : null}
            {showVotes ? <VoteButtons productId={product.id} /> : null}
          </div>
        </div>
      </div>
      <ProductQuickViewModal
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={product}
        seller={seller}
        favorite={favorite}
        onToggleFavorite={() => void toggleFavorite(product.id)}
      />
    </>
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

// ── Points tier helpers ────────────────────────────────────────────────────
const TIERS = [
  { name: "Bronze",   min: 0,    max: 499,   next: 500,  color: "text-orange-700",  ring: "ring-orange-200",  bg: "bg-orange-50"  },
  { name: "Silver",   min: 500,  max: 1999,  next: 2000, color: "text-neutral-500", ring: "ring-neutral-300", bg: "bg-neutral-50" },
  { name: "Gold",     min: 2000, max: 4999,  next: 5000, color: "text-amber-600",   ring: "ring-amber-200",   bg: "bg-amber-50"   },
  { name: "Platinum", min: 5000, max: Infinity, next: Infinity, color: "text-sky-500", ring: "ring-sky-200", bg: "bg-sky-50" },
] as const;

function getTier(pts: number) {
  return TIERS.find((t) => pts >= t.min && pts <= t.max) ?? TIERS[0]!;
}

function PointsCard({ points, linkToRewards = false }: { points: number; linkToRewards?: boolean }) {
  const tier = getTier(points);
  const isMax = tier.name === "Platinum";
  const progress = isMax ? 1 : (points - tier.min) / (tier.next - tier.min);
  const toNext = isMax ? 0 : tier.next - points;

  const inner = (
    <div className={cn("mt-6 rounded-[28px] border bg-white p-6 ring-1 transition", tier.ring)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Barter Points
          </p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-black">
            ◆ {points.toLocaleString()}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest",
            tier.bg,
            tier.color,
          )}
        >
          {tier.name}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
          <div
            className="h-full rounded-full bg-black transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-neutral-400">
          {isMax ? "Maximum tier reached" : `${toNext.toLocaleString()} pts to ${TIERS[TIERS.findIndex((t) => t.name === tier.name) + 1]?.name}`}
        </p>
      </div>

      {linkToRewards && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-black">
          View rewards &amp; exchange
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );

  return linkToRewards ? <Link href="/rewards">{inner}</Link> : inner;
}

function BrandDiscoveryRow() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollTrack(direction: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const delta = Math.max(track.clientWidth * 0.7, 320);
    track.scrollBy({ left: direction === "next" ? delta : -delta, behavior: "smooth" });
  }

  return (
    <section className="w-full px-6 sm:px-10 lg:px-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Brand Discovery</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">Search by brand</h2>
        </div>
        <Link
          href="/brands"
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 transition hover:text-black"
        >
          Browse all brands →
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => scrollTrack("prev")}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 text-black transition hover:bg-black hover:text-white"
          aria-label="Previous brands"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={trackRef}
          className="flex flex-1 items-center gap-20 overflow-x-auto scroll-smooth py-4 sm:gap-24 lg:gap-32 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brandDiscoveryLogos.map((brand) => (
            <Link
              key={brand.name}
              href={brand.href}
              aria-label={`Shop ${brand.name}`}
              className="group flex shrink-0 items-center justify-center"
            >
              <Image
                src={brand.src}
                alt={brand.name}
                width={brand.width}
                height={brand.height}
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 360px, 420px"
                className={cn(
                  "object-contain transition group-hover:opacity-70",
                  brand.imageClassName,
                )}
              />
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollTrack("next")}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 text-black transition hover:bg-black hover:text-white"
          aria-label="Next brands"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

export function HomePage({
  heroSlides,
  featuredProducts,
  stats,
  sellersById,
  viewer,
}: {
  heroSlides: HeroSlide[];
  featuredProducts: Product[];
  stats: MarketplaceStats;
  sellersById: Record<string, UserProfile | undefined>;
  viewer: Viewer | null;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dailyPicksRef = useRef<HTMLDivElement>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // No rotation for 0 or 1 slides — `% 0` would be NaN and a lone slide needn't cycle.
    if (heroSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % heroSlides.length);
    }, 3200);
  }, [heroSlides.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  function goTo(index: number) {
    setCurrentSlide(index);
    startTimer();
  }

  function scrollDailyPicks(direction: -1 | 1) {
    const track = dailyPicksRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    track.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <div className="-mt-24 space-y-16 pb-16 sm:-mt-28">
      <div>
      <section className="relative isolate overflow-hidden bg-black text-white">
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
                onClick={() => goTo(index)}
                className={cn("h-2 rounded-full transition-all", currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50")}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo((currentSlide - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 rounded-full border border-white/20 p-3 transition hover:bg-white/10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo((currentSlide + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 rounded-full border border-white/20 p-3 transition hover:bg-white/10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ── Current-members banner ──────────────────────────────── */}
      <div className="relative flex w-full items-center overflow-hidden border-y border-black/6 bg-[#f4f1ec] py-2.5">
        {/* fade edges */}
        <div className="pointer-events-none absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-[#f4f1ec] to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-[#f4f1ec] to-transparent" />

        {/* pinned label */}
        <span className="relative z-20 shrink-0 bg-[#f4f1ec] pl-5 pr-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-black">
          Current Members
        </span>

        {/* scrolling track — doubled for seamless loop */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="flex w-max items-center gap-8"
            style={{ animation: "marquee 55s linear infinite" }}
          >
            {[...allUsers, ...allUsers, ...allUsers, ...allUsers].map((user, i) => (
              <span
                key={`${user.id}-${i}`}
                title={user.handle}
                className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-black"
              >
                {user.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Founding-member banner ──────────────────────────────── */}
      <Link
        href="/login"
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden bg-[#1a1212] px-6 py-4 text-white transition hover:bg-[#231818]"
      >
        {/* subtle shimmer sweep */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {/* pulsing dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>

        <p className="text-center text-[13px] font-semibold tracking-[0.12em]">
          FOUNDING MEMBERS&nbsp;·&nbsp;
          <span className="text-white/70 font-normal">First 1,000 sign-ups trade at</span>
          {" "}
          <span className="underline underline-offset-2 decoration-white/40">0% transaction fee</span>
          {" "}
          <span className="text-white/70 font-normal">— forever.</span>
        </p>

        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
      </div>

      <BrandDiscoveryRow />

      <section className="grid w-full gap-6 px-6 sm:px-10 md:grid-cols-3 lg:px-16">
        <StatCard label="Active Listings" value={String(stats.activeListings)} />
        <StatCard label="Core Brands" value={String(stats.coreBrands)} />
        <StatCard label="Average Ask" value={formatMoney(stats.averageAsk)} />
      </section>

      <section className="w-full px-6 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Daily Picks</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">Real pieces, ready to trade</h2>
          </div>
          <Link
            href="/products?view=all"
            className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 transition hover:text-black"
          >
            Browse all listings →
          </Link>
        </div>
        <div className="relative">
          {featuredProducts.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => scrollDailyPicks(-1)}
                className="absolute left-0 top-[38%] z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                aria-label="Show previous daily pick"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollDailyPicks(1)}
                className="absolute right-0 top-[38%] z-10 flex h-12 w-12 translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                aria-label="Show next daily pick"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
          <div
            ref={dailyPicksRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-[82vw] shrink-0 snap-start sm:w-[42vw] lg:w-[27vw] xl:w-[18.5vw]">
                <ProductCard product={product} seller={sellersById[product.sellerId]} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community hero ──────────────────────────────────────── */}
      <section className="w-full overflow-hidden bg-[#1a1212]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">

            {/* Left — text + CTAs */}
            <div className="text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
                Community
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Trade with people who<br className="hidden sm:block" /> know the pieces.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">
                Barter is built around collectors who take their closets seriously.
                Join brand communities, post trade requests, and connect with the
                people moving the pieces you care about.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={viewer ? "/communities" : "/login"}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
                >
                  {viewer ? "Browse Communities" : "Join the Community"}
                </Link>
                {!viewer && (
                  <Link
                    href="/communities"
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Browse Communities
                  </Link>
                )}
              </div>

              {/* Social proof */}
              <div className="mt-10 flex gap-8 border-t border-white/10 pt-8">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-white">2,400+</p>
                  <p className="mt-0.5 text-xs text-white/40 uppercase tracking-widest">Members</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-white">7</p>
                  <p className="mt-0.5 text-xs text-white/40 uppercase tracking-widest">Brand Communities</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-white">340+</p>
                  <p className="mt-0.5 text-xs text-white/40 uppercase tracking-widest">Posts this week</p>
                </div>
              </div>
            </div>

            {/* Right — staggered product image collage */}
            <div className="hidden grid-cols-2 gap-3 lg:grid">
              <div className="space-y-3">
                <div className="h-52 overflow-hidden rounded-2xl">
                  <ProductImage
                    src="/products/chrome-hearts-hoodie-1.jpg"
                    alt="Chrome Hearts"
                    className="h-52 w-full rounded-none"
                    sizes="25vw"
                  />
                </div>
                <div className="h-36 overflow-hidden rounded-2xl">
                  <ProductImage
                    src="/products/maison-margiela-tabi-1.jpg"
                    alt="Maison Margiela"
                    className="h-36 w-full rounded-none"
                    sizes="25vw"
                  />
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <div className="h-36 overflow-hidden rounded-2xl">
                  <ProductImage
                    src="/products/balenciaga-triple-s-1.jpg"
                    alt="Balenciaga"
                    className="h-36 w-full rounded-none"
                    sizes="25vw"
                  />
                </div>
                <div className="h-52 overflow-hidden rounded-2xl">
                  <ProductImage
                    src="/products/supreme-mike-kelley-hoodie-1.jpg"
                    alt="Supreme"
                    className="h-52 w-full rounded-none"
                    sizes="25vw"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

export function ProductsPage({
  products,
  brand,
  initialFilters = defaultProductSearchFilters,
  initialShowAll = false,
  sellersById,
}: {
  products: Product[];
  brand?: BrandDirectoryEntry;
  initialFilters?: ProductSearchFilters;
  initialShowAll?: boolean;
  sellersById: Record<string, UserProfile | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialFilters.q);
  const [openFilter, setOpenFilter] = useState<ProductFilterMenuId | null>(null);
  const pageSize = 9;

  const activeFilters = useMemo<ProductSearchFilters>(() => {
    const page = Number(searchParams.get("page"));
    const sort = searchParams.get("sort") as ProductSortOption | null;

    return {
      q: searchParams.get("q") ?? initialFilters.q,
      brand: searchParams.get("brand") ?? initialFilters.brand,
      category: searchParams.get("category") ?? initialFilters.category,
      condition: searchParams.get("condition") ?? initialFilters.condition,
      verified: (searchParams.get("verified") ?? String(initialFilters.verified)) === "true",
      tradeReady: (searchParams.get("tradeReady") ?? String(initialFilters.tradeReady)) === "true",
      size: searchParams.get("size") ?? initialFilters.size,
      minPrice: searchParams.get("minPrice") ?? initialFilters.minPrice,
      maxPrice: searchParams.get("maxPrice") ?? initialFilters.maxPrice,
      sort: sort ?? initialFilters.sort,
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : initialFilters.page,
    };
  }, [initialFilters, searchParams]);

  useEffect(() => {
    const syncInput = window.setTimeout(() => {
      setQuery(activeFilters.q);
    }, 0);

    return () => window.clearTimeout(syncInput);
  }, [activeFilters.q]);

  const updateFilters = useCallback(
    (changes: Partial<Record<keyof ProductSearchFilters, string | number | boolean | null>>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === "" || value === false || (key === "page" && value === 1)) {
          next.delete(key);
          return;
        }

        next.set(key, String(value));
      });

      if (!("page" in changes)) {
        next.delete("page");
      }

      const href = next.toString() ? `/products?${next.toString()}` : "/products";
      router.push(href, { scroll: false });
    },
    [router, searchParams],
  );

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    trackEvent({ name: "marketplace_search_submitted", payload: { source: "products", query: nextQuery } });
    updateFilters({ q: nextQuery || null });
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = activeFilters.q.trim().toLowerCase();

    const filtered = products.filter((product) => {
      if (activeFilters.verified && product.verificationStatus !== "verified") {
        return false;
      }

      if (activeFilters.tradeReady && product.soldAt) {
        return false;
      }

      if (activeFilters.brand && product.brand.toLowerCase() !== activeFilters.brand.toLowerCase()) {
        return false;
      }

      if (activeFilters.category && product.category.toLowerCase() !== activeFilters.category.toLowerCase()) {
        return false;
      }

      if (activeFilters.condition && product.condition.toLowerCase() !== activeFilters.condition.toLowerCase()) {
        return false;
      }

      if (activeFilters.size && product.size.toLowerCase() !== activeFilters.size.toLowerCase()) {
        return false;
      }

      const minPrice = Number(activeFilters.minPrice);
      const maxPrice = Number(activeFilters.maxPrice);

      if (Number.isFinite(minPrice) && minPrice > 0 && product.price < minPrice) {
        return false;
      }

      if (Number.isFinite(maxPrice) && maxPrice > 0 && product.price > maxPrice) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [product.brand, product.title, product.category, product.color, product.subtitle, product.size, product.condition]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...filtered].sort((a, b) => {
      if (activeFilters.sort === "price-asc") return a.price - b.price;
      if (activeFilters.sort === "price-desc") return b.price - a.price;
      if (activeFilters.sort === "watched") return (b.id * 17) % 41 - (a.id * 17) % 41;
      return new Date(b.createdAt ?? "2024-01-01").getTime() - new Date(a.createdAt ?? "2024-01-01").getTime();
    });
  }, [activeFilters, products]);

  const uniqueSizes = useMemo(
    () => Array.from(new Set(products.map((product) => product.size))).sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const uniqueBrands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const uniqueConditions = useMemo(
    () => Array.from(new Set(products.map((product) => product.condition))).sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const optionCounts = useMemo(() => {
    function countsFor(getValue: (product: Product) => string) {
      return products.reduce<Record<string, number>>((counts, product) => {
        const value = getValue(product);
        counts[value] = (counts[value] ?? 0) + 1;
        return counts;
      }, {});
    }

    return {
      brand: countsFor((product) => product.brand),
      category: countsFor((product) => product.category),
      size: countsFor((product) => product.size),
      condition: countsFor((product) => product.condition),
      verified: products.filter((product) => product.verificationStatus === "verified").length,
      tradeReady: products.filter((product) => !product.soldAt).length,
    };
  }, [products]);
  const showAllListings = (searchParams.get("view") ?? (initialShowAll ? "all" : "")) === "all";
  const visibleProducts = showAllListings ? filteredProducts : filteredProducts.slice(0, activeFilters.page * pageSize);
  const hasMoreProducts = !showAllListings && visibleProducts.length < filteredProducts.length;
  const activeFilterItems = [
    activeFilters.q ? { key: "q", label: `Search: ${activeFilters.q}` } : null,
    activeFilters.brand ? { key: "brand", label: `Brand: ${activeFilters.brand}` } : null,
    activeFilters.category ? { key: "category", label: `Type: ${activeFilters.category}` } : null,
    activeFilters.size ? { key: "size", label: `Size: ${activeFilters.size}` } : null,
    activeFilters.condition ? { key: "condition", label: `Condition: ${activeFilters.condition}` } : null,
    activeFilters.minPrice || activeFilters.maxPrice
      ? {
          key: "price",
          label: `Price: ${activeFilters.minPrice ? formatMoney(Number(activeFilters.minPrice)) : "$0"}-${
            activeFilters.maxPrice ? formatMoney(Number(activeFilters.maxPrice)) : "Any"
          }`,
        }
      : null,
    activeFilters.verified ? { key: "verified", label: "Verified" } : null,
    activeFilters.tradeReady ? { key: "tradeReady", label: "Trade-ready" } : null,
  ].filter((item): item is { key: string; label: string } => Boolean(item));
  const activeFilterCount = activeFilterItems.length;
  const hasActiveFilters = activeFilterCount > 0 || activeFilters.sort !== "latest";
  const brandActiveCount = activeFilters.brand ? 1 : 0;
  const categoryActiveCount = activeFilters.category ? 1 : 0;
  const sizeActiveCount = activeFilters.size ? 1 : 0;
  const conditionActiveCount = activeFilters.condition ? 1 : 0;
  const priceActiveCount = activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0;
  const buyingFormatActiveCount = Number(activeFilters.tradeReady) + Number(activeFilters.verified);

  function clearAppliedFilter(key: string) {
    if (key === "price") {
      updateFilters({ minPrice: null, maxPrice: null });
      return;
    }

    updateFilters({ [key]: null } as Partial<Record<keyof ProductSearchFilters, string | number | boolean | null>>);
  }

  function clearAllFilters() {
    updateFilters({
      q: null,
      brand: null,
      category: null,
      condition: null,
      verified: null,
      tradeReady: null,
      size: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      page: null,
    });
    setOpenFilter(null);
  }

  function renderOptionList(
    filterKey: keyof Pick<ProductSearchFilters, "brand" | "category" | "size" | "condition">,
    options: string[],
    label: string,
    counts: Record<string, number>,
  ) {
    const activeValue = activeFilters[filterKey];
    const allLabel = `All ${label.toLowerCase()}${label.endsWith("s") ? "" : "s"}`;

    return (
      <div className="min-w-72 p-3">
        <div className="px-2 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-black">
            {activeValue ? activeValue : allLabel}
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              updateFilters({ [filterKey]: null });
              setOpenFilter(null);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
              activeValue ? "text-neutral-500 hover:bg-black/5 hover:text-black" : "bg-black text-white",
            )}
        >
            <span>{allLabel}</span>
            <span className="flex items-center gap-2">
              <span className={cn("text-xs", activeValue ? "text-neutral-400" : "text-white/60")}>{products.length}</span>
              {!activeValue ? <Check className="h-4 w-4" /> : null}
            </span>
          </button>
          {options.map((option) => {
            const active = activeValue === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  updateFilters({ [filterKey]: active ? null : option });
                  setOpenFilter(null);
                }}
                className={cn(
                  "mt-1 flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  active ? "bg-black text-white" : "text-neutral-600 hover:bg-black/5 hover:text-black",
                )}
              >
                <span className="truncate">{option}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={cn("text-xs", active ? "text-white/60" : "text-neutral-400")}>{counts[option] ?? 0}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderFilterSummaryButton({
    id,
    label,
    value,
    count,
  }: {
    id: ProductFilterMenuId;
    label: string;
    value: string;
    count: number;
  }) {
    return (
      <button
        type="button"
        onClick={() => setOpenFilter(id)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/8 px-4 py-3 text-left transition hover:border-black/20 hover:bg-black/5"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</span>
          <span className="mt-1 block text-sm font-semibold text-black">{value}</span>
        </span>
        {count ? (
          <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">{count}</span>
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        )}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <span>{brand ? brand.name : showAllListings ? "All listings" : "Designer Market"}</span>
      </nav>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">
            {brand ? `${brand.name} listings` : showAllListings ? "All listings" : "Curated designer listings"}
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            {brand
              ? brand.description
              : showAllListings
                ? "Every active piece currently available on Barter, ready to scan, filter, and discover."
                : "Chrome Hearts, Supreme, Balenciaga, Maison Margiela, and Enfants Riches Deprimes with real listings and member-owned closets."}
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the marketplace"
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-24 text-sm outline-none transition focus:border-black"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
      </div>
      <div className="mb-8 space-y-4 border-y border-black/8 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3 pb-1">
            {activeFilterCount ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === "applied" ? null : "applied")}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-black bg-[#1a1212] px-5 text-sm font-semibold text-white ring-2 ring-blue-500 transition"
                >
                  {`${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`}
                  <ChevronDown className={cn("h-4 w-4 transition", openFilter === "applied" && "rotate-180")} />
                </button>
                {openFilter === "applied" ? (
                  <div className="absolute left-0 top-[calc(100%+0.75rem)] z-30 min-w-72 rounded-[28px] border border-black/10 bg-white p-4 shadow-xl">
                    <div className="space-y-3">
                      {activeFilterItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => clearAppliedFilter(item.key)}
                          className="flex w-full items-center justify-between gap-4 rounded-full bg-[#1a1212] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-black"
                        >
                          {item.label}
                          <X className="h-4 w-4" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="w-full rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-neutral-500 transition hover:border-black hover:text-black"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!brand ? (
              <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="brand" label="Brand" count={brandActiveCount}>
                {renderOptionList("brand", uniqueBrands, "Brand", optionCounts.brand)}
              </ProductFilterPill>
            ) : null}

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="category" label="Type" count={categoryActiveCount}>
              {renderOptionList("category", uniqueCategories, "Type", optionCounts.category)}
            </ProductFilterPill>

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="size" label="Size" count={sizeActiveCount}>
              {renderOptionList("size", uniqueSizes, "Size", optionCounts.size)}
            </ProductFilterPill>

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="condition" label="Condition" count={conditionActiveCount}>
              {renderOptionList("condition", uniqueConditions, "Condition", optionCounts.condition)}
            </ProductFilterPill>

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="price" label="Price" count={priceActiveCount ? 1 : 0}>
              <div className="min-w-80 p-4">
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Price</p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {activeFilters.minPrice || activeFilters.maxPrice
                      ? `${activeFilters.minPrice ? formatMoney(Number(activeFilters.minPrice)) : "$0"} to ${
                          activeFilters.maxPrice ? formatMoney(Number(activeFilters.maxPrice)) : "any price"
                        }`
                      : "Any price"}
                  </p>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Under $250", minPrice: null, maxPrice: "250" },
                    { label: "$250-$500", minPrice: "250", maxPrice: "500" },
                    { label: "$500-$1,000", minPrice: "500", maxPrice: "1000" },
                    { label: "$1,000+", minPrice: "1000", maxPrice: null },
                  ].map((range) => {
                    const active = activeFilters.minPrice === (range.minPrice ?? "") && activeFilters.maxPrice === (range.maxPrice ?? "");
                    return (
                      <button
                        key={range.label}
                        type="button"
                        onClick={() => {
                          updateFilters({ minPrice: range.minPrice, maxPrice: range.maxPrice });
                          setOpenFilter(null);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-semibold transition",
                          active
                            ? "border-black bg-black text-white"
                            : "border-black/10 text-neutral-600 hover:border-black hover:text-black",
                        )}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Min
                    <input
                      inputMode="numeric"
                      value={activeFilters.minPrice}
                      onChange={(event) => updateFilters({ minPrice: event.target.value.replace(/[^\d]/g, "") || null })}
                      placeholder="$0"
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-black outline-none focus:border-black"
                    />
                  </label>
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Max
                    <input
                      inputMode="numeric"
                      value={activeFilters.maxPrice}
                      onChange={(event) => updateFilters({ maxPrice: event.target.value.replace(/[^\d]/g, "") || null })}
                      placeholder="Any"
                      className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-black outline-none focus:border-black"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateFilters({ minPrice: null, maxPrice: null });
                    setOpenFilter(null);
                  }}
                  className="mt-3 w-full rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-neutral-500 transition hover:border-black hover:text-black"
                >
                  Clear price
                </button>
              </div>
            </ProductFilterPill>

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="buyingFormat" label="Buying Format" count={buyingFormatActiveCount}>
              <div className="min-w-72 p-3">
                <div className="px-2 pb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Buying Format</p>
                  <p className="mt-1 text-sm font-semibold text-black">Trust and trade preferences</p>
                </div>
                {[
                  {
                    label: "Verified",
                    description: "Authenticated or approved listings",
                    key: "verified" as const,
                    active: activeFilters.verified,
                    count: optionCounts.verified,
                  },
                  {
                    label: "Trade-ready",
                    description: "Available pieces open for action",
                    key: "tradeReady" as const,
                    active: activeFilters.tradeReady,
                    count: optionCounts.tradeReady,
                  },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      const nextValue = !filter.active;
                      trackEvent({
                        name: "marketplace_filter_changed",
                        payload: { source: "products", filter: filter.key, value: nextValue },
                      });
                      updateFilters({ [filter.key]: nextValue });
                    }}
                    className={cn(
                      "mt-1 flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                      filter.active ? "bg-black text-white" : "text-neutral-600 hover:bg-black/5 hover:text-black",
                    )}
                  >
                    <span>
                      <span className="block">{filter.label}</span>
                      <span className={cn("mt-0.5 block text-xs font-medium", filter.active ? "text-white/60" : "text-neutral-400")}>
                        {filter.description}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn("text-xs", filter.active ? "text-white/60" : "text-neutral-400")}>{filter.count}</span>
                      {filter.active ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                ))}
              </div>
            </ProductFilterPill>

            <ProductFilterPill openFilter={openFilter} setOpenFilter={setOpenFilter} id="all" label="All Filters">
              <div className="max-h-[70vh] min-w-[340px] overflow-y-auto p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <SlidersHorizontal className="h-4 w-4" />
                  All filters
                </div>
                <div className="mt-4 space-y-2">
                  {!brand
                    ? renderFilterSummaryButton({
                        id: "brand",
                        label: "Brand",
                        value: activeFilters.brand || "All brands",
                        count: brandActiveCount,
                      })
                    : null}
                  {renderFilterSummaryButton({
                    id: "category",
                    label: "Type",
                    value: activeFilters.category || "All types",
                    count: categoryActiveCount,
                  })}
                  {renderFilterSummaryButton({
                    id: "size",
                    label: "Size",
                    value: activeFilters.size || "All sizes",
                    count: sizeActiveCount,
                  })}
                  {renderFilterSummaryButton({
                    id: "condition",
                    label: "Condition",
                    value: activeFilters.condition || "All conditions",
                    count: conditionActiveCount,
                  })}
                  {renderFilterSummaryButton({
                    id: "price",
                    label: "Price",
                    value:
                      activeFilters.minPrice || activeFilters.maxPrice
                        ? `${activeFilters.minPrice ? formatMoney(Number(activeFilters.minPrice)) : "$0"} to ${
                            activeFilters.maxPrice ? formatMoney(Number(activeFilters.maxPrice)) : "any price"
                          }`
                        : "Any price",
                    count: priceActiveCount ? 1 : 0,
                  })}
                  {renderFilterSummaryButton({
                    id: "buyingFormat",
                    label: "Buying format",
                    value:
                      buyingFormatActiveCount > 0
                        ? [
                            activeFilters.verified ? "Verified" : null,
                            activeFilters.tradeReady ? "Trade-ready" : null,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "All listings",
                    count: buyingFormatActiveCount,
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeFilterItems.length ? (
                    activeFilterItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => clearAppliedFilter(item.key)}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white"
                      >
                        {item.label}
                        <X className="h-3 w-3" />
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No filters selected.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 w-full rounded-full border border-black px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                >
                  Clear all filters
                </button>
              </div>
            </ProductFilterPill>
          </div>

          <label className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-black">
            <span className="text-lg leading-none">↕</span>
            <span>Sort:</span>
            <select
              value={activeFilters.sort}
              onChange={(event) => {
                trackEvent({
                  name: "marketplace_filter_changed",
                  payload: { source: "products", filter: "sort", value: event.target.value },
                });
                updateFilters({ sort: event.target.value === "latest" ? null : event.target.value });
              }}
              className="appearance-none bg-transparent pr-6 text-sm font-semibold outline-none"
            >
              <option value="latest">Latest</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="watched">Most watched</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4" />
          </label>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
          {filteredProducts.length} matching {filteredProducts.length === 1 ? "piece" : "pieces"}
        </p>
      </div>
      {filteredProducts.length ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} seller={sellersById[product.sellerId]} showSeller />
            ))}
          </div>
          {hasMoreProducts ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => updateFilters({ page: activeFilters.page + 1 })}
                className="rounded-full border border-black px-6 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                Load more
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="text-lg font-semibold tracking-tight text-black">No pieces matched that search.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
            Try clearing one filter or searching a broader brand, size, color, or category.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BrandGrid({
  brands,
  heading,
  subheading,
}: {
  brands: BrandDirectoryEntry[];
  heading: string;
  subheading: string;
}) {
  const { isJoined } = useCommunities();
  const logoBySlug = Object.fromEntries(
    brandDiscoveryLogos.map((l) => [l.href.replace("/brands/", ""), l]),
  );

  return (
    <>
      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-black">{heading}</h1>
      <p className="mb-10 text-sm uppercase tracking-[0.18em] text-neutral-500">{subheading}</p>

      <div className="grid grid-cols-1 gap-px border border-black/8 bg-black/8 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => {
          const logo = logoBySlug[brand.slug];
          const joined = isJoined(brand.slug);
          return (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group relative flex flex-col gap-6 bg-white p-8 transition hover:bg-neutral-50"
            >
              {joined && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                  <Check className="h-2.5 w-2.5" /> Member
                </span>
              )}
              {/* Logo area */}
              <div className="flex h-20 items-center">
                {logo ? (
                  <Image
                    src={logo.src}
                    alt={brand.name}
                    width={logo.width}
                    height={logo.height}
                    className="max-h-14 w-auto max-w-[200px] object-contain opacity-80 transition group-hover:opacity-100"
                    sizes="200px"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-tight text-black">{brand.name}</span>
                )}
              </div>
              {/* Text */}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-semibold tracking-tight text-black">{brand.name}</h2>
                {brand.tagline ? (
                  <p className="text-sm text-neutral-500">{brand.tagline}</p>
                ) : null}
              </div>
              <span className="mt-auto text-xs font-semibold tracking-[0.12em] uppercase text-black/40 transition group-hover:text-black">
                Explore →
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function BrandsIndexPage({ brands }: { brands: BrandDirectoryEntry[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span>Brands</span>
      </nav>
      <BrandGrid
        brands={brands}
        heading="Brands"
        subheading="Authenticated designer pieces, ready to trade"
      />
    </div>
  );
}

export function ArchiveIndexPage({ entries }: { entries: import("@/lib/marketplace-types").ArchiveBrandEntry[] }) {
  const logoBySlug = Object.fromEntries(
    brandDiscoveryLogos.map((l) => [l.href.replace("/brands/", ""), l]),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span>Archive</span>
      </nav>

      <h1 className="mb-2 text-4xl font-semibold tracking-tight text-black">Archive</h1>
      <p className="mb-10 text-sm uppercase tracking-[0.18em] text-neutral-500">
        Seasonal catalog — browse by brand and season
      </p>

      <div className="grid grid-cols-1 gap-px border border-black/8 bg-black/8 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ brand, pieceCount, yearMin, yearMax, seasons }) => {
          const logo = logoBySlug[brand.slug];
          const yearRange =
            yearMin && yearMax
              ? yearMin === yearMax
                ? String(yearMin)
                : `${yearMin}–${yearMax}`
              : null;
          // Up to 4 most-recent unique season labels
          const seasonChips = seasons.slice(0, 4).map((s) => s.label);

          return (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}/archive`}
              className="group relative flex flex-col gap-5 bg-white p-8 transition hover:bg-neutral-50"
            >
              {/* Brand logo */}
              <div className="flex h-16 items-center">
                {logo ? (
                  <Image
                    src={logo.src}
                    alt={brand.name}
                    width={logo.width}
                    height={logo.height}
                    className="max-h-12 w-auto max-w-[180px] object-contain opacity-70 transition group-hover:opacity-100"
                    sizes="180px"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-tight text-black">{brand.name}</span>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold tracking-tight text-black">{brand.name}</h2>
                <p className="text-sm text-neutral-500">
                  {pieceCount} piece{pieceCount !== 1 ? "s" : ""}
                  {yearRange ? <> &middot; {yearRange}</> : null}
                </p>
              </div>

              {/* Season chips */}
              {seasonChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {seasonChips.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-black/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-neutral-600"
                    >
                      {label}
                    </span>
                  ))}
                  {seasons.length > 4 && (
                    <span className="rounded-full border border-black/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-neutral-400">
                      +{seasons.length - 4}
                    </span>
                  )}
                </div>
              )}

              <span className="mt-auto text-xs font-semibold tracking-[0.12em] uppercase text-black/40 transition group-hover:text-black">
                View Archive →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CommunitiesPage() {
  const { joinedSlugs } = useCommunities();
  const joinedBrands = brandDirectory.filter((b) => joinedSlugs.includes(b.slug));
  const otherBrands = brandDirectory.filter((b) => !joinedSlugs.includes(b.slug));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span>My Communities</span>
      </nav>

      {joinedBrands.length === 0 ? (
        <div className="mb-16">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-black">My Communities</h1>
          <p className="mb-10 text-sm uppercase tracking-[0.18em] text-neutral-500">
            You haven&apos;t joined any communities yet
          </p>
          <div className="rounded-[28px] border border-dashed border-black/15 p-12 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-neutral-300" />
            <p className="text-sm font-semibold text-black">No communities yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Visit a brand page and hit <span className="font-medium">Join Community</span> to get started.
            </p>
            <Link
              href="/brands"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-black/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 transition hover:border-black hover:text-black"
            >
              Browse brands →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-16">
          <BrandGrid
            brands={joinedBrands}
            heading="My Communities"
            subheading={`${joinedBrands.length} brand communit${joinedBrands.length === 1 ? "y" : "ies"} joined`}
          />
        </div>
      )}

      {otherBrands.length > 0 && (
        <div className="border-t border-black/8 pt-12">
          <BrandGrid
            brands={otherBrands}
            heading="Discover More"
            subheading="Join a community to access feeds, drops, and member trades"
          />
        </div>
      )}
    </div>
  );
}

// ─── Community feed ───────────────────────────────────────────────────────────

function avatarGradientBrand(seed: string) {
  const palettes = [
    ["#1a1212", "#3d2b2b"],
    ["#1c1c2e", "#2d2d44"],
    ["#0f1f0f", "#1e3a1e"],
    ["#1a1a1a", "#333333"],
  ];
  const idx = seed.split("").reduce((t, c) => t + c.charCodeAt(0), 0) % palettes.length;
  return palettes[idx];
}

type PostFlair = { label: string; bg: string; text: string };
type CommunityPost = {
  id: string;
  userId: string;
  title: string;
  flair: PostFlair;
  body?: string;
  imageUrl?: string;
  upvotes: number;
  comments: number;
  time: string;
  pinned?: boolean;
};

const FLAIR: Record<string, PostFlair> = {
  wtt:        { label: "WTT",        bg: "bg-amber-50",   text: "text-amber-700"   },
  wts:        { label: "WTS",        bg: "bg-emerald-50", text: "text-emerald-700" },
  wtb:        { label: "WTB",        bg: "bg-blue-50",    text: "text-blue-700"    },
  auth:       { label: "Auth Check", bg: "bg-purple-50",  text: "text-purple-700"  },
  discussion: { label: "Discussion", bg: "bg-neutral-100",text: "text-neutral-600" },
  drop:       { label: "Drop",       bg: "bg-red-50",     text: "text-red-700"     },
};

const COMMUNITY_POSTS: Record<string, CommunityPost[]> = {
  "chrome-hearts": [
    { id: "ch-1", userId: "alex-rivera",  title: "[WTT] Paris Exclusive Pullover Hoodie L — open to Triple S or Tabi offers", flair: FLAIR.wtt, imageUrl: "/products/chrome-hearts-hoodie-1.jpg", upvotes: 47, comments: 12, time: "2 hr. ago", pinned: true },
    { id: "ch-2", userId: "tsuki911",     title: "Just added the Paris hoodie to my closet — condition 9/10, full graphic intact", flair: FLAIR.discussion, imageUrl: "/products/chrome-hearts-hoodie-2.jpg", upvotes: 83, comments: 24, time: "4 hr. ago", pinned: true },
    { id: "ch-3", userId: "marcus-vale",  title: "[WTB] CH Cemetery Cross Hoodie — any size, budget $2K–$3K depending on condition", flair: FLAIR.wtb, body: "Been searching for months. Will pay fair market. DM with photos and price.", upvotes: 23, comments: 8, time: "6 hr. ago" },
    { id: "ch-4", userId: "sarah-kim",    title: "Auth check — CH leather wallet from Grailed, stitching looks off to me", flair: FLAIR.auth, body: "Bought last week. The cross hardware spacing seems slightly wider than my previous pair. Anyone confirm?", upvotes: 31, comments: 19, time: "1 day ago" },
    { id: "ch-5", userId: "alex-rivera",  title: "[WTS] Hollywood Blvd exclusive graphic tee — M, 8/10 condition, $640", flair: FLAIR.wts, upvotes: 15, comments: 5, time: "2 days ago" },
    { id: "ch-6", userId: "marcus-vale",  title: "Spring 2026 drop incoming — anyone have intel on the LA store pieces?", flair: FLAIR.discussion, upvotes: 61, comments: 33, time: "3 days ago" },
  ],
  "supreme": [
    { id: "sup-1", userId: "tsuki911",    title: "[WTT] Mike Kelley Zip-Up M — looking for Chrome Hearts or rare ERD", flair: FLAIR.wtt, imageUrl: "/products/supreme-mike-kelley-hoodie-1.jpg", upvotes: 55, comments: 17, time: "1 hr. ago", pinned: true },
    { id: "sup-2", userId: "sarah-kim",   title: "SS26 Mike Kelley collab unboxing — everything arrived clean", flair: FLAIR.discussion, imageUrl: "/products/supreme-mike-kelley-hoodie-1.jpg", upvotes: 102, comments: 41, time: "3 hr. ago", pinned: true },
    { id: "sup-3", userId: "alex-rivera", title: "[WTB] Supreme x Yohji FW25 anything — willing to pay above retail", flair: FLAIR.wtb, body: "Need size L tops or bottoms. Happy to trade or buy outright.", upvotes: 18, comments: 6, time: "5 hr. ago" },
    { id: "sup-4", userId: "marcus-vale", title: "Best Supreme collab of the decade — your top 3?", flair: FLAIR.discussion, upvotes: 88, comments: 52, time: "1 day ago" },
    { id: "sup-5", userId: "tsuki911",    title: "[WTS] Box logo tee FW24 — L, worn once, $420", flair: FLAIR.wts, upvotes: 29, comments: 11, time: "2 days ago" },
  ],
  "balenciaga": [
    { id: "bal-1", userId: "marcus-vale", title: "[WTS] Triple S.2 Black/Dark Grey US10 — DS, full kit, $1,090", flair: FLAIR.wts, imageUrl: "/products/balenciaga-triple-s-1.jpg", upvotes: 38, comments: 9, time: "2 hr. ago", pinned: true },
    { id: "bal-2", userId: "alex-rivera", title: "Triple S.2 sizing — run true to size?", flair: FLAIR.discussion, body: "I'm a 43 EU in most Balenciaga silhouettes. Would you size up?", upvotes: 44, comments: 28, time: "5 hr. ago", pinned: true },
    { id: "bal-3", userId: "sarah-kim",   title: "[WTT] Triple S.2 US10 — considering Tabi Loafers or Margiela Tabi Boots", flair: FLAIR.wtt, imageUrl: "/products/balenciaga-triple-s-1.jpg", upvotes: 27, comments: 14, time: "1 day ago" },
    { id: "bal-4", userId: "tsuki911",    title: "Track 3 vs Triple S.2 — which ages better?", flair: FLAIR.discussion, upvotes: 71, comments: 37, time: "2 days ago" },
  ],
  "maison-margiela": [
    { id: "mm-1", userId: "tsuki911",     title: "[WTS] Tabi Loafers Sz 42 brushed leather — 8/10 with dust bags, $1,220", flair: FLAIR.wts, imageUrl: "/products/maison-margiela-tabi-1.jpg", upvotes: 42, comments: 11, time: "4 hr. ago", pinned: true },
    { id: "mm-2", userId: "sarah-kim",    title: "New to the community — just got my first pair of Tabis", flair: FLAIR.discussion, imageUrl: "/products/maison-margiela-tabi-2.jpg", upvotes: 96, comments: 44, time: "6 hr. ago", pinned: true },
    { id: "mm-3", userId: "marcus-vale",  title: "[WTT] Tabi Loafers 42 — considering Balenciaga Triple S or similar high-value sneakers", flair: FLAIR.wtt, upvotes: 33, comments: 16, time: "1 day ago" },
    { id: "mm-4", userId: "alex-rivera",  title: "Auth check — Tabi split-toe stitching quality, are these real?", flair: FLAIR.auth, body: "Heel stitch looks slightly uneven compared to store-bought pairs.", upvotes: 19, comments: 22, time: "2 days ago" },
    { id: "mm-5", userId: "tsuki911",     title: "SS26 Margiela drops — anyone copped from the new season?", flair: FLAIR.drop, upvotes: 57, comments: 18, time: "3 days ago" },
  ],
  "enfants-riches-deprimes": [
    { id: "erd-1", userId: "tsuki911",    title: "[WTS] Adolf Loos Tee Washed Black L — 9/10 condition, $960", flair: FLAIR.wts, imageUrl: "/products/erd-adolf-loos-1.png", upvotes: 51, comments: 14, time: "3 hr. ago", pinned: true },
    { id: "erd-2", userId: "sarah-kim",   title: "ERD sizing — do the tees shrink after washing?", flair: FLAIR.discussion, imageUrl: "/products/erd-adolf-loos-2.jpg", upvotes: 74, comments: 31, time: "5 hr. ago", pinned: true },
    { id: "erd-3", userId: "alex-rivera", title: "[WTT] Adolf Loos Tee L — looking for Chrome Hearts graphic or Supreme collab", flair: FLAIR.wtt, upvotes: 28, comments: 9, time: "1 day ago" },
    { id: "erd-4", userId: "marcus-vale", title: "Favourite ERD graphic ever? Mine is the Karl Lagerfeld portrait series", flair: FLAIR.discussion, upvotes: 89, comments: 56, time: "2 days ago" },
    { id: "erd-5", userId: "tsuki911",    title: "Auth check — Adolf Loos tee purchased through Grailed, label placement looks off", flair: FLAIR.auth, upvotes: 22, comments: 17, time: "4 days ago" },
  ],
};

const COMMUNITY_RULES: Record<string, string[]> = {
  "chrome-hearts":          ["No discussion of replica or counterfeit pieces", "Auth check posts require clear, unedited photos", "Price checks welcome — include condition and location", "Trade posts must reference item photos and retail value", "No unsolicited DMs or off-platform deals"],
  "supreme":                ["No replica or bootleg Supreme discussion", "Collab auth checks welcome with receipt or purchase proof", "Drop intel threads are allowed — no reseller-only posts", "No price gouging — call it out if you see it", "Keep it about the clothes, not the clout"],
  "balenciaga":             ["Auth checks require photos of sole, lace tags, and box", "No fake or rep discussion", "Sizing threads encouraged — document your fit", "Trades must include market comps in the post", "Community members only for DM trade discussions"],
  "maison-margiela":        ["No Tabi replicas — zero tolerance", "Auth checks must include heel stitch and insole photos", "Respectful disagreements only — this is a niche community", "WTS/WTT posts require Depop/Grailed history or member vouch", "Highlight drops and collaborations in the Drop flair"],
  "enfants-riches-deprimes":["No ERD replicas or inspired pieces", "Auth posts need care label and hem photos", "Price checks include link to comparable recent sold listing", "Community leans curated — keep posts relevant", "New members welcome — introduce yourself"],
};

function CommunityMemberAvatar({ userId, size = "md" }: { userId: string; size?: "sm" | "md" }) {
  const user = allUsers.find((u) => u.id === userId);
  const [from, to] = avatarGradientBrand(userId);
  const cls = size === "sm" ? "h-6 w-6 text-[8px]" : "h-8 w-8 text-[10px]";
  return (
    <span
      className={cn("shrink-0 items-center justify-center rounded-full font-bold text-white flex", cls)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {user?.initials ?? "?"}
    </span>
  );
}

function PostFlairPill({ flair }: { flair: PostFlair }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", flair.bg, flair.text)}>
      {flair.label}
    </span>
  );
}

function CommunityFeed({ brandSlug, brand }: { brandSlug: string; brand: BrandDirectoryEntry }) {
  const [sort, setSort] = useState<"latest" | "popular" | "trades" | "discussion">("latest");
  const [expandedRules, setExpandedRules] = useState<number | null>(null);

  const allPosts = useMemo(() => COMMUNITY_POSTS[brandSlug] ?? [], [brandSlug]);
  const rules = COMMUNITY_RULES[brandSlug] ?? [];
  const activeMembers = useMemo(() => allUsers.filter((u) => u.online || u.id === "tsuki911"), []);
  const pinnedPosts = useMemo(() => allPosts.filter((p) => p.pinned), [allPosts]);

  const sorted = useMemo(() => {
    const base = allPosts.filter((p) => {
      if (sort === "trades") return ["wtt", "wts", "wtb"].some((k) => FLAIR[k]?.label === p.flair.label);
      if (sort === "discussion") return p.flair.label === "Discussion" || p.flair.label === "Auth Check";
      return true;
    });
    if (sort === "popular") return [...base].sort((a, b) => b.upvotes - a.upvotes);
    return base;
  }, [allPosts, sort]);

  // Deterministic community stats from brand slug
  const memberCount = (brandSlug.split("").reduce((t, c) => t + c.charCodeAt(0), 0) % 800) + 1200;
  const weeklyActive = Math.round(memberCount * 0.18);
  const weeklyPosts  = (brandSlug.length * 7) % 40 + 12;

  const logo = brandDiscoveryLogos.find((l) => l.href.includes(brandSlug));

  const SORT_TABS = [
    { id: "latest" as const,     label: "Latest",     Icon: Clock3 },
    { id: "popular" as const,    label: "Popular",    Icon: Flame },
    { id: "trades" as const,     label: "Trades",     Icon: ArrowLeftRight },
    { id: "discussion" as const, label: "Discussion", Icon: MessageSquare },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      {/* ── Main feed ── */}
      <div className="min-w-0 space-y-4">

        {/* Create post bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white p-3 shadow-sm">
          <CommunityMemberAvatar userId="tsuki911" />
          <button
            type="button"
            className="flex-1 rounded-xl border border-black/10 bg-neutral-50 px-4 py-2.5 text-left text-sm text-neutral-400 transition hover:border-black/20 hover:bg-white"
          >
            Share a listing, trade offer, or discussion…
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2.5 text-xs font-semibold text-neutral-600 transition hover:border-black hover:text-black">
            <PenSquare className="h-3.5 w-3.5" /> Post
          </button>
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-1 rounded-2xl border border-black/8 bg-white px-3 py-2 shadow-sm">
          {SORT_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                sort === id
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-black",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Pinned highlights */}
        {pinnedPosts.length > 0 && sort === "latest" && (
          <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              <Star className="h-3 w-3" /> Community highlights
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pinnedPosts.map((post) => {
                const user = allUsers.find((u) => u.id === post.userId);
                return (
                  <div
                    key={post.id}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-xl border border-black/8 transition hover:border-black/20 hover:shadow-sm",
                      post.imageUrl ? "aspect-[4/3]" : "bg-neutral-50 p-4",
                    )}
                  >
                    {post.imageUrl && (
                      <Image src={post.imageUrl} alt={post.title} fill className="object-cover transition group-hover:scale-[1.02]" sizes="300px" />
                    )}
                    <div className={cn(
                      "absolute inset-0 flex flex-col justify-end p-3",
                      post.imageUrl ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : "",
                    )}>
                      <p className={cn("line-clamp-2 text-sm font-semibold leading-snug", post.imageUrl ? "text-white" : "text-black")}>
                        {post.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <CommunityMemberAvatar userId={post.userId} size="sm" />
                        <span className={cn("text-[11px]", post.imageUrl ? "text-white/70" : "text-neutral-500")}>
                          {user?.name ?? post.userId}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post list */}
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-sm text-neutral-400">
              No posts in this category yet.
            </div>
          ) : sorted.map((post) => {
            const user = allUsers.find((u) => u.id === post.userId);
            return (
              <div key={post.id} className="group rounded-2xl border border-black/8 bg-white shadow-sm transition hover:border-black/20 hover:shadow-md">
                <div className="flex gap-0">
                  {/* Vote column */}
                  <div className="flex w-10 flex-col items-center gap-0.5 rounded-l-2xl bg-neutral-50 py-3">
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-200 hover:text-black">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-neutral-700">{post.upvotes}</span>
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-200 hover:text-black rotate-180">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 p-3">
                    {/* Meta row */}
                    <div className="mb-2 flex items-center gap-2">
                      <CommunityMemberAvatar userId={post.userId} size="sm" />
                      <Link href={`/user/${post.userId}`} className="text-xs font-semibold text-neutral-700 hover:underline">
                        {user?.handle ?? post.userId}
                      </Link>
                      <span className="text-[11px] text-neutral-400">· {post.time}</span>
                      <button type="button" className="ml-auto text-neutral-300 transition hover:text-neutral-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title + flair */}
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="flex-1 text-sm font-semibold leading-snug text-black">
                        {post.title}
                      </p>
                    </div>
                    <div className="mt-1.5">
                      <PostFlairPill flair={post.flair} />
                    </div>

                    {/* Body */}
                    {post.body && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">{post.body}</p>
                    )}

                    {/* Image */}
                    {post.imageUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-black/5">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          width={600}
                          height={400}
                          className="max-h-64 w-full object-cover"
                          sizes="560px"
                        />
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="mt-3 flex items-center gap-1">
                      <button type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-black">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comments} comments
                      </button>
                      <button type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-black">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Trade
                      </button>
                      <button type="button" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-black">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Vouch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="hidden space-y-4 lg:block">

        {/* Community card */}
        <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          {/* Header strip */}
          <div className="h-14 bg-gradient-to-r from-neutral-900 to-neutral-700" />
          <div className="px-4 pb-4">
            {/* Logo */}
            <div className="-mt-6 mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow">
              {logo ? (
                <Image src={logo.src} alt={brand.name} width={logo.width} height={logo.height}
                  className="h-8 w-auto max-w-[40px] object-contain" sizes="40px" />
              ) : (
                <span className="text-xs font-bold text-black">{brand.name[0]}</span>
              )}
            </div>
            <h3 className="text-sm font-bold text-black">{brand.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{brand.description}</p>
            <div className="mt-3 space-y-1.5 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>Community est. 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>Members only</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-black/8 border-t border-black/8">
            {[
              { value: memberCount.toLocaleString(), label: "Members" },
              { value: weeklyActive.toLocaleString(), label: "Active / wk" },
              { value: weeklyPosts,                   label: "Posts / wk" },
            ].map(({ value, label }) => (
              <div key={label} className="py-3 text-center">
                <p className="text-sm font-bold text-black">{value}</p>
                <p className="text-[10px] text-neutral-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active now */}
        <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Active Now</p>
          <div className="flex flex-wrap gap-3">
            {activeMembers.map((u) => {
              const [from, to] = avatarGradientBrand(u.id);
              return (
                <Link key={u.id} href={`/user/${u.id}`} className="group flex flex-col items-center gap-1">
                  <div className="relative">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white transition group-hover:opacity-75"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {u.initials}
                    </span>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <span className="max-w-[36px] truncate text-center text-[9px] font-medium text-neutral-400 group-hover:text-black">
                    {u.id.split("-")[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rules */}
        {rules.length > 0 && (
          <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Community Rules
            </p>
            <ol className="space-y-0">
              {rules.map((rule, i) => (
                <li key={i} className="border-b border-black/6 last:border-0">
                  <button
                    type="button"
                    onClick={() => setExpandedRules(expandedRules === i ? null : i)}
                    className="flex w-full items-start gap-3 py-2.5 text-left"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[9px] font-bold text-neutral-500">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xs font-medium text-neutral-700">{rule}</span>
                    <ChevronDown
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform", expandedRules === i ? "rotate-180" : "")}
                    />
                  </button>
                  {expandedRules === i && (
                    <p className="pb-2.5 pl-7 text-[11px] leading-relaxed text-neutral-400">
                      Violations may result in post removal or temporary community suspension. Reach out to a moderator if you have questions.
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Invite */}
        <div className="rounded-2xl border border-dashed border-black/12 p-4 text-center">
          <p className="text-xs font-semibold text-black">Invite a trusted member</p>
          <p className="mt-1 text-[11px] text-neutral-400">Grow authentic trades in the {brand.name} community.</p>
          <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-black hover:text-black">
            <Plus className="h-3 w-3" /> Invite member
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BrandPage ────────────────────────────────────────────────────────────────

export function BrandPage({
  brand,
  listings,
  sellersById,
}: {
  brand: BrandDirectoryEntry;
  listings: Product[];
  sellersById: Record<string, UserProfile | undefined>;
}) {
  const { isJoined, join, leave } = useCommunities();
  const joined = isJoined(brand.slug);
  const [notify, setNotify] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "feed">("listings");
  const [listingFilter, setListingFilter] = useState<"all" | "verified" | "most-watched">("all");
  const logo = brandDiscoveryLogos.find((item) => item.href === `/brands/${brand.slug}`);
  const visibleListings = useMemo(() => {
    if (listingFilter === "verified") {
      return listings.filter((product) => product.verificationStatus === "verified");
    }

    if (listingFilter === "most-watched") {
      return [...listings].sort((a, b) => (b.id * 17) % 41 - (a.id * 17) % 41);
    }

    return listings;
  }, [listingFilter, listings]);

  return (
    <div>
      <section className="relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-[#f4f1ec] px-6 pb-14 pt-20 sm:min-h-[44vh] sm:px-10 lg:px-16">
        <div className="absolute left-4 right-4 top-6 z-10 flex items-center justify-between gap-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <nav className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            <Link href="/" className="hover:text-black">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-black">Brands</Link>
            <span>/</span>
            <span className="truncate text-black">{brand.name}</span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/brands/${brand.slug}/archive`}
              className="inline-flex items-center rounded-full border border-black/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 transition hover:border-black hover:text-black"
            >
              Archive
            </Link>
            {joined ? (
              <>
                <button
                  type="button"
                  onClick={() => { leave(brand.slug); setActiveTab("listings"); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-neutral-800"
                >
                  <Check className="h-3 w-3" />
                  Joined
                </button>
                <button
                  type="button"
                  onClick={() => setNotify((n) => !n)}
                  aria-label={notify ? "Disable notifications" : "Enable notifications"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
                    notify
                      ? "border-black bg-black text-white"
                      : "border-black/20 text-neutral-600 hover:border-black hover:text-black",
                  )}
                >
                  {notify ? (
                    <><Bell className="h-3 w-3" /> Notifying</>
                  ) : (
                    <><BellOff className="h-3 w-3" /> Notify me</>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { join(brand.slug); setActiveTab("feed"); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600 transition hover:border-black hover:bg-black hover:text-white"
              >
                Join Community
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-5xl flex-col items-center text-center">
          {logo ? (
            <Image
              src={logo.src}
              alt={brand.name}
              width={logo.width}
              height={logo.height}
              preload
              sizes={
                brand.slug === "chrome-hearts"
                  ? "(max-width: 640px) 40vw, 170px"
                  : brand.slug === "louis-vuitton"
                    ? "(max-width: 640px) 40vw, 160px"
                    : "(max-width: 640px) 60vw, 460px"
              }
              className={cn(
                "h-auto w-auto object-contain",
                brand.slug === "chrome-hearts"
                  ? "max-h-[150px] max-w-[min(40vw,170px)]"
                  : brand.slug === "louis-vuitton"
                    ? "max-h-[150px] max-w-[min(40vw,160px)]"
                    : "max-h-[120px] max-w-[min(60vw,460px)]",
              )}
            />
          ) : (
            <h1 className="text-5xl font-semibold tracking-tight text-black sm:text-7xl">{brand.name}</h1>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {(brand.tagline || brand.description) ? (
        <div className="mb-8">
          {brand.tagline ? (
            <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">{brand.tagline}</p>
          ) : null}
          {brand.description ? (
            <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">{brand.description}</p>
          ) : null}
        </div>
      ) : null}

      {/* Tab switcher (visible only when joined) */}
      {joined && (
        <div className="mb-8 flex gap-1 border-b border-black/8 pb-0">
          {(["listings", "feed"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 pb-3 pr-5 text-xs font-semibold uppercase tracking-[0.16em] transition",
                activeTab === tab
                  ? "border-black text-black"
                  : "border-transparent text-neutral-400 hover:text-neutral-700",
              )}
            >
              {tab === "listings" ? "Listings" : (
                <span className="flex items-center gap-1.5">
                  Community Feed
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {activeTab === "feed" && joined ? (
        <CommunityFeed brandSlug={brand.slug} brand={brand} />
      ) : (
        <>
          {listings.length ? (
            <>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Available now</p>
                  <p className="mt-1 text-sm text-neutral-500">{visibleListings.length} pieces surfaced from {brand.name}</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                    { label: "All", value: "all" as const },
                    { label: "Verified", value: "verified" as const },
                    { label: "Most watched", value: "most-watched" as const },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setListingFilter(filter.value)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition",
                        listingFilter === filter.value
                          ? "border-black bg-black text-white"
                          : "border-black/10 text-neutral-500 hover:border-black hover:text-black",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleListings.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    seller={sellersById[product.sellerId]}
                    showSeller
                    showVotes
                  />
                ))}
              </div>
              {visibleListings.length === 0 ? (
                <div className="mt-6 rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
                  No listings match this filter yet.
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
              No active listings for this brand yet.
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export function BrandArchivePage({
  brand,
  pieces,
  seasons,
  activeSeasonKey,
}: {
  brand: BrandDirectoryEntry;
  pieces: ArchivePiece[];
  seasons: ArchiveSeasonFilter[];
  activeSeasonKey?: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span>/</span>
          <Link href={`/brands/${brand.slug}`} className="hover:text-black">
            {brand.name}
          </Link>
          <span>/</span>
          <span>Archive</span>
        </nav>
        <Link
          href="/closet"
          className="inline-flex items-center rounded-full border border-black/20 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-neutral-600 transition hover:border-black hover:text-black"
        >
          My Closet
        </Link>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-black">{brand.name}</h1>
          <span className="text-lg font-light tracking-[0.18em] uppercase text-neutral-400">Archive</span>
        </div>
        {brand.tagline ? (
          <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">{brand.tagline}</p>
        ) : null}
      </div>

      <BrandArchiveGrid brand={brand} pieces={pieces} seasons={seasons} activeSeasonKey={activeSeasonKey} />
    </div>
  );
}

function yearFromSeasonKey(key?: string): number | null {
  const match = key?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

function BrandArchiveGrid({
  brand,
  pieces,
  seasons,
  activeSeasonKey,
}: {
  brand: BrandDirectoryEntry;
  pieces: ArchivePiece[];
  seasons: ArchiveSeasonFilter[];
  activeSeasonKey?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(() => yearFromSeasonKey(activeSeasonKey));
  const [activeSeason, setActiveSeason] = useState<string | null>(activeSeasonKey ?? null);
  const [sortByCollection, setSortByCollection] = useState(false);

  // Re-sync when navigation swaps the season prop on an already-mounted grid
  // (Next keeps the component mounted across ?season= changes, so a once-only
  // initializer would keep the old season). Deriving the year also reveals the
  // season panel instead of applying a filter the user can't see.
  const [prevSeasonKey, setPrevSeasonKey] = useState(activeSeasonKey);
  if (activeSeasonKey !== prevSeasonKey) {
    setPrevSeasonKey(activeSeasonKey);
    setActiveSeason(activeSeasonKey ?? null);
    setSelectedYear(yearFromSeasonKey(activeSeasonKey));
  }

  // Unique years from season data, newest first
  const years = useMemo(() => {
    const ys = new Set(
      seasons.map((s) => s.seasonYear).filter((y): y is number => y != null),
    );
    return [...ys].sort((a, b) => b - a);
  }, [seasons]);

  // Seasons that belong to the selected year
  const seasonsForYear = useMemo(() => {
    if (selectedYear == null) return [];
    return seasons.filter((s) => s.seasonYear === selectedYear);
  }, [seasons, selectedYear]);

  function selectYear(year: number | null) {
    setSelectedYear(year);
    setActiveSeason(null);
  }

  // Filtered pieces
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pieces.filter((piece) => {
      const yearMatch = selectedYear == null || piece.seasonYear === selectedYear;
      const pieceKey =
        piece.seasonKind === "UNKNOWN"
          ? "unknown"
          : `${piece.seasonKind.toLowerCase()}${piece.seasonYear ?? ""}`;
      const seasonMatch = !activeSeason || pieceKey === activeSeason;
      const searchMatch =
        !q ||
        piece.title.toLowerCase().includes(q) ||
        (piece.collection ?? "").toLowerCase().includes(q) ||
        piece.seasonLabel.toLowerCase().includes(q);
      return yearMatch && seasonMatch && searchMatch;
    });
  }, [pieces, selectedYear, activeSeason, searchQuery]);

  const sorted = useMemo(
    () =>
      sortByCollection
        ? [...filtered].sort((a, b) => (a.collection ?? "").localeCompare(b.collection ?? ""))
        : filtered,
    [filtered, sortByCollection],
  );

  const piecesInYear =
    selectedYear != null ? pieces.filter((p) => p.seasonYear === selectedYear).length : pieces.length;

  const showSeasonPanel = seasonsForYear.length > 0;

  return (
    <div>
      {/* ── Search bar ─────────────────────────────────────────── */}
      <label className="mb-7 flex cursor-text items-center gap-3 rounded-full border border-black/12 bg-white px-5 py-3 shadow-sm transition-all focus-within:border-black/30 focus-within:shadow-md">
        <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search archive…"
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="text-neutral-400 transition hover:text-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      {/* ── Year slider (scrollable) ────────────────────────────── */}
      {years.length > 0 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          <YearPill active={selectedYear == null} label="All" onClick={() => selectYear(null)} />
          {years.map((year) => (
            <YearPill
              key={year}
              active={selectedYear === year}
              label={String(year)}
              onClick={() => selectYear(year)}
            />
          ))}
        </div>
      )}

      {/* ── Season panel — max-height + fade/translate reveal ───── */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-500 ease-out",
          showSeasonPanel ? "max-h-48" : "max-h-0",
        )}
      >
        <div
          className="pb-2 pt-5 transition-[opacity,transform] duration-300"
          style={{ transitionDelay: showSeasonPanel ? "120ms" : "0ms" }}
        >
          <div
            className={cn(
              "flex flex-wrap gap-2 transition-[opacity,transform] duration-300",
              showSeasonPanel ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            <FilterChip
              active={!activeSeason}
              label="All"
              count={piecesInYear}
              onClick={() => setActiveSeason(null)}
            />
            {seasonsForYear.map((season) => (
              <FilterChip
                key={season.key}
                active={activeSeason === season.key}
                label={season.label}
                count={season.count}
                onClick={() => setActiveSeason(activeSeason === season.key ? null : season.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count + sort ────────────────────────────────── */}
      <div className="mb-8 mt-6 flex items-center justify-between border-b border-black/8 pb-3.5">
        <span className="text-xs tracking-wide text-neutral-500">
          {sorted.length} piece{sorted.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setSortByCollection((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition-all",
            sortByCollection
              ? "border-black bg-black text-white"
              : "border-black/15 text-neutral-500 hover:border-black/40 hover:text-black",
          )}
        >
          Collection A–Z
        </button>
      </div>

      {/* ── Piece grid ─────────────────────────────────────────── */}
      {sorted.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((piece) => (
            <ArchivePieceCard key={piece.id} brand={brand} piece={piece} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
          No archive pieces match the selected filters.
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition",
        active
          ? "border-black bg-black text-white"
          : "border-black/15 bg-white text-neutral-700 hover:border-black/40 hover:text-black",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px]",
          active ? "bg-white/15 text-white" : "bg-black/5 text-neutral-600",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function YearPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200",
        active
          ? "bg-black text-white shadow-md"
          : "bg-black/6 text-neutral-600 hover:bg-black/10 hover:text-black",
      )}
    >
      {label}
    </button>
  );
}

function ArchivePieceCard({ brand, piece }: { brand: BrandDirectoryEntry; piece: ArchivePiece }) {
  return (
    <Link href={`/brands/${brand.slug}/piece/${piece.slug}`} className="group block space-y-3">
      <ProductImage
        src={piece.coverImageUrl ?? "/placeholder.png"}
        alt={piece.title}
        className="aspect-[4/5] w-full rounded-[28px] border border-black/5"
      />
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{piece.seasonLabel}</p>
        <p className="text-sm font-semibold text-black">{piece.title}</p>
        <p className="text-xs text-neutral-500">
          {piece.listingCount > 0
            ? `${piece.listingCount} member${piece.listingCount === 1 ? "" : "s"} listing`
            : "No active listings"}
        </p>
      </div>
    </Link>
  );
}

export function BrandArchivePiecePage({
  brand,
  piece,
  listings,
  sellersById,
}: {
  brand: BrandDirectoryEntry;
  piece: ArchivePiece;
  listings: Product[];
  sellersById: Record<string, UserProfile | undefined>;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href={`/brands/${brand.slug}`} className="hover:text-black">
          {brand.name}
        </Link>
        <span>/</span>
        <span>{piece.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
        <ProductImage
          src={piece.coverImageUrl ?? "/placeholder.png"}
          alt={piece.title}
          className="aspect-[4/5] w-full rounded-[28px] border border-black/10"
        />

        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              href={`/brands/${brand.slug}`}
              className="text-xs uppercase tracking-[0.18em] text-neutral-500 hover:text-black"
            >
              {brand.name}
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight text-black">{piece.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
                {piece.seasonLabel}
              </span>
              {piece.category ? (
                <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-neutral-600">
                  {piece.category}
                </span>
              ) : null}
            </div>
            {piece.description.length ? (
              <div className="space-y-2 text-sm text-neutral-700">
                {piece.description.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {listings.length
                  ? `Available from ${listings.length} member${listings.length === 1 ? "" : "s"}`
                  : "No active listings yet"}
              </h2>
            </div>

            {listings.length ? (
              <ul className="divide-y divide-black/10 overflow-hidden rounded-[28px] border border-black/10 bg-white">
                {listings.map((listing) => {
                  const seller = sellersById[listing.sellerId];
                  return (
                    <li key={listing.id}>
                      <Link
                        href={`/product/${listing.id}`}
                        className="flex flex-col gap-4 p-5 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:gap-6"
                      >
                        <ProductImage
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-24 w-24 flex-shrink-0 rounded-2xl border border-black/5"
                        />
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            {seller ? <Avatar user={seller} className="h-10 w-10 text-xs" /> : null}
                            <div>
                              <p className="text-sm font-semibold text-black">{seller?.name ?? "Member"}</p>
                              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                                {seller?.handle ?? listing.listingTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600">
                              Size {listing.size}
                            </span>
                            <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600">
                              {listing.condition}
                            </span>
                            <span className="text-base font-semibold text-black">
                              {formatMoney(listing.price)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-3 rounded-[28px] border border-dashed border-black/15 bg-white p-8 text-center">
                <p className="text-sm text-neutral-600">
                  No active listings yet. Be the first to list this piece.
                </p>
                <Link
                  href="/closet"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-white"
                >
                  List a piece
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
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
  const similarListingsRef = useRef<HTMLDivElement>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [cashOffer, setCashOffer] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<null | "trade" | "message" | "buy">(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [discussionDraft, setDiscussionDraft] = useState("");
  const [discussionItems, setDiscussionItems] = useState(() => {
    const members = allUsers.filter((user) => user.id !== product.sellerId).slice(0, 3);
    const firstMember = members[0] ?? seller;
    const secondMember = members[1] ?? firstMember;

    return [
      {
        id: `${product.id}-fit`,
        author: firstMember
          ? {
              name: firstMember.name,
              handle: firstMember.handle,
              initials: firstMember.initials,
              avatarSeed: firstMember.avatarSeed,
            }
          : { name: "Market Member", handle: "@member", initials: "MM", avatarSeed: "market-member" },
        timestamp: "18 min ago",
        body: `Can anyone speak on fit for this ${product.category.toLowerCase()}? The ${product.condition.toLowerCase()} condition looks solid from the photos.`,
        replies: (product.id * 3) % 5,
        upvotes: ((product.id * 7) % 18) + 4,
      },
      {
        id: `${product.id}-seller`,
        author: seller
          ? {
              name: seller.name,
              handle: seller.handle,
              initials: seller.initials,
              avatarSeed: seller.avatarSeed,
            }
          : { name: "Seller", handle: "@seller", initials: "S", avatarSeed: "seller" },
        timestamp: "12 min ago",
        body: "Happy to add measurements or extra close-ups if anyone needs them before making a trade offer.",
        replies: 1,
        upvotes: ((product.id * 5) % 14) + 3,
      },
      {
        id: `${product.id}-market`,
        author: secondMember
          ? {
              name: secondMember.name,
              handle: secondMember.handle,
              initials: secondMember.initials,
              avatarSeed: secondMember.avatarSeed,
            }
          : { name: "Archive Watcher", handle: "@archivewatcher", initials: "AW", avatarSeed: "archive-watcher" },
        timestamp: "5 min ago",
        body: product.originalPrice
          ? `Ask feels sharp at ${formatMoney(product.price)} against the ${formatMoney(product.originalPrice)} reference.`
          : "Would be useful to compare this against recent sold comps before it moves.",
        replies: 0,
        upvotes: ((product.id * 11) % 21) + 5,
      },
    ];
  });
  const { isFavorite, toggleFavorite } = useFavorites();
  const isSold = Boolean(product.soldAt);
  const isOwnListing = Boolean(viewer && product.sellerProfileId && viewer.profileId === product.sellerProfileId);
  const listingActionContract: ListingActionContract = {
    productId: product.id,
    buyerProfileId: viewer?.profileId,
    sellerProfileId: product.sellerProfileId,
    listingStatus: isSold ? "sold" : isOwnListing ? "own_listing" : "available",
    verificationStatus: product.verificationStatus,
  };
  const selectedClosetItems = useMemo(
    () => currentCloset.filter((item) => selectedIds.includes(item.id)),
    [currentCloset, selectedIds],
  );
  const selectedItemValue = selectedClosetItems.reduce((total, item) => total + item.price, 0);
  const cashOfferValue = Math.max(0, Number(cashOffer) || 0);
  const estimatedOfferValue = selectedItemValue + cashOfferValue;
  const estimatedDifference = estimatedOfferValue - product.price;
  const communityAuthenticity = useMemo(() => {
    const baseScore =
      product.verificationStatus === "verified"
        ? 91
        : product.verificationStatus === "needs_review"
          ? 74
          : product.verificationStatus === "failed"
            ? 38
            : 68;
    const confidence = Math.min(99, baseScore + ((product.id * 7) % 8));
    const looksGood = discussionItems.reduce((total, item) => total + item.upvotes, 0);
    const flags = product.verificationStatus === "failed" ? 6 : product.verificationStatus === "needs_review" ? 2 : product.id % 4;

    return {
      confidence,
      looksGood,
      flags,
      verdict: confidence >= 88 ? "Strong" : confidence >= 72 ? "Mixed" : "Needs review",
    };
  }, [discussionItems, product.id, product.verificationStatus]);

  function scrollSimilarListings(direction: -1 | 1) {
    const track = similarListingsRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    track.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
      behavior: "smooth",
    });
  }

  function toggleTradeSelection(itemId: number) {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  function handleBuyClick() {
    trackEvent({
      name: "product_primary_action_clicked",
      payload: { productId: product.id, action: "buy", authenticated: Boolean(viewer) },
    });

    if (viewer && !isOwnListing) {
      setPurchaseModalOpen(true);
      return;
    }

    setAuthModal("buy");
  }

  function handleTradeClick() {
    trackEvent({
      name: "product_primary_action_clicked",
      payload: { productId: product.id, action: "trade", authenticated: Boolean(viewer) },
    });

    if (viewer) {
      setTradeOpen(true);
      return;
    }

    setAuthModal("trade");
  }

  function handleMessageClick() {
    trackEvent({
      name: "product_primary_action_clicked",
      payload: { productId: product.id, action: "message", authenticated: Boolean(viewer) },
    });

    if (viewer) {
      setMessageModalOpen(true);
      return;
    }

    setAuthModal("message");
  }

  function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportReason) return;

    trackEvent({
      name: "product_report_submitted",
      payload: { productId: product.id, reason: reportReason },
    });
    setReportSubmitted(true);
  }

  function handleDiscussionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = discussionDraft.trim();
    if (!body || !viewer) return;

    setDiscussionItems((current) => [
      {
        id: `${product.id}-viewer-${Date.now()}`,
        author: {
          name: viewer.name,
          handle: viewer.handle,
          initials: viewer.initials,
          avatarSeed: viewer.avatarSeed,
        },
        timestamp: "Just now",
        body,
        replies: 0,
        upvotes: 0,
      },
      ...current,
    ]);
    setDiscussionDraft("");
  }

  function renderDiscussionSection() {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-black">Discussion</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Ask for fit notes, condition checks, trade context, or market reads before making a move.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-neutral-600">
            {discussionItems.length}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {discussionItems.map((item) => (
            <article key={item.id} className="border-t border-black/8 pt-4 first:border-t-0 first:pt-0">
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
                    avatarClass(item.author.avatarSeed),
                  )}
                >
                  {item.author.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="font-semibold text-black">{item.author.name}</p>
                    <p className="text-xs text-neutral-500">{item.author.handle}</p>
                    <p className="text-xs text-neutral-400">{item.timestamp}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-neutral-400">
                    <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-black">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {item.upvotes}
                    </button>
                    <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-black">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {item.replies} {item.replies === 1 ? "reply" : "replies"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {viewer ? (
          <form onSubmit={handleDiscussionSubmit} className="mt-5 border-t border-black/8 pt-5">
            <label className="sr-only" htmlFor={`discussion-${product.id}`}>
              Add to discussion
            </label>
            <textarea
              id={`discussion-${product.id}`}
              value={discussionDraft}
              onChange={(event) => setDiscussionDraft(event.target.value)}
              rows={3}
              placeholder="Ask a question or add market context..."
              className="w-full rounded-[22px] border border-black/10 bg-neutral-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!discussionDraft.trim()}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Post
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-[22px] border border-dashed border-black/15 bg-neutral-50 p-4">
            <p className="text-sm leading-6 text-neutral-600">
              Sign in to ask questions, add fit notes, or help verify listing details with the community.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/product/${product.id}`)}`}
              className="mt-3 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Join discussion
            </Link>
          </div>
        )}
      </div>
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
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pb-10">
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-black">
          Listings
        </Link>
        <span>/</span>
        <Link href={`/brands/${slugifyBrand(product.brand)}`} className="hover:text-black">
          {product.brand}
        </Link>
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
            {renderDiscussionSection()}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setReportModalOpen(true);
                setReportSubmitted(false);
                trackEvent({ name: "product_report_started", payload: { productId: product.id } });
              }}
              className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 transition hover:border-black hover:text-black"
            >
              Report
            </button>
            <button
              type="button"
              onClick={() => {
                trackEvent({
                  name: "product_primary_action_clicked",
                  payload: { productId: product.id, action: "favorite", authenticated: Boolean(viewer) },
                });
                void toggleFavorite(product.id);
              }}
              className="rounded-full border border-black/10 p-3 transition hover:bg-black hover:text-white"
            >
              <Heart className={cn("h-5 w-5", isFavorite(product.id) && "fill-current")} />
            </button>
          </div>
          <div>
            <Link
              href={`/brands/${slugifyBrand(product.brand)}`}
              className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500 hover:text-black"
            >
              {product.brand}
            </Link>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">{product.title}</h1>
            <p className="mt-3 text-neutral-600">{product.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {isSold ? (
                <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                  Sold
                </span>
              ) : null}
              <ModerationPill status={product.moderationStatus} />
              <VerificationPill status={product.verificationStatus} />
            </div>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Community authenticity</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-black">{communityAuthenticity.confidence}</span>
                  <span className="pb-1 text-sm font-semibold text-neutral-500">/ 100</span>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  communityAuthenticity.verdict === "Strong"
                    ? "bg-emerald-50 text-emerald-700"
                    : communityAuthenticity.verdict === "Mixed"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700",
                )}
              >
                {communityAuthenticity.verdict}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Looks good</p>
                <p className="mt-1 font-semibold text-black">{communityAuthenticity.looksGood}</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Flags</p>
                <p className="mt-1 font-semibold text-black">{communityAuthenticity.flags}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              Score combines member votes, discussion activity, and current verification status.
            </p>
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
          <div className="grid gap-3" data-listing-status={listingActionContract.listingStatus}>
            {isSold ? (
              <button
                type="button"
                disabled
                className="rounded-full bg-neutral-300 px-6 py-4 text-center text-sm font-semibold text-neutral-600"
              >
                Sold
              </button>
            ) : viewer && !isOwnListing ? (
              <button
                type="button"
                onClick={handleBuyClick}
                className="rounded-full bg-black px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Buy Now
              </button>
            ) : !viewer ? (
              <button
                type="button"
                onClick={handleBuyClick}
                className="rounded-full bg-black px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Buy Now
              </button>
            ) : null}
            {!isOwnListing ? (
              <>
                <button
                  type="button"
                  onClick={handleTradeClick}
                  disabled={isSold}
                  className="rounded-full bg-black px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  Propose Trade
                </button>
                <button
                  type="button"
                  onClick={handleMessageClick}
                  disabled={viewer ? !seller : false}
                  className="rounded-full border border-black px-6 py-4 text-center text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-black/10 disabled:text-neutral-400"
                >
                  Message Seller
                </button>
              </>
            ) : (
              <p className="rounded-full border border-black/10 px-6 py-4 text-center text-sm font-medium text-neutral-500">
                This is your listing. Manage it from your closet.
              </p>
            )}
          </div>
          <div className="grid gap-3 rounded-[28px] border border-black/10 bg-neutral-50 p-5 text-sm text-neutral-600">
            {[
              {
                icon: ShieldCheck,
                title: product.verificationStatus === "verified" ? "Verified listing" : "Verification visible",
                body:
                  product.verificationStatus === "verified"
                    ? "Images and listing details have passed marketplace review."
                    : "Verification status is shown before any buyer commits.",
              },
              {
                icon: CheckCircle2,
                title: "Protected checkout",
                body: "Payment, trade history, and seller communication stay attached to the listing.",
              },
              {
                icon: MessageSquare,
                title: seller ? `${seller.responseRate} seller response` : "Seller messaging",
                body: seller ? `${seller.completedTrades} completed trades and ${seller.rating} average rating.` : "Message access opens after sign-in.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                  <div>
                    <p className="font-semibold text-black">{item.title}</p>
                    <p className="mt-0.5 leading-5">{item.body}</p>
                  </div>
                </div>
              );
            })}
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-black">Similar listings</h2>
          <Link href="/products" className="hidden text-sm font-semibold text-black sm:inline-flex">
            See more
          </Link>
        </div>
        <div className="relative">
          {similar.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => scrollSimilarListings(-1)}
                className="absolute left-0 top-[38%] z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                aria-label="Show previous recommended listing"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollSimilarListings(1)}
                className="absolute right-0 top-[38%] z-10 flex h-12 w-12 translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-black shadow-sm transition hover:border-black hover:bg-black hover:text-white"
                aria-label="Show next recommended listing"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
          <div
            ref={similarListingsRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {similar.map((item) => (
              <div key={item.id} className="w-[82vw] shrink-0 snap-start sm:w-[42vw] lg:w-[27vw] xl:w-[18.5vw]">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
      {!isOwnListing ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{product.brand}</p>
              <p className="truncate text-sm font-semibold text-black">{formatMoney(product.price)}</p>
            </div>
            <button
              type="button"
              onClick={handleTradeClick}
              disabled={isSold}
              className="rounded-full border border-black px-4 py-2.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:border-black/10 disabled:text-neutral-400"
            >
              Trade
            </button>
            <button
              type="button"
              onClick={handleBuyClick}
              disabled={isSold}
              className="rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Buy
            </button>
          </div>
        </div>
      ) : null}
      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Listing">
        {reportSubmitted ? (
          <div className="rounded-[28px] border border-black/10 bg-neutral-50 p-6">
            <p className="text-lg font-semibold tracking-tight text-black">Thanks, we will review this.</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Reports are attached to the listing contract and help moderation prioritize risky or inaccurate inventory.
            </p>
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-5">
            <p className="text-sm leading-6 text-neutral-600">
              Flag listings that look inaccurate, counterfeit, unsafe, or off-platform. This is a frontend handoff point
              for moderation logic.
            </p>
            <div className="grid gap-2">
              {["Authenticity concern", "Incorrect details", "Unsafe payment request", "Spam or duplicate"].map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition",
                    reportReason === reason ? "border-black bg-neutral-50 text-black" : "border-black/10 text-neutral-600",
                  )}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="h-4 w-4 accent-black"
                  />
                  {reason}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={!reportReason}
              className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Submit report
            </button>
          </form>
        )}
      </Modal>
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
        title={
          authModal === "trade"
            ? "Sign in to propose a trade"
            : authModal === "buy"
              ? "Sign in to purchase this listing"
              : "Sign in to message the seller"
        }
        description={
          authModal === "trade"
            ? "Create an account or sign in to send offers, track responses, and manage your trade history."
            : authModal === "buy"
              ? "Create an account or sign in to buy this item instantly."
              : "Create an account or sign in to message members and keep your conversations in one place."
        }
      />
      <PurchaseModal open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} product={product} />
      <MessageComposeModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        recipient={seller}
        product={product}
      />
    </div>
  );
}

export function MyClosetPage({
  currentUser,
  closetItems,
  trades,
  purchases,
  purchaseOrders,
  salesOrders,
  notifications,
  initialTab = "all",
}: {
  currentUser: UserProfile;
  closetItems: Product[];
  trades: TradeProposal[];
  purchases: Product[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: PurchaseOrder[];
  notifications: Notification[];
  initialTab?: "all" | "active" | "pending" | "history" | "purchases" | "sales";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "history" | "purchases" | "sales">(initialTab);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  // Revoke any outstanding preview object URLs when the closet unmounts so they
  // don't leak for the rest of the session.
  useEffect(() => () => {
    uploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
  }, []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [onboardingPayouts, setOnboardingPayouts] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [syncingPayouts, setSyncingPayouts] = useState(false);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [uploadingLabelFor, setUploadingLabelFor] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ClosetDraft>({
    title: "",
    brand: "",
    itemType: "",
    condition: "",
    size: "",
    price: "",
    description: "",
  });
  const availableSizes = useMemo(
    () => (draft.itemType ? closetSizeOptions(draft.itemType) : []),
    [draft.itemType],
  );
  const items = closetItems;
  const pendingIds = useMemo(
    () => new Set(trades.filter((trade) => trade.status === "pending").flatMap((trade) => trade.yourItemIds)),
    [trades],
  );
  const historyTrades = useMemo(() => trades.filter((trade) => trade.status === "completed"), [trades]);
  const purchaseItems = purchases;
  const payoutsReady = currentUser.stripeChargesEnabled === true && currentUser.stripePayoutsEnabled === true;
  const shouldPromptPayouts =
    !payoutsReady && (searchParams.get("connectPayouts") === "1" || searchParams.get("payments") === "ready");
  const purchaseOrderByProductId = useMemo(() => new Map(purchaseOrders.map((order) => [order.productId, order])), [purchaseOrders]);
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (deletedIds.has(item.id)) return false;
        if (activeTab === "all") return true;
        if (activeTab === "active") return !pendingIds.has(item.id);
        if (activeTab === "pending") return pendingIds.has(item.id);
        return true;
      }),
    [items, deletedIds, activeTab, pendingIds],
  );

  async function deleteItem(id: number) {
    setConfirmDeleteId(null);
    setDeletingId(id);

    const deletePromise = fetch(`/api/closet/items/${id}`, { method: "DELETE" });

    setExitingIds((prev) => new Set([...prev, id]));
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    setDeletedIds((prev) => new Set([...prev, id]));
    setExitingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });

    try {
      const response = await deletePromise;
      if (!response.ok) {
        setDeletedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        router.refresh();
      }
    } catch {
      setDeletedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } finally {
      setDeletingId(null);
    }
  }

  function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    setUploads((current) => {
      // Only create object URLs for files that fit the 8-image cap, otherwise
      // the overflow entries' URLs would be created and immediately dropped
      // (leaked) by the slice.
      const availableSlots = Math.max(0, 8 - current.length);
      const nextUploads = Array.from(files)
        .slice(0, availableSlots)
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      return [...current, ...nextUploads];
    });
  }

  async function saveDraftItem() {
    if (!payoutsReady) {
      setSaveError("Connect payouts before listing items so you can receive payments.");
      await startPayoutOnboarding();
      return;
    }

    const title = draft.title.trim();
    const brand = draft.brand.trim();
    const itemType = draft.itemType;
    const condition = draft.condition;
    const size = draft.size.trim();
    const price = Number(draft.price);

    if (!title || !brand || !itemType || !condition || !size || !Number.isFinite(price) || price <= 0) {
      setSaveError("Title, brand, type, condition, size, price, and at least one image are required.");
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
      formData.set("itemType", itemType);
      formData.set("condition", condition);
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
        itemType: "",
        condition: "",
        size: "",
        price: "",
        description: "",
      });
      uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
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

  async function startPayoutOnboarding() {
    setOnboardingPayouts(true);
    setPayoutError(null);
    try {
      const response = await fetch("/api/payments/onboarding", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; onboardingUrl?: string } | null;
      if (!response.ok || !payload?.onboardingUrl) {
        throw new Error(payload?.error ?? "Unable to start payout onboarding.");
      }
      window.location.href = payload.onboardingUrl;
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Unable to start payout onboarding.");
    } finally {
      setOnboardingPayouts(false);
    }
  }

  async function uploadShippingLabel(orderId: string, file: File) {
    setOrderError(null);
    setUploadingLabelFor(orderId);
    try {
      const formData = new FormData();
      formData.set("label", file);
      const response = await fetch(`/api/orders/${orderId}/label`, { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to upload label.");
      }
      router.refresh();
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Unable to upload label.");
    } finally {
      setUploadingLabelFor(null);
    }
  }

  async function syncPayoutStatus(options?: { replaceUrl?: boolean }) {
    setSyncingPayouts(true);
    setPayoutError(null);
    try {
      const response = await fetch("/api/payments/status", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { error?: string; payoutsEnabled?: boolean } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to sync payout status.");
      }

      router.refresh();
      if (payload?.payoutsEnabled) {
        setPayoutNotice("Payouts are now enabled. You can list items and receive payments.");
      }
    } catch (error) {
      setPayoutError(error instanceof Error ? error.message : "Unable to sync payout status.");
    } finally {
      setSyncingPayouts(false);
      if (options?.replaceUrl) {
        const url = new URL(window.location.href);
        url.searchParams.delete("payments");
        url.searchParams.delete("connectPayouts");
        window.history.replaceState(null, "", url.toString());
      }
    }
  }

  if (searchParams.get("payments") === "ready" && !payoutsReady && !syncingPayouts && !payoutNotice && !payoutError) {
    void syncPayoutStatus({ replaceUrl: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">My Closet</h1>
          <p className="mt-2 text-neutral-600">
            {activeTab === "purchases"
              ? `${purchaseItems.length} purchases saved to your account.`
              : activeTab === "sales"
                ? `${salesOrders.length} sales to fulfill and manage.`
                : `${items.length} designer pieces ready for offers.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-black/10 px-5 py-3 text-sm text-neutral-500">
            {currentUser.handle}
          </div>
          {payoutsReady ? (
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
              Payouts enabled
            </div>
          ) : (
            <button
              type="button"
              onClick={startPayoutOnboarding}
              disabled={onboardingPayouts}
              className="inline-flex items-center gap-2 rounded-full border border-black px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {onboardingPayouts ? "Opening..." : "Set up payouts"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!payoutsReady) {
                setPayoutError("Connect payouts before listing items so you can receive payments.");
                void startPayoutOnboarding();
                return;
              }
              setAddOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>
      {shouldPromptPayouts ? (
        <div className="mb-4 rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Connect payouts to receive payments.</p>
              <p className="mt-1 text-amber-900/80">
                Before you list items, you’ll need to enable payouts so we can pay you out when someone purchases your listing.
              </p>
            </div>
            <button
              type="button"
              onClick={startPayoutOnboarding}
              disabled={onboardingPayouts}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {onboardingPayouts ? "Opening..." : "Set up payouts"}
            </button>
          </div>
        </div>
      ) : null}
      {payoutNotice ? (
        <p className="mb-4 rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {payoutNotice}
        </p>
      ) : null}
      {payoutError ? <p className="mb-4 text-sm text-rose-700">{payoutError}</p> : null}
      {orderError ? <p className="mb-4 text-sm text-rose-700">{orderError}</p> : null}
      {notifications.length ? (
        <div className="mb-4 rounded-[28px] border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Notifications</p>
          <div className="mt-3 space-y-2 text-sm text-neutral-700">
            {notifications.slice(0, 3).map((note) => (
              <div key={note.id} className="rounded-2xl border border-black/5 bg-neutral-50 px-3 py-2">
                {note.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
            { id: "purchases", label: `Purchases (${purchaseItems.length})` },
            { id: "sales", label: `Sales (${salesOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "all" | "active" | "pending" | "purchases" | "sales")}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", activeTab === tab.id ? "bg-black text-white" : "bg-neutral-100 text-neutral-600")}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/trades/history"
            className="rounded-full px-4 py-2 text-sm font-semibold transition bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          >
            Trade History ({historyTrades.length})
          </Link>
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
      {activeTab === "purchases" ? (
        <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
          {purchaseItems.length ? (
            purchaseItems.map((item) => {
              const order = purchaseOrderByProductId.get(item.id);
              const due = order?.labelDueAt ? new Date(order.labelDueAt).getTime() : null;
              const remainingMs = due ? due - Date.now() : null;
              const remainingHours = remainingMs !== null ? Math.max(0, Math.round(remainingMs / (60 * 60 * 1000))) : null;
              const needsLabel = order?.status === "awaiting_label";
              return (
                <div key={item.id} className="space-y-3">
                  <ProductCard product={item} />
                  {order ? (
                    <div className="rounded-[24px] border border-black/10 bg-white p-4 text-sm text-neutral-700">
                      <p className="font-semibold text-black">Purchase status: {order.status.replace("_", " ")}</p>
                      {needsLabel ? (
                        <>
                          <p className="mt-1 text-neutral-600">
                            Upload shipping label within {remainingHours ?? 12}h to complete fulfillment.
                          </p>
                          <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                            {uploadingLabelFor === order.id ? "Uploading..." : "Upload shipping label"}
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              disabled={uploadingLabelFor !== null}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void uploadShippingLabel(order.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        </>
                      ) : order.shippingLabelUrl ? (
                        <a
                          href={order.shippingLabelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-semibold text-black underline"
                        >
                          View uploaded label
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600 md:col-span-2 lg:col-span-3">
              No purchases yet.
            </div>
          )}
        </div>
      ) : activeTab === "sales" ? (
        <div className="space-y-4">
          {salesOrders.length ? (
            salesOrders.map((order) => {
              const product = items.find((item) => item.id === order.productId);
              const labelReady = Boolean(order.shippingLabelUrl);
              return (
                <div key={order.id} className="rounded-[28px] border border-black/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Sale</p>
                      <p className="mt-1 text-lg font-semibold text-black">
                        {product ? (
                          <Link href={`/product/${product.id}`} className="hover:underline">
                            {product.title}
                          </Link>
                        ) : (
                          `Product #${order.productId}`
                        )}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Status: <span className="font-semibold text-black">{order.status.replace("_", " ")}</span>
                      </p>
                    </div>
                    <div className="rounded-full border border-black/10 bg-neutral-50 px-4 py-2 text-sm font-semibold text-black">
                      ${order.amount.toLocaleString()} {order.currency.toUpperCase()}
                    </div>
                  </div>
                  {labelReady ? (
                    <a
                      href={order.shippingLabelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-semibold text-black underline"
                    >
                      View buyer-provided label
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-600">Waiting for buyer to provide a shipping label.</p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
              No sales yet.
            </div>
          )}
        </div>
      ) : (
        <div className={cn("grid gap-6", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group/item relative overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                exitingIds.has(item.id) ? "pointer-events-none scale-90 opacity-0" : "",
              )}
            >
              <ProductCard product={item} />

              <div
                className={cn(
                  "absolute left-3 top-3 z-10 transition-transform duration-300 ease-out",
                  confirmDeleteId === item.id
                    ? "translate-y-0 pointer-events-auto"
                    : "pointer-events-none -translate-y-[calc(100%+12px)] group-hover/item:translate-y-0 group-hover/item:pointer-events-auto",
                )}
              >
                {confirmDeleteId === item.id ? (
                  <div className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-2.5 pr-3 shadow-md ring-1 ring-black/8">
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-xs font-semibold text-neutral-700">Remove listing?</span>
                    <span className="h-3 w-px bg-black/15" />
                    <button
                      type="button"
                      onClick={() => void deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="text-xs font-bold text-red-600 transition hover:text-red-700 disabled:opacity-40"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-medium text-neutral-400 transition hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    aria-label="Remove listing"
                    className="flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-2.5 pr-3.5 shadow-md ring-1 ring-black/8 transition hover:shadow-lg active:scale-95"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Remove</span>
                  </button>
                )}
              </div>
            </div>
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
            <div className="relative">
              <select
                value={draft.itemType}
                onChange={(event) => {
                  const nextType = event.target.value as "" | ClosetItemType;
                  const nextSizes = nextType ? closetSizeOptions(nextType) : [];
                  setDraft((current) => ({
                    ...current,
                    itemType: nextType,
                    size: nextSizes.includes(current.size) ? current.size : nextSizes[0] ?? "",
                  }));
                }}
                className="w-full appearance-none rounded-full border border-black/10 bg-white px-4 py-3 pr-12 outline-none focus:border-black"
              >
                <option value="" disabled>
                  Item type
                </option>
                {closetItemTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            <div className="relative">
              <select
                value={draft.condition}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    condition: event.target.value as "" | ClosetItemCondition,
                  }))
                }
                className="w-full appearance-none rounded-full border border-black/10 bg-white px-4 py-3 pr-12 outline-none focus:border-black"
              >
                <option value="" disabled>
                  Condition
                </option>
                {closetItemConditions.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            <div className="relative">
              <select
                value={draft.size}
                onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
                className="w-full appearance-none rounded-full border border-black/10 bg-white px-4 py-3 pr-12 outline-none focus:border-black disabled:bg-neutral-50 disabled:text-neutral-400"
                disabled={!draft.itemType}
              >
                <option value="" disabled>
                  Size
                </option>
                {availableSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">
                $
              </span>
              <input
                type="number"
                min="0"
                value={draft.price}
                onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                placeholder="0"
                className="w-full rounded-full border border-black/10 py-3 pl-9 pr-4 outline-none focus:border-black"
              />
            </div>
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
    <div className="mx-auto my-4 flex h-[calc(100dvh-8.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-sm sm:my-6 sm:h-[calc(100dvh-10rem)]">

      {/* ── Avatar rail ─────────────────────────────────────────────
          Narrow strip of circular avatars — fastest way to jump
          between conversations without reading names.              */}
      <nav className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-black/8 bg-neutral-50 py-3">
        {conversations.map((conversation) => {
          const user = usersById[conversation.userId];
          if (!user) return null;
          const isActive = selected?.id === conversation.id;
          return (
            <button
              key={conversation.id}
              type="button"
              title={user.name}
              onClick={() => setSelectedId(conversation.id)}
              className="group relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-colors hover:bg-black/5"
            >
              <div className="relative">
                <Avatar
                  user={user}
                  className={cn(
                    "h-9 w-9 text-[11px] ring-2 transition",
                    isActive ? "ring-black" : "ring-transparent",
                  )}
                />
                {user.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-neutral-50 bg-emerald-400" />
                )}
                {conversation.unread && !isActive && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-50 bg-black" />
                )}
              </div>
              <span className={cn(
                "w-full truncate text-center text-[9px] font-semibold leading-tight tracking-wide",
                isActive ? "text-black" : "text-neutral-400 group-hover:text-neutral-600",
              )}>
                {user.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Conversation list ────────────────────────────────────────
          Full list with search + preview — for reading context
          before switching.                                          */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-black/8">
        <div className="px-3.5 pb-3 pt-4">
          <h1 className="text-base font-semibold tracking-tight text-black">Messages</h1>
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full rounded-xl border border-transparent bg-black/5 py-2 pl-8.5 pr-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black/10 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conversation) => {
            const user = usersById[conversation.userId];
            if (!user) return null;
            const isActive = selected?.id === conversation.id;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={cn(
                  "relative flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors",
                  isActive ? "bg-black/5" : "hover:bg-black/[0.03]",
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-full bg-black" />
                )}
                <div className="relative shrink-0">
                  <Avatar user={user} className="h-8 w-8 text-[11px]" />
                  {user.online && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={cn("truncate text-sm", conversation.unread ? "font-semibold text-black" : "font-medium text-black/70")}>
                      {user.name}
                    </p>
                    <span className="shrink-0 text-[10px] text-neutral-400">{conversation.timestamp}</span>
                  </div>
                  <p className={cn("mt-0.5 truncate text-xs", conversation.unread ? "font-medium text-neutral-600" : "text-neutral-400")}>
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Thread panel ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selected && selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-black/8 px-5 py-3">
              <Link href={`/user/${selectedUser.id}`} className="group flex items-center gap-3">
                <div className="relative">
                  <Avatar user={selectedUser} className="h-8 w-8 text-[11px]" />
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-black transition group-hover:underline group-hover:underline-offset-2">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {selectedUser.online ? "Active now" : selectedUser.handle}
                  </p>
                </div>
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {selected.messages.map((message, i) => {
                const isMe = message.sender === "me";
                const prevSender = i > 0 ? selected.messages[i - 1]?.sender : null;
                const isFirstInGroup = prevSender !== message.sender;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full items-end gap-2",
                      isMe ? "flex-row-reverse" : "flex-row",
                      isFirstInGroup && i !== 0 ? "mt-4" : "",
                    )}
                  >
                    <div className="w-7 shrink-0">
                      {!isMe && isFirstInGroup ? (
                        <Avatar user={selectedUser} className="h-7 w-7 text-[10px]" />
                      ) : null}
                    </div>
                    <div className="flex max-w-[60%] flex-col gap-1">
                      {message.product ? (
                        <Link
                          href={`/product/${message.product.id}`}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-2.5 transition",
                            isMe
                              ? "border-white/15 bg-white/10 hover:bg-white/15"
                              : "border-black/8 bg-neutral-50 hover:border-black/20",
                          )}
                        >
                          <div className="relative h-12 w-10 overflow-hidden rounded-xl border border-black/5 bg-white">
                            <Image
                              src={message.product.imageUrl}
                              alt="Product snapshot"
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized={message.product.imageUrl.startsWith("blob:")}
                            />
                          </div>
                          <span className={cn("text-xs font-semibold", isMe ? "text-white/80" : "text-neutral-600")}>
                            View listing
                          </span>
                        </Link>
                      ) : null}
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          isMe
                            ? "rounded-br-sm bg-[#1a1212] text-white"
                            : "rounded-bl-sm bg-neutral-100 text-black",
                        )}
                      >
                        <p>{message.text}</p>
                      </div>
                      {isFirstInGroup && (
                        <p className={cn("text-[11px] text-neutral-400", isMe && "text-right")}>
                          {message.timestamp}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose */}
            <div className="border-t border-black/8 px-5 py-3">
              <div className="flex items-center gap-3">
                <input
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder={`Message ${selectedUser.name.split(" ")[0]}…`}
                  className="flex-1 rounded-2xl border border-black/8 bg-neutral-50 px-4 py-3 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-black/15 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !draftMessage.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1a1212] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  aria-label="Send"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 -translate-y-px translate-x-px rotate-45">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
              {messageError ? (
                <p className="mt-2 text-xs text-rose-600">{messageError}</p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 opacity-25">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
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
  const [pendingTradeId, setPendingTradeId] = useState<number | null>(null);

  async function updateTradeStatus(tradeId: number, status: "accepted" | "declined") {
    // Guard against concurrent mutations: a double-click on Accept, or Accept then
    // Decline in quick succession, would otherwise fire racing PATCHes whose
    // responses could land out of order and leave the UI disagreeing with the DB.
    if (pendingTradeId !== null || tradeStatusOverrides[tradeId]) return;
    setPendingTradeId(tradeId);
    setTradeActionError(null);
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Unable to update trade.");
      setTradeStatusOverrides((current) => ({ ...current, [tradeId]: status }));
      router.refresh();
    } catch (error) {
      setTradeActionError(error instanceof Error ? error.message : "Unable to update trade.");
    } finally {
      setPendingTradeId(null);
    }
  }

  const resolved = trades.map((t) => ({ ...t, status: tradeStatusOverrides[t.id] ?? t.status }));

  const receivedTrades = resolved.filter((t) => compact || t.type === "received");
  const sentTrades     = resolved.filter((t) => compact || t.type === "sent");
  const actionNeeded   = receivedTrades.filter((t) => t.status === "pending").length;
  const awaitingReply  = sentTrades.filter((t) => t.status === "pending").length;

  const tabTrades = compact ? resolved : resolved.filter((t) => t.type === activeTab);
  const visible   = tabTrades.filter((t) => filter === "all" || t.status === filter);

  const filterCounts: Record<string, number> = {
    all: tabTrades.length,
    pending:  tabTrades.filter((t) => t.status === "pending").length,
    accepted: tabTrades.filter((t) => t.status === "accepted").length,
    declined: tabTrades.filter((t) => t.status === "declined").length,
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-neutral-500">No trades to show.</p>
        ) : visible.map((trade) => {
          const user = usersById?.[trade.userId];
          const offerItems  = trade.type === "received" ? trade.theirItemIds : trade.yourItemIds;
          const wantItems   = trade.type === "received" ? trade.yourItemIds  : trade.theirItemIds;
          return (
            <TradeCard
              key={trade.id}
              trade={trade}
              user={user}
              offerItemIds={offerItems}
              wantItemIds={wantItems}
              productsById={productsById}
              onAccept={() => updateTradeStatus(trade.id, "accepted")}
              onDecline={() => updateTradeStatus(trade.id, "declined")}
              compact
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-black">Trade Proposals</h1>
          <p className="mt-1.5 text-neutral-500">Manage incoming offers and outgoing requests.</p>
        </div>
        <Link
          href="/trades/history"
          className="inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black"
        >
          <Clock3 className="h-4 w-4" />
          Trade History
        </Link>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className={cn(
          "rounded-[20px] border p-4 transition",
          actionNeeded > 0 ? "border-amber-200 bg-amber-50" : "border-black/10 bg-white",
        )}>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", actionNeeded > 0 ? "text-amber-600" : "text-neutral-400")}>
            Need Action
          </p>
          <p className={cn("mt-1.5 text-3xl font-semibold tracking-tight", actionNeeded > 0 ? "text-amber-900" : "text-black")}>
            {actionNeeded}
          </p>
        </div>
        <div className="rounded-[20px] border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Awaiting Reply</p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight text-black">{awaitingReply}</p>
        </div>
        <div className="rounded-[20px] border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Total</p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight text-black">{resolved.length}</p>
        </div>
      </div>

      {/* Tabs + filter row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-5">
        <div className="flex gap-1.5">
          {(["received", "sent"] as const).map((tab) => {
            const count = tab === "received" ? receivedTrades.length : sentTrades.length;
            const urgentCount = tab === "received" ? actionNeeded : awaitingReply;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                  activeTab === tab ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                )}
              >
                {tab === "received" ? "Received" : "Sent"}
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  activeTab === tab ? "bg-white/20 text-white" : "bg-black/8 text-neutral-600",
                )}>
                  {count}
                </span>
                {urgentCount > 0 && activeTab !== tab ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5">
          {(["all", "pending", "accepted", "declined"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition",
                filter === value
                  ? "border-black bg-black text-white"
                  : "border-black/10 text-neutral-500 hover:border-black/30 hover:text-black",
              )}
            >
              {value}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                filter === value ? "bg-white/20" : "bg-black/5",
              )}>
                {filterCounts[value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {tradeActionError ? (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircle className="h-4 w-4 shrink-0" />
          {tradeActionError}
        </div>
      ) : null}

      {/* Trade cards */}
      {visible.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-12 text-center">
          <p className="font-semibold text-black">No {filter !== "all" ? filter : ""} {activeTab} proposals</p>
          <p className="mt-1 text-sm text-neutral-500">
            {activeTab === "received"
              ? "When members send you trade offers, they'll appear here."
              : "Offers you send to other members will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((trade) => {
            const user = usersById?.[trade.userId];
            // Direction-aware item labels
            const offerItemIds = trade.type === "received" ? trade.theirItemIds : trade.yourItemIds;
            const wantItemIds  = trade.type === "received" ? trade.yourItemIds  : trade.theirItemIds;
            const offerCash    = trade.type === "received" ? trade.theirCash    : trade.yourCash;
            const wantCash     = trade.type === "received" ? trade.yourCash     : trade.theirCash;
            return (
              <TradeCard
                key={trade.id}
                trade={trade}
                user={user}
                offerItemIds={offerItemIds}
                wantItemIds={wantItemIds}
                offerCash={offerCash}
                wantCash={wantCash}
                productsById={productsById}
                onAccept={() => updateTradeStatus(trade.id, "accepted")}
                onDecline={() => updateTradeStatus(trade.id, "declined")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TradeCard({
  trade,
  user,
  offerItemIds,
  wantItemIds,
  offerCash,
  wantCash,
  productsById,
  onAccept,
  onDecline,
  compact = false,
}: {
  trade: TradeProposal;
  user?: UserProfile;
  offerItemIds: number[];
  wantItemIds: number[];
  offerCash?: number;
  wantCash?: number;
  productsById?: Record<number, Product | undefined>;
  onAccept: () => void;
  onDecline: () => void;
  compact?: boolean;
}) {
  const isReceived = trade.type === "received";
  const isPending  = trade.status === "pending";

  const offerLabel = isReceived ? "They're offering" : "You're offering";
  const wantLabel  = isReceived ? "They want"        : "You want";

  return (
    <div className={cn(
      "overflow-hidden rounded-[28px] border bg-white transition",
      isPending && isReceived ? "border-amber-200 shadow-[0_0_0_3px_theme(colors.amber.100)]" : "border-black/10",
    )}>
      {/* Card header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-6 py-4",
        isPending && isReceived ? "border-b border-amber-100 bg-amber-50/60" : "border-b border-black/6 bg-neutral-50/60",
      )}>
        <div className="flex items-center gap-3">
          {user ? (
            <Avatar user={user} className="h-10 w-10 text-sm" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-neutral-200" />
          )}
          <div>
            <p className="font-semibold text-black">{user?.name ?? "Barter Member"}</p>
            <p className="text-xs text-neutral-500">
              {user?.handle ? `${user.handle} · ` : ""}{trade.timestamp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isReceived ? "bg-black/6 text-neutral-700" : "bg-neutral-100 text-neutral-500",
          )}>
            {isReceived ? "Received" : "Sent"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            isPending && isReceived  ? "bg-amber-100 text-amber-900" :
            isPending                ? "bg-neutral-100 text-neutral-600" :
            trade.status === "accepted"  ? "bg-emerald-100 text-emerald-800" :
            trade.status === "scheduled" ? "bg-indigo-100 text-indigo-800" :
            trade.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                                           "bg-rose-100 text-rose-800",
          )}>
            {isPending     ? <Clock3     className="h-3 w-3" /> : null}
            {trade.status === "accepted" || trade.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : null}
            {trade.status === "scheduled" ? <MapPin className="h-3 w-3" /> : null}
            {trade.status === "declined" || trade.status === "canceled" ? <XCircle className="h-3 w-3" /> : null}
            <span className="capitalize">{trade.status}</span>
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Items */}
        <div className="grid gap-3 md:grid-cols-[1fr_36px_1fr]">
          {/* Offer side */}
          <TradeItemPanel
            label={offerLabel}
            itemIds={offerItemIds}
            cash={offerCash}
            productsById={productsById}
            highlight={isReceived}
          />
          <div className="hidden items-center justify-center md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white">
              <ArrowLeftRight className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          {/* Want side */}
          <TradeItemPanel
            label={wantLabel}
            itemIds={wantItemIds}
            cash={wantCash}
            productsById={productsById}
          />
        </div>

        {/* Message */}
        {trade.message ? (
          <div className="mt-4 flex gap-2.5 rounded-2xl border border-black/6 bg-neutral-50 px-4 py-3">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-sm italic text-neutral-600">&ldquo;{trade.message}&rdquo;</p>
          </div>
        ) : null}

        {/* Actions */}
        {!compact && isPending ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isReceived ? (
              <>
                <button
                  type="button"
                  onClick={onAccept}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  <Check className="h-4 w-4" />
                  Accept Trade
                </button>
                <button
                  type="button"
                  onClick={onDecline}
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold text-black transition hover:border-black"
                >
                  Decline
                </button>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-2 rounded-full border border-black/20 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-5 py-3 text-sm text-neutral-500">
                <Clock3 className="h-4 w-4" />
                Awaiting their response
              </div>
            )}
          </div>
        ) : null}

        {/* Resolved state footer */}
        {!compact && !isPending ? (
          trade.status === "accepted" || trade.status === "scheduled" ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-neutral-50 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-500" />
                {trade.status === "scheduled" ? "Meetup scheduled" : "Accepted — set up your meetup"}
              </span>
              <Link
                href={`/trades/${trade.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                {trade.status === "scheduled" ? "View meetup" : "Arrange meetup"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className={cn(
              "mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium",
              trade.status === "completed" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
            )}>
              {trade.status === "completed"
                ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> This trade is complete</>
                : <><XCircle className="h-4 w-4 shrink-0" /> This trade was {trade.status}</>}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function TradeItemPanel({
  label,
  itemIds,
  cash,
  productsById,
  highlight = false,
}: {
  label: string;
  itemIds: number[];
  cash?: number;
  productsById?: Record<number, Product | undefined>;
  highlight?: boolean;
}) {
  const items = itemIds.map((id) => productsById?.[id]).filter(Boolean) as Product[];
  const totalValue = items.reduce((s, item) => s + item.price, 0) + (cash ?? 0);

  return (
    <div className={cn(
      "rounded-[20px] border p-4",
      highlight ? "border-black/10 bg-neutral-50/80" : "border-black/8 bg-neutral-50/40",
    )}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
        {totalValue > 0 ? (
          <p className="text-xs font-semibold text-neutral-500">{formatMoney(totalValue)}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/product/${item.id}`} className="group flex items-center gap-3">
            <ProductImage
              src={item.images[0]}
              alt={item.title}
              className="h-16 w-14 shrink-0 rounded-2xl"
              sizes="56px"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-black group-hover:underline">{item.brand}</p>
              <p className="truncate text-xs text-neutral-500">{item.title}</p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-700">{formatMoney(item.price)}</p>
            </div>
          </Link>
        ))}
        {items.length === 0 ? <p className="text-xs text-neutral-400">No items</p> : null}
      </div>
      {cash ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-black">
          <Plus className="h-3 w-3" />
          {formatMoney(cash)} cash
        </div>
      ) : null}
    </div>
  );
}

export function TradeHistoryPage({
  trades,
  usersById,
  productsById,
}: {
  trades: TradeProposal[];
  usersById: Record<string, UserProfile | undefined>;
  productsById: Record<number, Product | undefined>;
}) {
  const completedTrades = trades.filter((t) => t.status === "completed");

  const totalValue = completedTrades.reduce((sum, trade) => {
    const yourValue = trade.yourItemIds.reduce((s, id) => s + (productsById[id]?.price ?? 0), 0);
    const theirValue = trade.theirItemIds.reduce((s, id) => s + (productsById[id]?.price ?? 0), 0);
    return sum + yourValue + theirValue;
  }, 0);

  const uniquePartners = new Set(completedTrades.map((t) => t.userId)).size;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/closet" className="hover:text-black">My Closet</Link>
            <span>/</span>
            <span>Trade History</span>
          </nav>
          <h1 className="text-4xl font-semibold tracking-tight text-black">Trade History</h1>
          <p className="mt-1 text-neutral-500">Every completed swap from your closet.</p>
        </div>
        <Link
          href="/trades"
          className="inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Active Trades
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{completedTrades.length}</p>
        </div>
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Total Value</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{formatMoney(totalValue)}</p>
        </div>
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Trade Partners</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{uniquePartners}</p>
        </div>
      </div>

      {/* Timeline */}
      {completedTrades.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-12 text-center text-neutral-500">
          No completed trades yet. Accept an offer to get started.
        </div>
      ) : (
        <div className="relative space-y-6">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 h-[calc(100%-48px)] w-px bg-black/8" aria-hidden="true" />

          {completedTrades.map((trade) => {
            const partner = usersById[trade.userId];
            const yourItems = trade.yourItemIds.map((id) => productsById[id]).filter(Boolean) as Product[];
            const theirItems = trade.theirItemIds.map((id) => productsById[id]).filter(Boolean) as Product[];

            return (
              <div key={trade.id} className="relative flex gap-6">
                {/* Timeline dot */}
                <div className="relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
                  <CheckCircle2 className="h-4 w-4 text-black" />
                </div>

                {/* Card */}
                <div className="flex-1 overflow-hidden rounded-[28px] border border-black/10 bg-white p-6">
                  {/* Card header */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {partner ? (
                        <Avatar user={partner} className="h-10 w-10 text-sm" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-neutral-100" />
                      )}
                      <div>
                        <p className="font-semibold text-black">{partner?.name ?? "Barter Member"}</p>
                        <p className="text-xs text-neutral-500">{partner?.handle ?? ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400">{trade.timestamp}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          trade.type === "sent"
                            ? "bg-neutral-100 text-neutral-600"
                            : "bg-black/5 text-neutral-700",
                        )}
                      >
                        {trade.type === "sent" ? "You proposed" : "They proposed"}
                      </span>
                    </div>
                  </div>

                  {/* Items grid */}
                  <div className="grid gap-4 md:grid-cols-[1fr_40px_1fr]">
                    {/* Your side */}
                    <div className="rounded-[20px] border border-black/8 bg-neutral-50 p-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                        You gave
                      </p>
                      <div className="space-y-3">
                        {yourItems.map((item) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="flex items-center gap-3 group">
                            <ProductImage
                              src={item.images[0]}
                              alt={item.title}
                              className="h-16 w-14 shrink-0 rounded-2xl"
                              sizes="56px"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-black group-hover:underline">{item.brand}</p>
                              <p className="truncate text-xs text-neutral-500">{item.title}</p>
                              <p className="text-xs font-semibold text-neutral-700">{formatMoney(item.price)}</p>
                            </div>
                          </Link>
                        ))}
                        {yourItems.length === 0 && (
                          <p className="text-xs text-neutral-400">No items</p>
                        )}
                      </div>
                      {trade.yourCash ? (
                        <p className="mt-3 text-xs font-semibold text-black">+ {formatMoney(trade.yourCash)} cash</p>
                      ) : null}
                    </div>

                    {/* Arrow */}
                    <div className="hidden items-center justify-center md:flex">
                      <ArrowLeftRight className="h-5 w-5 text-neutral-300" />
                    </div>

                    {/* Their side */}
                    <div className="rounded-[20px] border border-black/8 bg-neutral-50 p-4">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                        You received
                      </p>
                      <div className="space-y-3">
                        {theirItems.map((item) => (
                          <Link key={item.id} href={`/product/${item.id}`} className="flex items-center gap-3 group">
                            <ProductImage
                              src={item.images[0]}
                              alt={item.title}
                              className="h-16 w-14 shrink-0 rounded-2xl"
                              sizes="56px"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-black group-hover:underline">{item.brand}</p>
                              <p className="truncate text-xs text-neutral-500">{item.title}</p>
                              <p className="text-xs font-semibold text-neutral-700">{formatMoney(item.price)}</p>
                            </div>
                          </Link>
                        ))}
                        {theirItems.length === 0 && (
                          <p className="text-xs text-neutral-400">No items</p>
                        )}
                      </div>
                      {trade.theirCash ? (
                        <p className="mt-3 text-xs font-semibold text-black">+ {formatMoney(trade.theirCash)} cash</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Message */}
                  {trade.message ? (
                    <div className="mt-4 flex gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                      <span className="italic">&ldquo;{trade.message}&rdquo;</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const [authModal, setAuthModal] = useState<null | "message">(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-black/10 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <Avatar user={user} className="h-24 w-24 text-2xl" />
          <div className="flex-1">
            {(() => {
              const tier = getTier(user.points ?? 0);
              const isOwner = viewer?.slug === user.id;

              // Top brands by listing count (max 4)
              const brandCounts = listingProducts.reduce<Record<string, number>>((acc, p) => {
                acc[p.brand] = (acc[p.brand] ?? 0) + 1;
                return acc;
              }, {});
              const topBrands = Object.entries(brandCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([brand]) => brand);

              return (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-semibold tracking-tight text-black">{user.name}</h1>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest", tier.bg, tier.color)}>
                      {tier.name}
                    </span>
                  </div>
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
                    {isOwner && user.points != null && (
                      <span className="inline-flex items-center gap-1 font-semibold text-black">
                        ◆ {user.points.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                  {topBrands.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Active in</span>
                      {topBrands.map((brand) => (
                        <Link
                          key={brand}
                          href={`/brands/${slugifyBrand(brand)}`}
                          className="rounded-full border border-black/10 bg-neutral-50 px-3 py-1 text-xs font-semibold text-black transition hover:border-black hover:bg-black hover:text-white"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            <p className="mt-4 max-w-2xl text-neutral-600">{user.bio}</p>
          </div>
          <div className="flex gap-3">
            {viewer ? (
              <button
                type="button"
                onClick={() => setMessageModalOpen(true)}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Messages
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal("message")}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                <MessageSquare className="mr-2 inline h-4 w-4" />
                Messages
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

      {user.points != null && (
        <PointsCard points={user.points} linkToRewards={viewer?.slug === user.id} />
      )}

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
        title="Sign in to message this member"
        description="Create an account or sign in to message members and continue the conversation later."
      />
      <MessageComposeModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        recipient={user}
      />
    </div>
  );
}

// ── Rewards Page ─────────────────────────────────────────────────────────────

const EARN_ACTIONS = [
  { icon: ArrowLeftRight, label: "Complete a trade",          pts: 50  },
  { icon: Plus,           label: "List an item",              pts: 10  },
  { icon: ArrowUp,        label: "Receive an upvote",         pts: 2   },
  { icon: Star,           label: "Receive a review",          pts: 5   },
  { icon: MessageSquare,  label: "Post in a community",       pts: 3   },
  { icon: ShieldCheck,    label: "Item gets authenticated",   pts: 15  },
  { icon: Users,          label: "Refer a new member",        pts: 100 },
  { icon: CheckCircle2,   label: "Founding member bonus",     pts: 500 },
] as const;

type RewardBenefit = {
  id: string;
  title: string;
  description: string;
  cost: number;
  duration: string;
};

const BENEFITS: RewardBenefit[] = [
  { id: "fee-waiver",   title: "0% Transaction Fee",    description: "Your next completed trade charges zero platform fee — applied automatically at checkout.",        cost: 800,  duration: "1 trade"    },
  { id: "boost",        title: "Listing Boost",         description: "Pins one of your listings to the top of search results and brand pages for a full week.",          cost: 400,  duration: "7 days"     },
  { id: "verified",     title: "Verified Member Badge", description: "Displays a ✓ badge across your profile and all listings, signalling trust to trading partners.",   cost: 1200, duration: "30 days"    },
  { id: "drops",        title: "Drop Early Access",     description: "Get notified 48 hours before brand drops go public — shop and trade before anyone else.",          cost: 600,  duration: "1 season"   },
  { id: "auth-rush",    title: "Priority Auth",         description: "Skip the authentication queue. Items reviewed and verified within 2 hours of submission.",         cost: 250,  duration: "1 item"     },
  { id: "fee-month",    title: "Reduced Fee — 30 Days", description: "Cut your transaction fee by 1% on every trade for a full month. Stackable up to -3%.",             cost: 1500, duration: "30 days"    },
];

export function RewardsPage({ user }: { user: UserProfile }) {
  const [balance, setBalance] = useState(user.points ?? 0);
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); }, []);
  const tier = getTier(balance);

  function redeem(benefit: RewardBenefit) {
    if (balance < benefit.cost || redeemed.has(benefit.id)) return;
    setBalance((b) => b - benefit.cost);
    setRedeemed((s) => new Set([...s, benefit.id]));
    setJustRedeemed(benefit.id);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setJustRedeemed(null), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Header card ── */}
      <div className="overflow-hidden rounded-[32px] bg-[#1a1212] px-8 py-8 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">Barter Points</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-6xl font-semibold tabular-nums tracking-tight">
              ◆ {balance.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-white/50">{user.handle}</p>
          </div>
          <span
            className={cn(
              "shrink-0 self-start rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest",
              tier.name === "Platinum" ? "bg-sky-400/20 text-sky-300"
                : tier.name === "Gold"   ? "bg-amber-400/20 text-amber-300"
                : tier.name === "Silver" ? "bg-white/15 text-white/70"
                : "bg-orange-900/40 text-orange-300",
            )}
          >
            {tier.name}
          </span>
        </div>

        {/* Progress */}
        {tier.name !== "Platinum" && (
          <div className="mt-6">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/60 transition-all duration-500"
                style={{ width: `${Math.round(((balance - tier.min) / (tier.next - tier.min)) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">
              {(tier.next - balance).toLocaleString()} pts to {TIERS[TIERS.findIndex((t) => t.name === tier.name) + 1]?.name}
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        {/* ── How to earn ── */}
        <div>
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-black">How to earn</h2>
          <ul className="space-y-2">
            {EARN_ACTIONS.map(({ icon: Icon, label, pts }) => (
              <li
                key={label}
                className="flex items-center justify-between rounded-2xl border border-black/8 bg-white px-4 py-3"
              >
                <span className="flex items-center gap-3 text-sm text-neutral-700">
                  <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                  {label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-black">+{pts}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-400">
            Points are awarded automatically when the qualifying action is confirmed on the platform.
          </p>
        </div>

        {/* ── Exchange ── */}
        <div>
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-black">Exchange points</h2>
          <ul className="space-y-3">
            {BENEFITS.map((benefit) => {
              const canAfford = balance >= benefit.cost;
              const isRedeemed = redeemed.has(benefit.id);
              const isFlashing = justRedeemed === benefit.id;

              return (
                <li
                  key={benefit.id}
                  className={cn(
                    "rounded-2xl border bg-white p-4 transition-all",
                    isRedeemed ? "border-emerald-200 bg-emerald-50" : "border-black/8",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-black">{benefit.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{benefit.description}</p>
                      <p className="mt-1.5 text-[11px] font-medium text-neutral-400">{benefit.duration}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-semibold tabular-nums text-black">
                        ◆ {benefit.cost.toLocaleString()}
                      </span>
                      {isRedeemed ? (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all",
                            isFlashing ? "scale-105" : "scale-100",
                          )}
                        >
                          <Check className="h-3 w-3" /> Redeemed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => redeem(benefit)}
                          disabled={!canAfford}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                            canAfford
                              ? "bg-black text-white hover:bg-neutral-800 active:scale-95"
                              : "cursor-not-allowed bg-black/6 text-neutral-400",
                          )}
                        >
                          {canAfford ? "Redeem" : "Need more pts"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
