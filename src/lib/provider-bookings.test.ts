import { describe, expect, it } from "vitest";
import { filterProviderBookings, type ProviderBooking } from "./provider-bookings";

const booking = (id: string, status: ProviderBooking["status"], endAt: string): ProviderBooking => ({
  booked_price: 3000,
  created_at: "2026-09-27T00:00:00.000Z",
  end_at: endAt,
  id,
  learner: { name: "Learner", nickname: null },
  listing: { title: "Service", type: "lesson" },
  message: null,
  party_size: 1,
  start_at: "2026-09-28T01:00:00.000Z",
  status,
});

describe("provider booking filters", () => {
  const now = new Date("2026-09-27T00:00:00.000Z");
  const bookings = [
    booking("pending", "pending", "2026-09-28T02:00:00.000Z"),
    booking("upcoming", "confirmed", "2026-09-28T02:00:00.000Z"),
    booking("past", "confirmed", "2026-09-26T02:00:00.000Z"),
    booking("rejected", "rejected", "2026-09-28T02:00:00.000Z"),
  ];

  it("groups pending, confirmed, and past bookings", () => {
    expect(filterProviderBookings(bookings, "pending", now).map((item) => item.id)).toEqual(["pending"]);
    expect(filterProviderBookings(bookings, "confirmed", now).map((item) => item.id)).toEqual(["upcoming"]);
    expect(filterProviderBookings(bookings, "past", now).map((item) => item.id)).toEqual(["past"]);
  });
});
