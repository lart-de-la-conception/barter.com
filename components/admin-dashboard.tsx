"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, CheckCircle2, Clock3, Flag, Search, ShieldCheck, XCircle } from "lucide-react";
import type { ModerationStatus, Product, VerificationStatus } from "@/lib/marketplace-types";

type Tab = "listings" | "verification" | "history";
type DatePreset = "any" | "today" | "7d" | "30d" | "custom";

const moderationOptions: Array<{ value: ModerationStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approve" },
  { value: "denied", label: "Deny" },
  { value: "flagged", label: "Flag" },
  { value: "needs_info", label: "Needs info" },
];

const verificationOptions: Array<{ value: VerificationStatus; label: string }> = [
  { value: "verified", label: "Verified" },
  { value: "failed", label: "Failed" },
  { value: "needs_review", label: "Needs review" },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ModerationPill({ status }: { status: ModerationStatus }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";
  switch (status) {
    case "approved":
      return (
        <span className={cn(base, "bg-emerald-50 text-emerald-700")}>
          <CheckCircle2 className="h-3 w-3" /> Approved
        </span>
      );
    case "denied":
      return (
        <span className={cn(base, "bg-rose-50 text-rose-700")}>
          <XCircle className="h-3 w-3" /> Denied
        </span>
      );
    case "flagged":
      return (
        <span className={cn(base, "bg-orange-50 text-orange-700")}>
          <Flag className="h-3 w-3" /> Flagged
        </span>
      );
    case "needs_info":
      return (
        <span className={cn(base, "bg-amber-50 text-amber-800")}>
          <AlertTriangle className="h-3 w-3" /> Needs info
        </span>
      );
    default:
      return (
        <span className={cn(base, "bg-neutral-100 text-neutral-700")}>
          <Clock3 className="h-3 w-3" /> Pending review
        </span>
      );
  }
}

export function VerificationPill({ status }: { status: VerificationStatus }) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";
  switch (status) {
    case "verified":
      return (
        <span className={cn(base, "bg-sky-50 text-sky-700")}>
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      );
    case "failed":
      return (
        <span className={cn(base, "bg-rose-50 text-rose-700")}>
          <XCircle className="h-3 w-3" /> Failed verification
        </span>
      );
    case "needs_review":
      return (
        <span className={cn(base, "bg-amber-50 text-amber-800")}>
          <AlertTriangle className="h-3 w-3" /> Needs deeper review
        </span>
      );
    default:
      return (
        <span className={cn(base, "bg-neutral-100 text-neutral-600")}>Unverified</span>
      );
  }
}

export function AdminDashboard({ products }: { products: Product[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("listings");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [datePreset, setDatePreset] = useState<DatePreset>("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [uploadedFromMs, setUploadedFromMs] = useState<number | null>(null);
  const [uploadedToMs, setUploadedToMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const counts = useMemo(() => {
    return {
      pending: products.filter((product) => product.moderationStatus === "pending").length,
      flagged: products.filter((product) => product.moderationStatus === "flagged").length,
      needsInfo: products.filter((product) => product.moderationStatus === "needs_info").length,
      approved: products.filter((product) => product.moderationStatus === "approved").length,
      denied: products.filter((product) => product.moderationStatus === "denied").length,
      history: products.filter((product) => product.moderationStatus === "approved" || product.moderationStatus === "denied").length,
      verified: products.filter((product) => product.verificationStatus === "verified").length,
      needsDeeperReview: products.filter((product) => product.verificationStatus === "needs_review").length,
    };
  }, [products]);

  const visible = useMemo(() => {
    if (tab === "listings") {
      const priority: Record<ModerationStatus, number> = {
        pending: 0,
        flagged: 1,
        needs_info: 2,
        denied: 99,
        approved: 99,
      };
      return [...products]
        .filter((product) => product.moderationStatus === "pending" || product.moderationStatus === "flagged" || product.moderationStatus === "needs_info")
        .sort((a, b) => priority[a.moderationStatus] - priority[b.moderationStatus]);
    }

    if (tab === "history") {
      const priority: Record<ModerationStatus, number> = {
        denied: 0,
        approved: 1,
        pending: 99,
        flagged: 99,
        needs_info: 99,
      };
      return [...products]
        .filter((product) => product.moderationStatus === "approved" || product.moderationStatus === "denied")
        .sort((a, b) => {
          const statusDelta = priority[a.moderationStatus] - priority[b.moderationStatus];
          if (statusDelta !== 0) return statusDelta;
          return b.id - a.id;
        });
    }

    const priority: Record<VerificationStatus, number> = {
      needs_review: 0,
      unverified: 1,
      failed: 2,
      verified: 3,
    };
    return [...products].sort((a, b) => priority[a.verificationStatus] - priority[b.verificationStatus]);
  }, [products, tab]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const withQuery = !normalized
      ? visible
      : visible.filter((product) => {
          const moderation = product.moderationStatus.replace("_", " ");
          const verification = product.verificationStatus.replace("_", " ");
          return (
            product.title.toLowerCase().includes(normalized) ||
            product.brand.toLowerCase().includes(normalized) ||
            product.sellerId.toLowerCase().includes(normalized) ||
            moderation.includes(normalized) ||
            verification.includes(normalized) ||
            String(product.id).includes(normalized)
          );
        });

    if (uploadedFromMs === null && uploadedToMs === null) return withQuery;

    return withQuery.filter((product) => {
      if (!product.createdAt) return true;
      const uploaded = new Date(product.createdAt).getTime();
      if (!Number.isFinite(uploaded)) return true;
      if (uploadedFromMs !== null && uploaded < uploadedFromMs) return false;
      if (uploadedToMs !== null && uploaded > uploadedToMs) return false;
      return true;
    });
  }, [query, uploadedFromMs, uploadedToMs, visible]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [currentPage, filtered, pageSize]);

  async function submitUpdate(
    product: Product,
    payload: { moderationStatus?: ModerationStatus; verificationStatus?: VerificationStatus },
  ) {
    setError(null);
    setPendingId(product.id);

    try {
      const note = notes[product.id]?.trim() ?? "";
      const body: Record<string, unknown> = { ...payload };
      if (payload.moderationStatus) {
        body.moderationNote = note || null;
      }
      if (payload.verificationStatus) {
        body.verificationNote = note || null;
      }

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const responsePayload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(responsePayload?.error ?? "Unable to update listing.");
      }

      setNotes((current) => ({ ...current, [product.id]: "" }));
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update listing.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">Admin</h1>
        <p className="mt-2 text-neutral-600">Moderate listings and verify authenticity before they go live to members.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Pending review" value={String(counts.pending)} tone="neutral" />
        <StatCard label="Flagged" value={String(counts.flagged)} tone="orange" />
        <StatCard label="Needs info" value={String(counts.needsInfo)} tone="amber" />
        <StatCard label="Verified" value={String(counts.verified)} tone="sky" />
      </div>

      <div className="mb-6 inline-flex rounded-full border border-black/10 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setTab("listings")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            tab === "listings" ? "bg-white text-black shadow-sm" : "text-neutral-500",
          )}
        >
          Listings
        </button>
        <button
          type="button"
          onClick={() => setTab("verification")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            tab === "verification" ? "bg-white text-black shadow-sm" : "text-neutral-500",
          )}
        >
          Verification
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            tab === "history" ? "bg-white text-black shadow-sm" : "text-neutral-500",
          )}
        >
          History ({counts.history})
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title, brand, seller, status, or id…"
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-500">Uploaded</span>
          {([
            { id: "any", label: "Any" },
            { id: "today", label: "Today" },
            { id: "7d", label: "7d" },
            { id: "30d", label: "30d" },
            { id: "custom", label: "Custom" },
          ] as const).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setDatePreset(option.id);
                setPage(1);
                if (option.id === "any") {
                  setUploadedFromMs(null);
                  setUploadedToMs(null);
                }

                if (option.id === "today") {
                  const from = new Date(new Date().toDateString()).getTime();
                  setUploadedFromMs(from);
                  setUploadedToMs(null);
                }

                if (option.id === "7d") {
                  setUploadedFromMs(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  setUploadedToMs(null);
                }

                if (option.id === "30d") {
                  setUploadedFromMs(Date.now() - 30 * 24 * 60 * 60 * 1000);
                  setUploadedToMs(null);
                }

                if (option.id !== "custom") {
                  setDateFrom("");
                  setDateTo("");
                }
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 font-semibold transition",
                datePreset === option.id
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black hover:border-black",
              )}
            >
              {option.label}
            </button>
          ))}

          {datePreset === "custom" ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  const value = event.target.value;
                  setDateFrom(value);
                  setUploadedFromMs(value ? new Date(`${value}T00:00:00`).getTime() : null);
                  setPage(1);
                }}
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  const value = event.target.value;
                  setDateTo(value);
                  setUploadedToMs(value ? new Date(`${value}T23:59:59.999`).getTime() : null);
                  setPage(1);
                }}
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black"
              />
            </div>
          ) : null}

          <span className="text-neutral-500">Per page</span>
          {[8, 12, 24].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPageSize(value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 font-semibold transition",
                pageSize === value ? "border-black bg-black text-white" : "border-black/10 bg-white text-black hover:border-black",
              )}
            >
              {value}
            </button>
          ))}
          <span className="ml-2 text-neutral-500">
            {filtered.length.toLocaleString()} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center text-neutral-600">
            {tab === "history" ? "No finalized listings in history yet." : "Nothing to review right now."}
          </div>
        ) : null}
        {paged.map((product) => {
          const isHistoryTab = tab === "history";
          const options = tab === "listings" ? moderationOptions : verificationOptions;
          const currentValue: string = tab === "listings" ? product.moderationStatus : product.verificationStatus;
          const currentNote = tab === "listings" || isHistoryTab ? product.moderationNote ?? "" : product.verificationNote ?? "";
          const isPending = pendingId === product.id;

          return (
            <div
              key={product.id}
              className="grid gap-5 rounded-[28px] border border-black/10 bg-white p-5 md:grid-cols-[200px_minmax(0,1fr)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/5">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized={product.images[0].startsWith("blob:")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-500">No image</div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{product.brand}</p>
                    <Link
                      href={`/product/${product.id}`}
                      className="text-lg font-semibold text-black transition hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-600">
                      Seller {product.sellerId || "unknown"} · Size {product.size} · ${product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ModerationPill status={product.moderationStatus} />
                    <VerificationPill status={product.verificationStatus} />
                  </div>
                </div>

                {currentNote ? (
                  <p className="rounded-2xl border border-black/10 bg-neutral-50 p-3 text-xs text-neutral-600">
                    <span className="font-semibold text-black">Last reviewer note:</span> {currentNote}
                  </p>
                ) : null}

                {isHistoryTab ? (
                  <p className="rounded-2xl border border-black/10 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                    Final moderation decision archived here.
                  </p>
                ) : (
                  <>
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      {tab === "listings" ? "Moderator note (optional)" : "Verification note (optional)"}
                    </label>
                    <textarea
                      value={notes[product.id] ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [product.id]: event.target.value }))}
                      placeholder={
                        tab === "listings"
                          ? "Why are you approving, denying, or asking for more photos?"
                          : "Add context on authenticity, condition, or what needs a deeper look."
                      }
                      className="min-h-[72px] w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                    />

                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => {
                        const isCurrent = option.value === currentValue;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              submitUpdate(
                                product,
                                tab === "listings"
                                  ? { moderationStatus: option.value as ModerationStatus }
                                  : { verificationStatus: option.value as VerificationStatus },
                              )
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                              isCurrent
                                ? "border-black bg-black text-white"
                                : "border-black/10 bg-white text-black hover:border-black",
                              isPending && "cursor-not-allowed opacity-60",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length ? (
          <div className="flex flex-col items-center justify-between gap-3 rounded-[28px] border border-black/10 bg-white p-5 sm:flex-row">
            <div className="text-sm text-neutral-500">
              Page <span className="font-semibold text-black">{currentPage}</span> of{" "}
              <span className="font-semibold text-black">{totalPages}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "neutral" | "orange" | "amber" | "sky" }) {
  const palette: Record<string, string> = {
    neutral: "border-black/10 bg-white",
    orange: "border-orange-200 bg-orange-50",
    amber: "border-amber-200 bg-amber-50",
    sky: "border-sky-200 bg-sky-50",
  };

  return (
    <div className={cn("rounded-[28px] border p-5", palette[tone])}>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{value}</p>
    </div>
  );
}
