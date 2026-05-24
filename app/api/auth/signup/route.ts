import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleKey, isSupabaseConfigured } from "@/lib/supabase/config";

function readMembershipCode() {
  const raw = process.env.MEMBERSHIP_SIGNUP_CODE;
  if (!raw) return null;

  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeCode(value: string) {
  return value.trim().toLowerCase();
}

type SignupBody = {
  email?: string;
  password?: string;
  membershipCode?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Signup is disabled until it is set." },
      { status: 503 },
    );
  }

  const expectedCode = readMembershipCode();
  if (!expectedCode) {
    return NextResponse.json(
      {
        error:
          "Signup is closed. Set MEMBERSHIP_SIGNUP_CODE on the server to issue access to new members.",
      },
      { status: 503 },
    );
  }

  let payload: SignupBody;
  try {
    payload = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const submittedCode = typeof payload.membershipCode === "string" ? payload.membershipCode : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (!submittedCode) {
    return NextResponse.json({ error: "A membership code is required to create an account." }, { status: 400 });
  }

  if (normalizeCode(submittedCode) !== normalizeCode(expectedCode)) {
    return NextResponse.json({ error: "That membership code is not valid." }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
