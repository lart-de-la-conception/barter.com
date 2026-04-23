import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServiceRoleKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof (payload as { email?: unknown }).email === "string" ? (payload as { email: string }).email.trim().toLowerCase() : "";
  const password = typeof (payload as { password?: unknown }).password === "string" ? (payload as { password: string }).password : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
  }

  return NextResponse.json({ ok: true });
}
