"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Heart, LogOut, MessageSquare, Search, UserRound } from "lucide-react";
import type { Viewer } from "@/lib/marketplace-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isDevelopmentAuthBypassEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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

export function SiteNavbar({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const navItems = [
    { href: "/products", label: "Shop" },
    { href: "/closet", label: "My Closet" },
    { href: "/trades", label: "Trades" },
  ];

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    router.push(nextQuery ? `/products?q=${encodeURIComponent(nextQuery)}` : "/products");
  }

  async function handleSignOut() {
    if (isSupabaseConfigured() && !isDevelopmentAuthBypassEnabled()) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="px-5 py-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-8">
              <Link href="/" className="text-2xl font-semibold tracking-[0.28em] text-black">
                BARTER
              </Link>
              <form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-md md:block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Chrome Hearts, Supreme, Margiela..."
                  className="w-full rounded-full border border-black/10 bg-neutral-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-black"
                />
              </form>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        active ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-black",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <Link href="/messages" className="rounded-full border border-black/10 p-2 transition hover:bg-black hover:text-white">
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link
                href="/favorites"
                className="rounded-full border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:text-red-600"
              >
                <Heart className="h-4 w-4 fill-current" />
              </Link>
              {viewer ? (
                <div className="relative" ref={ref}>
                  <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="flex items-center gap-2 rounded-full border border-black/10 bg-white p-1 pr-3"
                  >
                    <div
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
                        avatarClass(viewer.avatarSeed),
                      )}
                    >
                      {viewer.initials}
                    </div>
                    <span className="text-sm font-medium text-black">{viewer.handle}</span>
                  </button>
                  {open ? (
                    <div className="absolute right-0 top-12 w-64 rounded-3xl border border-black/10 bg-white p-2 shadow-xl">
                      <Link href="/closet" className="block rounded-2xl px-4 py-3 text-sm text-black transition hover:bg-neutral-100">
                        Closet
                      </Link>
                      <Link href="/trades" className="block rounded-2xl px-4 py-3 text-sm text-black transition hover:bg-neutral-100">
                        Trade History
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm text-black transition hover:bg-neutral-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(pathname || "/")}`} className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white">
                  <UserRound className="h-4 w-4" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
