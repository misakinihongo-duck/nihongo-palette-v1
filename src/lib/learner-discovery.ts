export type DiscoveryListing = {
  capacity: number;
  category: string | null;
  description: string;
  duration_minutes: number;
  format: "online" | "offline";
  id: string;
  listing_images: Array<{ image_url: string; sort_order: number }>;
  listing_schedules: Array<{
    capacity: number;
    end_at: string;
    id: string;
    start_at: string;
  }>;
  location: string | null;
  price: number;
  provider_profiles: {
    activity_area: string | null;
    bio: string;
    display_name: string;
    languages: string[];
    profile_photo: string | null;
    roles: string[];
  } | null;
  themes: string[];
  title: string;
  type: "lesson" | "experience" | "local_guide";
};

export const learnPurposes = ["日常会話", "仕事・ビジネス", "テスト・資格", "旅・おでかけ", "文化・体験"];
export const experienceThemes = ["食", "文化", "街歩き", "交流", "趣味・アクティビティ"];

export function filterDiscoveryListings(
  listings: DiscoveryListing[],
  view: "learn" | "experience",
  filter: string | null,
) {
  return listings.filter((listing) => {
    if (view === "learn") {
      return listing.type === "lesson" && (!filter || listing.category === filter);
    }

    return (
      (listing.type === "experience" || listing.type === "local_guide") &&
      (!filter || listing.category === filter || listing.themes.includes(filter))
    );
  });
}

export function upcomingSchedules(listing: DiscoveryListing, now = new Date()) {
  return listing.listing_schedules
    .filter((schedule) => new Date(schedule.start_at) > now)
    .sort((first, second) => first.start_at.localeCompare(second.start_at));
}
