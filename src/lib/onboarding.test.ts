import { describe, expect, it } from "vitest";
import { parseList, validateLearnerBasics, validateProviderBasics } from "./onboarding";

describe("onboarding validation", () => {
  it("normalizes a comma separated list without duplicates", () => {
    expect(parseList("Japanese, English, Japanese, ")).toEqual(["Japanese", "English"]);
  });

  it("requires the learner's basic profile fields", () => {
    expect(validateLearnerBasics({ name: "", nickname: "Misa", age: "24" })).toBe(
      "名前を入力してください。",
    );
    expect(validateLearnerBasics({ name: "Misaki", nickname: "Misa", age: "0" })).toBe(
      "年齢は1以上の数字で入力してください。",
    );
    expect(validateLearnerBasics({ name: "Misaki", nickname: "Misa", age: "24" })).toBeNull();
  });

  it("requires the provider fields defined in the specification", () => {
    expect(validateProviderBasics({ displayName: "Misa", languages: [], bio: "Hello" })).toBe(
      "対応言語を1つ以上入力してください。",
    );
    expect(
      validateProviderBasics({ displayName: "Misa", languages: ["Japanese"], bio: "Hello" }),
    ).toBeNull();
  });
});
