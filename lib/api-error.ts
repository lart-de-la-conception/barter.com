import { NextResponse } from "next/server";

/**
 * Log a server-side error and return a generic JSON response. Raw Supabase /
 * Postgres error messages leak schema, constraint, and RLS-policy details, so
 * they must never be sent to the client — log them for debugging instead.
 */
export function serverErrorResponse(
  context: string,
  error: unknown,
  message = "Something went wrong. Please try again.",
  status = 500,
) {
  console.error(`[${context}]`, error);
  return NextResponse.json({ error: message }, { status });
}
