import { describe, expect, it } from "vitest";
import { createProfileImagePath, maxProfileImageBytes, validateProfileImage } from "./profile-image";

describe("profile image helpers", () => {
  it("accepts supported images up to the storage limit", () => {
    const image = new File([new Uint8Array(24)], "avatar.webp", { type: "image/webp" });
    expect(validateProfileImage(image)).toBeNull();
    expect(createProfileImagePath("user-1", "learner", image, "token")).toBe("user-1/learner/token.webp");
  });

  it("rejects unsupported and oversized files", () => {
    const document = new File(["text"], "notes.txt", { type: "text/plain" });
    const tooLarge = new File([new Uint8Array(maxProfileImageBytes + 1)], "photo.jpg", { type: "image/jpeg" });
    expect(validateProfileImage(document)).toContain("JPEG");
    expect(validateProfileImage(tooLarge)).toContain("5MB");
  });
});
