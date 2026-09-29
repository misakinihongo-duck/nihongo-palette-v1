import { describe, expect, it } from "vitest";
import { validateBookingDraft } from "./booking";

describe("booking validation", () => {
  it("requires a schedule and a positive party size", () => {
    expect(validateBookingDraft({ message: "", partySize: "1", scheduleId: null }, 2)).toBe("日時を選択してください。");
    expect(validateBookingDraft({ message: "", partySize: "0", scheduleId: "schedule" }, 2)).toBe("参加人数は1人以上の整数で入力してください。");
  });

  it("does not allow more guests than the current capacity", () => {
    expect(validateBookingDraft({ message: "", partySize: "3", scheduleId: "schedule" }, 2)).toBe("選択した日時枠の残席を超えています。");
  });

  it("accepts a valid request", () => {
    expect(validateBookingDraft({ message: "楽しみにしています。", partySize: "2", scheduleId: "schedule" }, 2)).toBeNull();
  });
});
