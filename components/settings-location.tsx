"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LocateFixed, MapPin, Search } from "lucide-react";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type GeocodeResult = {
  id: string;
  label: string;
  shortLabel: string;
  latitude: number;
  longitude: number;
};

type Status = "idle" | "searching" | "locating" | "saving";

export function SettingsLocation({
  initialLabel,
  hasLocation,
  mapboxConfigured,
}: {
  initialLabel: string | null;
  hasLocation: boolean;
  mapboxConfigured: boolean;
}) {
  const router = useRouter();
  const [savedLabel, setSavedLabel] = useState<string | null>(initialLabel);
  const [isSaved, setIsSaved] = useState(hasLocation);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = status !== "idle";

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setError(null);
    setStatus("searching");
    setResults([]);
    try {
      const response = await fetch(`/api/geo/places?q=${encodeURIComponent(trimmed)}`);
      const payload = (await response.json().catch(() => null)) as
        | { results?: GeocodeResult[]; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? "Search failed.");
      setResults(payload?.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function saveLocation(latitude: number, longitude: number, label?: string) {
    setError(null);
    setStatus("saving");
    try {
      const response = await fetch("/api/me/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, label }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { location?: { label?: string }; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not save your location.");
      setSavedLabel(payload?.location?.label ?? label ?? "Saved location");
      setIsSaved(true);
      setResults([]);
      setQuery("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your location.");
    } finally {
      setStatus("idle");
    }
  }

  function useCurrentLocation() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation isn't available in this browser. Search for your area instead.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void saveLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError("We couldn't read your location. Search for your area instead.");
        setStatus("idle");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  return (
    <section className="rounded-[20px] border border-black/10 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
          <MapPin className="h-5 w-5 text-neutral-700" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-black">Your trade area</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">
            We use an approximate location — never your exact address — to suggest a fair, neutral
            meetup spot halfway between you and the other member.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex items-center gap-3 rounded-2xl border p-4",
          isSaved ? "border-emerald-200 bg-emerald-50" : "border-black/10 bg-neutral-50",
        )}
      >
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-full",
            isSaved ? "bg-emerald-500 text-white" : "bg-neutral-200 text-neutral-500",
          )}
        >
          {isSaved ? <Check className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Current area
          </p>
          <p className="truncate text-sm font-medium text-black">
            {isSaved ? savedLabel || "Saved location" : "Not set yet"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" />
          {status === "locating" ? "Locating…" : "Use my current location"}
        </button>

        {mapboxConfigured ? (
          <>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-neutral-400">
              <span className="h-px flex-1 bg-black/10" />
              or search
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <form onSubmit={runSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Neighborhood, city, or postal code"
                className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-sm outline-none transition focus:border-black"
              />
              <button
                type="submit"
                disabled={busy || !query.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-black hover:text-black disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {status === "searching" ? "…" : "Search"}
              </button>
            </form>

            {results.length > 0 && (
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => saveLocation(result.latitude, result.longitude, result.shortLabel)}
                      disabled={busy}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-neutral-50 disabled:opacity-50"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span className="text-neutral-800">{result.label || result.shortLabel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="rounded-2xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            Address search is unavailable right now, but “Use my current location” still works.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
