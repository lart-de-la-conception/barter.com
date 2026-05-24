"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function GlobalSearchStrip({
  defaultQuery = "",
  placeholder = "SEARCH BARTER",
}: {
  defaultQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    router.push(nextQuery ? `/products?q=${encodeURIComponent(nextQuery)}` : "/products");
  }

  return (
    <div className="fixed left-4 top-4 z-40 hidden sm:block">
      <form onSubmit={onSubmit}>
        <label className="flex cursor-text items-center gap-3 rounded-md bg-[#1a1212]/70 px-5 py-3 shadow-lg backdrop-blur-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-white/70"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="w-44 border-none bg-transparent text-sm font-semibold tracking-widest text-white placeholder:text-white/60 focus:outline-none"
            aria-label="Search products"
          />
        </label>
      </form>
    </div>
  );
}
