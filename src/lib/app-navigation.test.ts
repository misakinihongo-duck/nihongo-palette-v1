import { describe, expect, it } from "vitest";
import { learnerNavigation, providerNavigation } from "./app-navigation";

describe("app navigation", () => {
  it("uses the final five learner destinations from the screen specification", () => {
    expect(learnerNavigation).toEqual([
      ["home", "ホーム"],
      ["learn", "学ぶ"],
      ["experience", "体験する"],
      ["messages", "メッセージ"],
      ["profile", "プロフィール"],
    ]);
  });

  it("uses the final five provider destinations from the screen specification", () => {
    expect(providerNavigation).toEqual([
      ["home", "ホーム"],
      ["services", "サービス"],
      ["bookings", "予約"],
      ["messages", "メッセージ"],
      ["profile", "プロフィール"],
    ]);
  });
});
