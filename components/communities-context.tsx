"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CommunitiesContextValue = {
  joinedSlugs: string[];
  isJoined: (slug: string) => boolean;
  join: (slug: string) => void;
  leave: (slug: string) => void;
};

const CommunitiesContext = createContext<CommunitiesContextValue | null>(null);

const STORAGE_KEY = "barter.joinedCommunities";

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStored(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {}
}

export function CommunitiesProvider({ children }: { children: ReactNode }) {
  const [joinedSlugs, setJoinedSlugs] = useState<string[]>([]);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const id = window.setTimeout(() => {
      setJoinedSlugs(readStored());
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const value = useMemo<CommunitiesContextValue>(
    () => ({
      joinedSlugs,
      isJoined: (slug) => joinedSlugs.includes(slug),
      join: (slug) => {
        setJoinedSlugs((prev) => {
          if (prev.includes(slug)) return prev;
          const next = [...prev, slug];
          writeStored(next);
          return next;
        });
      },
      leave: (slug) => {
        setJoinedSlugs((prev) => {
          const next = prev.filter((s) => s !== slug);
          writeStored(next);
          return next;
        });
      },
    }),
    [joinedSlugs],
  );

  return (
    <CommunitiesContext.Provider value={value}>
      {children}
    </CommunitiesContext.Provider>
  );
}

export function useCommunities() {
  const ctx = useContext(CommunitiesContext);
  if (!ctx) throw new Error("useCommunities must be used within CommunitiesProvider");
  return ctx;
}
