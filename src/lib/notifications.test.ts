import { describe, expect, it } from "vitest";
import { notificationMessage, type AppNotification } from "./notifications";

describe("notificationMessage", () => {
  it("uses the appropriate booking status message", () => {
    const notification = { type: "booking_accepted" } as AppNotification;
    expect(notificationMessage(notification)).toBe("予約が承認されました。");
  });
});
