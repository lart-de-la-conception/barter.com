import { NextResponse, type NextRequest } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const next = sanitizeRedirectPath(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }

    await ensureProfileForAuthenticatedUser();
  }

  return NextResponse.redirect(new URL(next, request.url));
}
