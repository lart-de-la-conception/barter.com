"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export const createClient = () => getSupabaseBrowserClient();
