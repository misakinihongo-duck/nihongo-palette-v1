import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { DiscoveryListing } from "@/lib/learner-discovery";

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

export type OnboardingStatus = {
  hasLearnerPreferences: boolean;
  hasProviderProfile: boolean;
  providerProfileId: string | null;
};

export type ProviderListing = {
  capacity: number;
  duration_minutes: number;
  id: string;
  listing_schedules: Array<{
    capacity: number;
    end_at: string;
    id: string;
    start_at: string;
  }>;
  price: number;
  status: "draft" | "published" | "unpublished";
  title: string;
  type: "lesson" | "experience" | "local_guide";
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

  if (!data && !error) {
    const { error: upsertError } = await upsertUserProfile(supabase, user);

    if (upsertError) {
      return { user, profile: null, error: upsertError.message };
    }

    const { data: createdProfile, error: createdProfileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<AppUserProfile>();

    return {
      user,
      profile: createdProfile ?? null,
      error: createdProfileError?.message ?? null,
    };
  }

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

export async function fetchOnboardingStatus(supabase: SupabaseClient, userId: string) {
  const [learnerResult, providerResult] = await Promise.all([
    supabase.from("learner_preferences").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("provider_profiles").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    hasLearnerPreferences: Boolean(learnerResult.data),
    hasProviderProfile: Boolean(providerResult.data),
    providerProfileId: providerResult.data?.id ?? null,
  } satisfies OnboardingStatus;
}

export async function fetchProviderListings(supabase: SupabaseClient, providerProfileId: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, type, status, price, duration_minutes, capacity, updated_at, listing_schedules(id, start_at, end_at, capacity)")
    .eq("provider_profile_id", providerProfileId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return { data: (data ?? []) as ProviderListing[], error: error?.message ?? null };
}

export async function fetchPublishedListings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("listings")
    .select("id, type, title, description, category, themes, price, duration_minutes, format, location, capacity, provider_profiles(display_name, profile_photo, roles, bio, languages, activity_area), listing_images(image_url, sort_order), listing_schedules(id, start_at, end_at, capacity)")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const listings = (data ?? []).map((listing) => ({
    ...listing,
    provider_profiles: Array.isArray(listing.provider_profiles)
      ? listing.provider_profiles[0] ?? null
      : listing.provider_profiles,
  })) as DiscoveryListing[];

  return { data: listings, error: error?.message ?? null };
}
