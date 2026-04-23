import { NextResponse } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth/bootstrap";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const profile = await ensureProfileForAuthenticatedUser();

    if (!profile) {
      return NextResponse.json({ error: "No authenticated user found." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finish account setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
