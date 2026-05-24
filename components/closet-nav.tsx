"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Viewer } from "@/lib/marketplace-types";
import { useCommunities } from "@/components/communities-context";

function avatarGradient(seed: string) {
  const palettes = [
    "from-neutral-950 to-neutral-700",
    "from-zinc-700 to-stone-500",
    "from-slate-700 to-zinc-500",
    "from-stone-800 to-neutral-600",
  ];
  const index = seed.split("").reduce((t, c) => t + c.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export function ClosetNav({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const { joinedSlugs } = useCommunities();
  const profileHref = viewer
    ? `/user/${viewer.slug}`
    : `/login?next=${encodeURIComponent(pathname || "/")}`;

  return (
    <div className="fixed right-4 top-4 z-40 hidden sm:block">
      <div className="flex items-center gap-px overflow-hidden rounded-full bg-[#1a1212]/70 shadow-lg backdrop-blur-md">
        {/* My Closet — wardrobe icon */}
        <Link
          href="/closet"
          aria-label="My closet"
          className="flex items-center justify-center px-3.5 py-3 text-white/50 transition-colors duration-200 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            {/* Outer cabinet */}
            <rect x="3" y="3" width="18" height="18" rx="1" />
            {/* Center divider — two doors */}
            <line x1="12" y1="3" x2="12" y2="21" />
            {/* Left door handle */}
            <circle cx="10" cy="12" r="0.75" fill="currentColor" stroke="none" />
            {/* Right door handle */}
            <circle cx="14" cy="12" r="0.75" fill="currentColor" stroke="none" />
            {/* Top rail / cornice line */}
            <line x1="3" y1="6" x2="21" y2="6" />
          </svg>
        </Link>

        {/* Divider */}
        <span className="h-4 w-px bg-white/15" />

        {/* Communities — users icon */}
        <Link
          href="/communities"
          aria-label="Communities"
          className="relative flex items-center justify-center px-3.5 py-3 text-white/50 transition-colors duration-200 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {joinedSlugs.length > 0 && (
            <span className="absolute right-2 top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black">
              {joinedSlugs.length}
            </span>
          )}
        </Link>

        {/* Divider */}
        <span className="h-4 w-px bg-white/15" />

        {/* Messages — chat bubble icon */}
        <Link
          href="/messages"
          aria-label="Messages"
          className="flex items-center justify-center px-3.5 py-3 text-white/50 transition-colors duration-200 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Link>

        {/* Divider */}
        <span className="h-4 w-px bg-white/15" />

        {/* Profile avatar */}
        <Link
          href={profileHref}
          aria-label={viewer ? "My profile" : "Sign in"}
          className="flex items-center justify-center px-3 py-3 opacity-80 transition-opacity duration-200 hover:opacity-100"
        >
          {viewer ? (
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white ${avatarGradient(viewer.avatarSeed)}`}
            >
              {viewer.initials}
            </span>
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[9px] font-bold text-white/60">
              ?
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
