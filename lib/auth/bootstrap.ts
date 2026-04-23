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
  const existingResponse = await supabase
    .from("profiles")
    .select("*")
    .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
    .limit(1)
    .maybeSingle();

  if (existingResponse.error) {
    throw existingResponse.error;
  }

  if (existingResponse.data) {
    if (existingResponse.data.auth_user_id !== user.id) {
      const { error } = await supabase
        .from("profiles")
        .update({ auth_user_id: user.id })
        .eq("id", existingResponse.data.id);

      if (error) {
        throw error;
      }
    }

    return existingResponse.data;
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
