/**
 * Returns `next` only if it is a safe same-origin relative path, otherwise the
 * fallback. Prevents open-redirect phishing via `?next=https://evil.com` or the
 * protocol-relative `?next=//evil.com` form (both of which resolve to a foreign
 * origin when passed to `new URL(next, base)` or `router.push(next)`).
 */
export function sanitizeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  // Must be an absolute path on our own origin: a single leading slash, not a
  // scheme-relative "//host" or a backslash-obfuscated "/\host".
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
