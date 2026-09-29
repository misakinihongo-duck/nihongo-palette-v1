import { describe, expect, it } from "vitest";
import { validateServiceDetails, validateServiceSchedule } from "./service-form";

describe("service form validation", () => {
  it("requires a location for offline services", () => {
    expect(
      validateServiceDetails({
        capacity: "4",
        durationMinutes: "90",
        format: "offline",
        location: "",
        price: "2500",
      }),
    ).toBe("オフライン開催の場合は場所を入力してください。");
  });

  it("requires an end time after the start time", () => {
    expect(
      validateServiceSchedule({
        capacity: "4",
        date: "2026-10-01",
        endTime: "10:00",
        startTime: "10:00",
      }),
    ).toBe("終了時刻は開始時刻より後にしてください。");
  });

  it("accepts valid service details and a schedule", () => {
    expect(
      validateServiceDetails({
        capacity: "4",
        durationMinutes: "90",
        format: "offline",
        location: "Shibuya",
        price: "2500",
      }),
    ).toBeNull();
    expect(
      validateServiceSchedule({
        capacity: "4",
        date: "2026-10-01",
        endTime: "11:30",
        startTime: "10:00",
      }),
    ).toBeNull();
  });
});
