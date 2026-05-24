"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { brandNavLogos } from "@/lib/brand-logos";
import type { Viewer } from "@/lib/marketplace-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isDevelopmentAuthBypassEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const navOpenDuration = 900;
const navCloseDuration = 600;

export function SiteNavbar({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [query, setQuery] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setMenuMounted(true);
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setMenuMounted(false);
      closeTimerRef.current = null;
    }, navCloseDuration);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const primaryLinks = [
    { href: "/products", label: "SHOP" },
    { href: "/closet", label: "MY CLOSET" },
    { href: "/trades", label: "TRADES" },
    { href: "/messages", label: "MESSAGES" },
    { href: "/brands", label: "BRANDS" },
    { href: "/archive", label: "ARCHIVE" },
    { href: "/communities", label: "COMMUNITIES" },
    { href: "/rewards", label: "REWARDS" },
  ];

  const accountLinks = [
    viewer
      ? { href: `/user/${viewer.slug}`, label: "ACCOUNT", showDot: true }
      : { href: `/login?next=${encodeURIComponent(pathname || "/")}`, label: "LOGIN", showDot: true },
    { href: "/favorites", label: "FAVORITES" },
    ...(viewer?.isAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
  ];

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    router.push(nextQuery ? `/products?q=${encodeURIComponent(nextQuery)}` : "/products");
    closeMenu();
  }

  async function handleSignOut() {
    if (isSupabaseConfigured() && !isDevelopmentAuthBypassEnabled()) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    closeMenu();
    router.push("/");
    router.refresh();
  }

  return (
    <div
      ref={navRef}
      className="brand-logo-font fixed left-1/2 top-4 z-40 w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-md bg-[#1a1212]/70 text-white shadow-xl backdrop-blur-md"
    >
      <header className="relative z-10 flex items-center justify-between px-5 py-3">
        <Link href="/" className="brand-logo-font text-base text-white hover:opacity-80">
          BARTER
        </Link>
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => {
            if (menuOpen) {
              closeMenu();
              return;
            }

            openMenu();
          }}
          className="flex h-6 w-8 flex-col items-center justify-center gap-1.5"
        >
          <span
            style={{ transitionDuration: `${menuOpen ? navOpenDuration : navCloseDuration}ms` }}
            className={cn(
              "h-px w-6 bg-white transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]",
              menuOpen ? "translate-y-[3px] rotate-45" : "",
            )}
          />
          <span
            style={{ transitionDuration: `${menuOpen ? navOpenDuration : navCloseDuration}ms` }}
            className={cn(
              "h-px w-6 bg-white transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]",
              menuOpen ? "-translate-y-[3px] -rotate-45" : "",
            )}
          />
        </button>
        <Link href="/products" className="text-base font-bold tracking-tight text-white hover:opacity-80">
          SHOP
        </Link>
      </header>

      <div
        aria-hidden={!menuOpen}
        style={{
          transition: menuOpen
            ? `grid-template-rows ${navOpenDuration}ms cubic-bezier(0.22,1,0.36,1), opacity ${navOpenDuration}ms ease-out`
            : `grid-template-rows ${navCloseDuration}ms cubic-bezier(0.4,0,1,1), opacity ${Math.round(navCloseDuration * 0.55)}ms ease-in`,
        }}
        className={cn(
          "grid overflow-hidden",
          menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        {menuMounted ? (
          <div className="min-h-0 overflow-hidden px-5 pb-6 pt-5">
          <form onSubmit={handleSearchSubmit}>
            <label className="flex items-center gap-3 border-b border-white/40 pb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="SEARCH BARTER"
                className="w-full bg-transparent text-sm font-semibold tracking-widest text-white placeholder:text-white/60 focus:outline-none"
              />
            </label>
          </form>

          <nav className="mt-10 grid grid-cols-3 gap-x-6 text-sm font-bold tracking-tight">
            {/* Col 1 — first half of primary links */}
            <ul className="space-y-1.5">
              {primaryLinks.slice(0, 4).map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={cn("hover:opacity-80", active ? "underline underline-offset-4" : "")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Col 2 — second half of primary links */}
            <ul className="space-y-1.5">
              {primaryLinks.slice(4).map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={cn("hover:opacity-80", active ? "underline underline-offset-4" : "")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Col 3 — account links */}
            <ul className="space-y-1.5">
              {accountLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href} className={cn(item.showDot ? "flex items-center gap-2" : "")}>
                    {item.showDot ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={cn("hover:opacity-80", active ? "underline underline-offset-4" : "")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {viewer ? (
                <li>
                  <button type="button" onClick={() => void handleSignOut()} className="font-bold hover:opacity-80">
                    SIGN OUT
                  </button>
                </li>
              ) : null}
            </ul>
          </nav>

          {/* Brands grid */}
          <div className="mt-10">
            <div className="grid grid-cols-4 gap-x-4 gap-y-5">
              {brandNavLogos.map((brand) => (
                <Link
                  key={brand.href}
                  href={brand.href}
                  onClick={closeMenu}
                  className="flex items-center justify-center opacity-60 transition hover:opacity-100"
                  aria-label={brand.name}
                >
                  <Image
                    src={brand.src}
                    alt={brand.name}
                    width={brand.width}
                    height={brand.height}
                    className="h-7 w-auto max-w-[88px] object-contain [filter:invert(1)_brightness(1.1)]"
                    sizes="88px"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-start">
              <h1 className="brand-logo-font text-6xl leading-none tracking-tighter sm:text-7xl">
                BARTER
              </h1>
              <span className="ml-1 mt-1 text-[10px] font-bold">TM</span>
            </div>
            <div className="mt-3 grid grid-cols-3 items-center text-[10px] font-semibold tracking-widest text-white/80">
              <span>NOUN</span>
              <span className="text-center italic">/bar-ter/</span>
              <span className="text-right">MEMBER MARKETPLACE</span>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  );
}
