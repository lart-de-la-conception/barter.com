import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialsFromName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function ensureProfileForAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const email = user.email.toLowerCase();

  // Authoritative lookup: a profile is "mine" only if it is bound to my auth id.
  // (Separate `.eq()` queries rather than interpolating into `.or()`, which would
  // be vulnerable to PostgREST filter injection via a crafted email local-part.)
  const ownResponse = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ownResponse.error) {
    throw ownResponse.error;
  }

  if (ownResponse.data) {
    return ownResponse.data;
  }

  // No profile bound to this auth user yet. Adopt an UNCLAIMED profile with this
  // email (e.g. a seeded/imported member onboarding for the first time) — but
  // never one already bound to a different auth user, which would be an account
  // takeover. The `.is("auth_user_id", null)` guard on the update also makes the
  // claim atomic against a concurrent claim.
  const claimableResponse = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .is("auth_user_id", null)
    .limit(1)
    .maybeSingle();

  if (claimableResponse.error) {
    throw claimableResponse.error;
  }

  if (claimableResponse.data) {
    const { data: linked, error } = await supabase
      .from("profiles")
      .update({ auth_user_id: user.id })
      .eq("id", claimableResponse.data.id)
      .is("auth_user_id", null)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (linked) {
      return linked;
    }
  }

  const localPart = email.split("@")[0] ?? "member";
  const slugBase = slugify(localPart) || `member-${user.id.slice(0, 8)}`;
  const name = user.user_metadata.full_name || user.user_metadata.name || localPart;
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      email,
      slug: `${slugBase}-${user.id.slice(0, 8)}`,
      name,
      handle: `@${slugBase}`,
      initials: initialsFromName(String(name || localPart)),
      location: "Members Only",
      member_since: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      rating: 5,
      reviews: 0,
      completed_trades: 0,
      response_rate: "New",
      bio: "New member profile.",
      avatar_seed: slugBase,
      is_online: true,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
