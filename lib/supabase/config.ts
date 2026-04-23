function normalizeEnvValue(value: string | undefined) {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabasePublishableKey =
  normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
  normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseServiceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
const devAuthBypass = normalizeEnvValue(process.env.DEV_AUTH_BYPASS);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(supabaseServiceRoleKey);
}

export function isDevelopmentAuthBypassEnabled() {
  return process.env.NODE_ENV !== "production" && devAuthBypass === "true";
}

export function getSupabaseUrl() {
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  return supabaseUrl;
}

export function getSupabasePublishableKey() {
  if (!supabasePublishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return supabasePublishableKey;
}

export function getSupabaseAnonKey() {
  return getSupabasePublishableKey();
}

export function getSupabaseServiceRoleKey() {
  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return supabaseServiceRoleKey;
}
