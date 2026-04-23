"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Viewer } from "@/lib/marketplace-types";
import { favoriteProductIds } from "@/lib/market-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isDevelopmentAuthBypassEnabled, isSupabaseConfigured } from "@/lib/supabase/config";

type FavoritesContextValue = {
  favoriteIds: number[];
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const storageKey = "barter.favoriteProductIds";

function readLocalFavorites() {
  if (typeof window === "undefined") {
    return favoriteProductIds;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return favoriteProductIds;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => typeof value === "number")
      : favoriteProductIds;
  } catch {
    window.localStorage.removeItem(storageKey);
    return favoriteProductIds;
  }
}

export function FavoritesProvider({
  children,
  viewer,
  initialFavoriteIds,
}: {
  children: ReactNode;
  viewer: Viewer | null;
  initialFavoriteIds: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const useLocalFavorites = !isSupabaseConfigured() || isDevelopmentAuthBypassEnabled();
  const useServerFavorites = isSupabaseConfigured() && !isDevelopmentAuthBypassEnabled() && Boolean(viewer);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    useServerFavorites ? initialFavoriteIds : useLocalFavorites ? readLocalFavorites() : [],
  );

  useEffect(() => {
    if (useLocalFavorites) {
      window.localStorage.setItem(storageKey, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, useLocalFavorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (productId) => favoriteIds.includes(productId),
      toggleFavorite: async (productId) => {
        if (!viewer) {
          if (useLocalFavorites) {
            setFavoriteIds((current) =>
              current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId],
            );
            return;
          }

          router.push(`/login?next=${encodeURIComponent(pathname || "/favorites")}`);
          return;
        }

        const nextIds = favoriteIds.includes(productId)
          ? favoriteIds.filter((id) => id !== productId)
          : [...favoriteIds, productId];
        setFavoriteIds(nextIds);

        if (!useServerFavorites) {
          return;
        }

        try {
          const supabase = getSupabaseBrowserClient();
          if (favoriteIds.includes(productId)) {
            const { error } = await supabase
              .from("favorites")
              .delete()
              .eq("profile_id", viewer?.profileId ?? "")
              .eq("product_id", productId);

            if (error) {
              throw error;
            }
          } else {
            const { error } = await supabase.from("favorites").insert({
              profile_id: viewer?.profileId ?? "",
              product_id: productId,
            });

            if (error) {
              throw error;
            }
          }

          router.refresh();
        } catch {
          setFavoriteIds(favoriteIds);
        }
      },
    }),
    [favoriteIds, pathname, router, useLocalFavorites, useServerFavorites, viewer],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }

  return context;
}
