"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { TradeDetailData } from "@/lib/data/marketplace";
import type { PlaceSuggestion } from "@/lib/geo";
import { buildStaticMapUrl } from "@/lib/geo/static-map";
import type { Product } from "@/lib/marketplace-types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return currency.format(value);
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type PlaceSource = "auto_suggested" | "curated_safe_zone" | "manual";

type SelectedSpot = {
  placeName: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeSource: PlaceSource;
  mapboxPlaceId?: string;
};

function formatScheduledFor(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TradeMeetupPanel({ data }: { data: TradeDetailData }) {
  const router = useRouter();
  const {
    trade,
    viewer,
    counterpart,
    productsById,
    viewerLocation,
    counterpartLocation,
    suggestions,
    mapboxConfigured,
  } = data;

  const meetup = trade.meetup;
  const isInitiator = trade.type === "sent";
  const counterpartName = counterpart?.name ?? "the other member";

  const viewerConfirmedAt = isInitiator ? meetup?.initiatorConfirmedAt : meetup?.recipientConfirmedAt;
  const counterpartConfirmedAt = isInitiator
    ? meetup?.recipientConfirmedAt
    : meetup?.initiatorConfirmedAt;
  const proposedByViewer = meetup ? meetup.proposedByProfileId === viewer.profileId : false;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);

  async function call(url: string, init: RequestInit) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(url, init);
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Something went wrong.");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const jsonHeaders = { "Content-Type": "application/json" };

  function proposeSpot(spot: SelectedSpot, scheduledFor?: string) {
    return call(`/api/trades/${trade.id}/meetup`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ ...spot, scheduledFor }),
    });
  }

  function respond(action: "agree" | "cancel") {
    return call(`/api/trades/${trade.id}/meetup`, {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ action }),
    });
  }

  function confirmExchange() {
    return call(`/api/trades/${trade.id}/meetup/confirm`, {
      method: "POST",
      headers: jsonHeaders,
      body: "{}",
    });
  }

  const meetupSpot: SelectedSpot | null = meetup
    ? {
        placeName: meetup.placeName,
        address: meetup.address,
        latitude: meetup.latitude,
        longitude: meetup.longitude,
        placeSource: meetup.placeSource,
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/trades"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-black"
      >
        <ChevronLeft className="h-4 w-4" />
        All trades
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">Local trade</h1>
          <p className="mt-1 text-neutral-500">
            with <span className="font-medium text-neutral-700">{counterpartName}</span>
          </p>
        </div>
        <StatusBadge status={trade.status} />
      </header>

      {/* What's being exchanged */}
      <div className="mt-6 grid gap-3 rounded-[20px] border border-black/10 bg-white p-5 md:grid-cols-[1fr_40px_1fr]">
        <ExchangeColumn
          label="You give"
          itemIds={trade.yourItemIds}
          cash={trade.yourCash}
          productsById={productsById}
        />
        <div className="hidden items-center justify-center md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
            <ArrowLeftRight className="h-4 w-4 text-neutral-400" />
          </span>
        </div>
        <ExchangeColumn
          label="You receive"
          itemIds={trade.theirItemIds}
          cash={trade.theirCash}
          productsById={productsById}
        />
      </div>

      {(trade.yourCash || trade.theirCash) && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span aria-hidden>💵</span>
          Settle cash in person — bring it to the meetup. BARTER never holds money for trades.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* Meetup flow */}
      <div className="mt-6">
        {trade.status === "completed" ? (
          <CompletedCard spot={meetupSpot} completedAt={trade.completedAt} />
        ) : trade.status === "declined" || trade.status === "canceled" ? (
          <TerminalCard status={trade.status} />
        ) : trade.status === "pending" ? (
          <PendingCard />
        ) : trade.status === "scheduled" && meetup ? (
          <ScheduledCard
            spot={meetupSpot!}
            scheduledFor={meetup.scheduledFor}
            viewerConfirmed={Boolean(viewerConfirmedAt)}
            counterpartConfirmed={Boolean(counterpartConfirmedAt)}
            counterpartName={counterpartName}
            busy={busy}
            onConfirm={confirmExchange}
            onCancel={() => respond("cancel")}
          />
        ) : !viewerLocation.hasLocation ? (
          <SetLocationPrompt who="you" />
        ) : !counterpartLocation.hasLocation ? (
          <SetLocationPrompt who="counterpart" counterpartName={counterpartName} />
        ) : meetup && meetup.status === "proposed" && !choosing ? (
          <ProposedCard
            spot={meetupSpot!}
            scheduledFor={meetup.scheduledFor}
            proposedByViewer={proposedByViewer}
            counterpartName={counterpartName}
            busy={busy}
            onAgree={() => respond("agree")}
            onCancel={() => respond("cancel")}
            onChange={() => setChoosing(true)}
          />
        ) : (
          <MeetupChooser
            suggestions={suggestions}
            mapboxConfigured={mapboxConfigured}
            midpointHint={`a fair midpoint between you and ${counterpartName}`}
            busy={busy}
            canCancel={Boolean(meetup && meetup.status === "proposed")}
            onCancel={() => setChoosing(false)}
            onPropose={async (spot, scheduledFor) => {
              const ok = await proposeSpot(spot, scheduledFor);
              if (ok) setChoosing(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TradeDetailData["trade"]["status"] }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-indigo-100 text-indigo-800",
    completed: "bg-emerald-100 text-emerald-800",
    declined: "bg-rose-100 text-rose-800",
    canceled: "bg-rose-100 text-rose-800",
    pending: "bg-neutral-100 text-neutral-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize",
        styles[status] ?? "bg-neutral-100 text-neutral-600",
      )}
    >
      {status === "scheduled" ? <MapPin className="h-3 w-3" /> : null}
      {status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : null}
      {status}
    </span>
  );
}

function ExchangeColumn({
  label,
  itemIds,
  cash,
  productsById,
}: {
  label: string;
  itemIds: number[];
  cash?: number;
  productsById: Record<number, Product>;
}) {
  const items = itemIds.map((id) => productsById[id]).filter(Boolean) as Product[];
  return (
    <div className="rounded-2xl border border-black/8 bg-neutral-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{label}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images[0] ?? ""}
              alt={item.title}
              className="h-10 w-10 shrink-0 rounded-lg border border-black/10 bg-neutral-200 object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-black">{item.title}</span>
              <span className="block text-xs text-neutral-500">{formatMoney(item.price)}</span>
            </span>
          </li>
        ))}
        {items.length === 0 && cash ? null : items.length === 0 ? (
          <li className="text-sm text-neutral-400">—</li>
        ) : null}
      </ul>
      {cash ? <p className="mt-3 text-sm font-semibold text-black">+ {formatMoney(cash)} cash</p> : null}
    </div>
  );
}

function SpotPreview({ spot }: { spot: SelectedSpot }) {
  const mapUrl = buildStaticMapUrl(spot.latitude, spot.longitude, { width: 640, height: 220 });
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      {mapUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mapUrl} alt={`Map showing ${spot.placeName}`} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center bg-neutral-100 text-neutral-400">
          <MapPin className="h-6 w-6" />
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
        <div>
          <p className="font-semibold text-black">{spot.placeName}</p>
          {spot.address ? <p className="text-sm text-neutral-500">{spot.address}</p> : null}
          {spot.placeSource === "curated_safe_zone" ? (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified safe-exchange zone
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SetLocationPrompt({
  who,
  counterpartName,
}: {
  who: "you" | "counterpart";
  counterpartName?: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-black/15 bg-white p-6 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        <MapPin className="h-6 w-6 text-neutral-500" />
      </span>
      {who === "you" ? (
        <>
          <p className="mt-3 font-semibold text-black">Set your trade area to find a meetup spot</p>
          <p className="mt-1 text-sm text-neutral-500">
            We use an approximate location to suggest a fair, neutral spot halfway between you both.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <MapPin className="h-4 w-4" />
            Set your area
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 font-semibold text-black">Waiting on {counterpartName}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {counterpartName} needs to set their trade area before we can suggest a meetup spot.
          </p>
        </>
      )}
    </div>
  );
}

function ProposedCard({
  spot,
  scheduledFor,
  proposedByViewer,
  counterpartName,
  busy,
  onAgree,
  onCancel,
  onChange,
}: {
  spot: SelectedSpot;
  scheduledFor?: string;
  proposedByViewer: boolean;
  counterpartName: string;
  busy: boolean;
  onAgree: () => void;
  onCancel: () => void;
  onChange: () => void;
}) {
  const when = formatScheduledFor(scheduledFor);
  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
          <Clock3Dot />
          {proposedByViewer ? "Waiting for them to agree" : `${counterpartName} proposed a spot`}
        </span>
      </div>
      <SpotPreview spot={spot} />
      {when ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
          <CalendarClock className="h-4 w-4 text-neutral-400" />
          {when}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {proposedByViewer ? (
          <>
            <button
              type="button"
              onClick={onChange}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-50"
            >
              Change spot
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-500 transition hover:text-black disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onAgree}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Agree to meet here
            </button>
            <button
              type="button"
              onClick={onChange}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-50"
            >
              Suggest another
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ScheduledCard({
  spot,
  scheduledFor,
  viewerConfirmed,
  counterpartConfirmed,
  counterpartName,
  busy,
  onConfirm,
  onCancel,
}: {
  spot: SelectedSpot;
  scheduledFor?: string;
  viewerConfirmed: boolean;
  counterpartConfirmed: boolean;
  counterpartName: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const when = formatScheduledFor(scheduledFor);
  return (
    <div className="rounded-[20px] border border-indigo-200 bg-white p-5">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
        <MapPin className="h-3.5 w-3.5" />
        Meetup scheduled
      </p>
      <SpotPreview spot={spot} />
      {when ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-800">
          <CalendarClock className="h-4 w-4 text-neutral-400" />
          {when}
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-black/8 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-black">Check off when you have the item in hand</p>
        <p className="mt-1 text-sm text-neutral-500">
          Both members confirm at the meetup. Once you both check off, the trade completes.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ConfirmRow label="You" confirmed={viewerConfirmed} />
          <ConfirmRow label={counterpartName} confirmed={counterpartConfirmed} />
        </div>

        {viewerConfirmed ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            You confirmed{counterpartConfirmed ? "" : ` — waiting for ${counterpartName}`}
          </p>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            I have the item — confirm exchange
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="mt-4 text-sm font-medium text-neutral-400 transition hover:text-black disabled:opacity-50"
      >
        Need to change the plan? Cancel this meetup
      </button>
    </div>
  );
}

function ConfirmRow({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
        confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-black/10 bg-white text-neutral-500",
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          confirmed ? "bg-emerald-500 text-white" : "bg-neutral-200 text-neutral-400",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

function CompletedCard({ spot, completedAt }: { spot: SelectedSpot | null; completedAt?: string }) {
  const when = formatScheduledFor(completedAt);
  return (
    <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-6 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <p className="mt-3 text-lg font-semibold text-emerald-900">Trade complete</p>
      <p className="mt-1 text-sm text-emerald-700">
        Both members confirmed the exchange{spot ? ` at ${spot.placeName}` : ""}
        {when ? ` · ${when}` : ""}.
      </p>
    </div>
  );
}

function TerminalCard({ status }: { status: "declined" | "canceled" }) {
  return (
    <div className="rounded-[20px] border border-black/10 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
      This trade was {status}.
    </div>
  );
}

function PendingCard() {
  return (
    <div className="rounded-[20px] border border-black/10 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
      A meetup can be arranged once this trade is accepted. Hang tight until both
      sides agree to the swap.
    </div>
  );
}

type GeocodeResult = {
  id: string;
  label: string;
  shortLabel: string;
  latitude: number;
  longitude: number;
};

function MeetupChooser({
  suggestions,
  mapboxConfigured,
  midpointHint,
  busy,
  canCancel,
  onCancel,
  onPropose,
}: {
  suggestions: PlaceSuggestion[];
  mapboxConfigured: boolean;
  midpointHint: string;
  busy: boolean;
  canCancel: boolean;
  onCancel: () => void;
  onPropose: (spot: SelectedSpot, scheduledFor?: string) => void;
}) {
  const [selected, setSelected] = useState<SelectedSpot | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function selectSuggestion(suggestion: PlaceSuggestion) {
    setSelected({
      placeName: suggestion.name,
      address: suggestion.address,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      placeSource: suggestion.isSafeZone ? "curated_safe_zone" : "auto_suggested",
      mapboxPlaceId: suggestion.isSafeZone ? undefined : suggestion.id,
    });
  }

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setSearchResults([]);
    setSearchError(null);
    try {
      const response = await fetch(`/api/geo/places?q=${encodeURIComponent(trimmed)}`);
      const payload = (await response.json().catch(() => null)) as
        | { results?: GeocodeResult[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Place search is unavailable right now.");
      }
      const results = payload?.results ?? [];
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No places matched that search. Try a different name.");
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Place search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }

  function isSelected(suggestion: PlaceSuggestion) {
    return (
      selected?.latitude === suggestion.latitude && selected?.longitude === suggestion.longitude
    );
  }

  return (
    <div className="rounded-[20px] border border-black/10 bg-white p-5">
      <h2 className="text-lg font-semibold text-black">Pick a neutral meetup spot</h2>
      <p className="mt-1 text-sm text-neutral-500">
        These are near {midpointHint}. Safe-exchange zones are highlighted.
      </p>

      <ul className="mt-4 space-y-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <button
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition",
                isSelected(suggestion)
                  ? "border-black bg-neutral-50"
                  : "border-black/10 hover:border-black/30",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  suggestion.isSafeZone ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500",
                )}
              >
                {suggestion.isSafeZone ? <ShieldCheck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-black">{suggestion.name}</span>
                {suggestion.address ? (
                  <span className="block truncate text-xs text-neutral-500">{suggestion.address}</span>
                ) : null}
                {suggestion.isSafeZone ? (
                  <span className="text-xs font-medium text-emerald-700">Safe-exchange zone</span>
                ) : null}
              </span>
              {typeof suggestion.distanceFromMidpointKm === "number" ? (
                <span className="shrink-0 text-xs text-neutral-400">
                  {suggestion.distanceFromMidpointKm.toFixed(1)} km
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {suggestions.length === 0 ? (
          <li className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
            No automatic suggestions yet — search for a spot below.
          </li>
        ) : null}
      </ul>

      {mapboxConfigured ? (
        <form onSubmit={runSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search another place (cafe, park, address…)"
            className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-sm outline-none transition focus:border-black"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {searching ? "…" : "Search"}
          </button>
        </form>
      ) : null}

      {searchResults.length > 0 ? (
        <ul className="mt-2 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10">
          {searchResults.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() =>
                  setSelected({
                    placeName: result.shortLabel || result.label,
                    address: result.label,
                    latitude: result.latitude,
                    longitude: result.longitude,
                    placeSource: "manual",
                    mapboxPlaceId: result.id,
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-neutral-50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="text-neutral-800">{result.label || result.shortLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searchError ? (
        <p className="mt-2 text-xs text-neutral-500">{searchError}</p>
      ) : null}

      {selected ? (
        <div className="mt-5 border-t border-black/8 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Selected spot</p>
          <div className="mt-2">
            <SpotPreview spot={selected} />
          </div>
          <label className="mt-4 block text-sm font-medium text-neutral-700">
            When? <span className="font-normal text-neutral-400">(optional)</span>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none transition focus:border-black"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || !selected}
          onClick={() =>
            selected &&
            onPropose(selected, scheduledFor ? new Date(scheduledFor).toISOString() : undefined)
          }
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          <MapPin className="h-4 w-4" />
          Propose this spot
        </button>
        {canCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full px-4 py-3 text-sm font-semibold text-neutral-500 transition hover:text-black disabled:opacity-50"
          >
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Small inline dot icon to avoid an extra lucide import.
function Clock3Dot() {
  return <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" aria-hidden />;
}
