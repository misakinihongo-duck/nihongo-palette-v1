import { describe, expect, it } from "vitest";
import { nextConfirmedBooking } from "./home";

describe("nextConfirmedBooking", () => {
  it("returns the nearest future confirmed booking", () => {
    const booking = (id: string, status: "pending" | "confirmed", startAt: string, endAt: string) => ({ id, status, start_at: startAt, end_at: endAt });
    const next = nextConfirmedBooking([
      booking("past", "confirmed", "2026-09-01T00:00:00.000Z", "2026-09-01T01:00:00.000Z"),
      booking("later", "confirmed", "2026-09-12T00:00:00.000Z", "2026-09-12T01:00:00.000Z"),
      booking("soon", "confirmed", "2026-09-11T00:00:00.000Z", "2026-09-11T01:00:00.000Z"),
      booking("pending", "pending", "2026-09-10T00:00:00.000Z", "2026-09-10T01:00:00.000Z"),
    ], new Date("2026-09-10T00:00:00.000Z"));

    expect(next?.id).toBe("soon");
  });
});
