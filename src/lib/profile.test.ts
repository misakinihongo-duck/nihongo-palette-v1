import { describe, expect, it } from "vitest";
import { validateLearnerProfile, validateOptionalUrl, validateProviderProfile } from "./profile";

describe("profile validation", () => {
  it("accepts an http profile image URL and a complete learner profile", () => {
    expect(validateOptionalUrl("https://example.com/photo.jpg", "写真")).toBeNull();
    expect(validateLearnerProfile({
      age: "28",
      challenges: "日本語で注文する",
      japaneseLevel: "beginner",
      name: "Mina",
      nickname: "みな",
      peopleToConnect: "日本語の先生",
      thingsToDo: "日本語会話",
    })).toBeNull();
  });

  it("rejects incomplete learner preferences and unsafe URLs", () => {
    expect(validateLearnerProfile({
      age: "28",
      challenges: "",
      japaneseLevel: "beginner",
      name: "Mina",
      nickname: "みな",
      peopleToConnect: "日本語の先生",
      thingsToDo: "日本語会話",
    })).toContain("挑戦");
    expect(validateOptionalUrl("javascript:alert(1)", "写真")).toContain("http");
  });

  it("requires provider roles and an expertise", () => {
    expect(validateProviderProfile({
      bio: "会話を楽しみます。",
      displayName: "Mina",
      expertise: "日常会話",
      languages: "Japanese, English",
      roles: [],
      socialUrl: "",
      website: "",
    })).toContain("役割");
  });
});
