import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add the required environment variables first.");
  }

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookies can be read-only in some server render paths.
        }
      },
    },
  });
}
