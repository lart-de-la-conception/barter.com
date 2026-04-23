"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add the required environment variables first.");
  }

  browserClient ??= createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
  return browserClient;
}
