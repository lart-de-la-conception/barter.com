/**
 * Returns the value only if it is an absolute http(s) URL, otherwise null.
 * Used to sanitize client-supplied image URLs before they are stored and later
 * rendered, blocking `javascript:`/`data:` and other non-http schemes.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}
