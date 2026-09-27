import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppUserProfile = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  age: number | null;
  profile_photo: string | null;
  bio: string | null;
  japanese_level: string | null;
  last_active_mode: "learner" | "provider";
  created_at: string;
  updated_at: string;
};

export async function fetchCurrentUserProfile(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const isMissingSession = userError?.message === "Auth session missing!";

    return {
      user: null,
      profile: null,
      error: isMissingSession ? null : userError?.message ?? null,
    };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AppUserProfile>();

  return { user, profile: data ?? null, error: error?.message ?? null };
}

export async function upsertUserProfile(supabase: SupabaseClient, user: User) {
  const email = user.email ?? "";
  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email,
      name: metadataName || email.split("@")[0] || "Nihongo Palette User",
      profile_photo:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
      last_active_mode: "learner",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return { error };
}
