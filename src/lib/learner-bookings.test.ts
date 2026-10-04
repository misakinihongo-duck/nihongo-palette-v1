import { describe, expect, it } from "vitest";
import { filterLearnerBookings, type LearnerBooking } from "./learner-bookings";

const booking = (id: string, status: LearnerBooking["status"], endAt: string): LearnerBooking => ({
  booked_price: 2400,
  created_at: "2026-09-01T00:00:00.000Z",
  end_at: endAt,
  id,
  listing: { title: "会話レッスン", type: "lesson" },
  message: null,
  party_size: 1,
  provider: { display_name: "Misaki" },
  start_at: "2026-09-01T00:00:00.000Z",
  status,
});

describe("filterLearnerBookings", () => {
  it("groups pending, upcoming, and completed booking states", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");
    const bookings = [
      booking("pending", "pending", "2026-09-12T01:00:00.000Z"),
      booking("upcoming", "confirmed", "2026-09-12T01:00:00.000Z"),
      booking("past", "confirmed", "2026-09-01T01:00:00.000Z"),
      booking("rejected", "rejected", "2026-09-12T01:00:00.000Z"),
      booking("cancelled", "cancelled", "2026-09-12T01:00:00.000Z"),
    ];

    expect(filterLearnerBookings(bookings, "requests", now).map((item) => item.id)).toEqual(["pending"]);
    expect(filterLearnerBookings(bookings, "upcoming", now).map((item) => item.id)).toEqual(["upcoming"]);
    expect(filterLearnerBookings(bookings, "past", now).map((item) => item.id)).toEqual(["past", "rejected", "cancelled"]);
  });
});
