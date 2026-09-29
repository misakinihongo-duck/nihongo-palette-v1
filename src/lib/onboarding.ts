export type LearnerBasics = {
  age: string;
  name: string;
  nickname: string;
};

export type ProviderBasics = {
  bio: string;
  displayName: string;
  languages: string[];
};

export function parseList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function validateLearnerBasics({ age, name, nickname }: LearnerBasics) {
  if (!name.trim()) return "名前を入力してください。";
  if (!nickname.trim()) return "ニックネームを入力してください。";

  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
    return "年齢は1以上の数字で入力してください。";
  }

  return null;
}

export function validateProviderBasics({ bio, displayName, languages }: ProviderBasics) {
  if (!displayName.trim()) return "表示名を入力してください。";
  if (languages.length === 0) return "対応言語を1つ以上入力してください。";
  if (!bio.trim()) return "自己紹介を入力してください。";

  return null;
}
