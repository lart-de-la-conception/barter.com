import type { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export const createClient = (_cookieStore: Awaited<ReturnType<typeof cookies>>) =>
  createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return _cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => _cookieStore.set(name, value, options));
        } catch {
          // Server Components can expose a read-only cookie store.
        }
      },
    },
  });
