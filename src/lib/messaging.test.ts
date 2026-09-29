import { describe, expect, it } from "vitest";
import { totalUnreadCount, validateMessageBody, type ConversationSummary } from "./messaging";

describe("messaging helpers", () => {
  it("validates a message before it is submitted", () => {
    expect(validateMessageBody("   ")).toBe("メッセージを入力してください。");
    expect(validateMessageBody("a".repeat(2001))).toBe("メッセージは2000文字以内で入力してください。");
    expect(validateMessageBody("こんにちは")).toBeNull();
  });

  it("adds unread messages across conversations", () => {
    const conversations = [{ unread_count: 2 }, { unread_count: 1 }] as ConversationSummary[];
    expect(totalUnreadCount(conversations)).toBe(3);
  });
});
