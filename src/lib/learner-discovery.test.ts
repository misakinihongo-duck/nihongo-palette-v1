import { describe, expect, it } from "vitest";
import { filterDiscoveryListings, upcomingSchedules, type DiscoveryListing } from "./learner-discovery";

const baseListing: DiscoveryListing = {
  capacity: 4,
  category: "文化",
  description: "説明",
  duration_minutes: 90,
  format: "offline",
  id: "listing-1",
  listing_images: [],
  listing_schedules: [],
  location: "東京",
  price: 3000,
  provider_profiles: null,
  themes: ["文化"],
  title: "文化をめぐる時間",
  type: "experience",
};

describe("learner discovery", () => {
  it("shows lessons only in the learn view and filters by purpose", () => {
    const lesson = { ...baseListing, category: "日常会話", id: "lesson", type: "lesson" as const };
    expect(filterDiscoveryListings([baseListing, lesson], "learn", "日常会話")).toEqual([lesson]);
  });

  it("includes local guides and experiences for a matching theme", () => {
    const guide = { ...baseListing, id: "guide", type: "local_guide" as const };
    expect(filterDiscoveryListings([baseListing, guide], "experience", "文化")).toHaveLength(2);
  });

  it("sorts and removes past schedules", () => {
    const listing = {
      ...baseListing,
      listing_schedules: [
        { id: "late", start_at: "2026-10-03T02:00:00.000Z", end_at: "2026-10-03T03:00:00.000Z", capacity: 3 },
        { id: "past", start_at: "2026-09-01T02:00:00.000Z", end_at: "2026-09-01T03:00:00.000Z", capacity: 3 },
        { id: "soon", start_at: "2026-10-01T02:00:00.000Z", end_at: "2026-10-01T03:00:00.000Z", capacity: 3 },
      ],
    };

    expect(upcomingSchedules(listing, new Date("2026-09-27T00:00:00.000Z")).map((schedule) => schedule.id)).toEqual(["soon", "late"]);
  });
});
