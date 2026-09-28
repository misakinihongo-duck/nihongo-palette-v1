import { parseList, validateLearnerBasics, validateProviderBasics } from "@/lib/onboarding";

export const japaneseLevels = [
  ["beginner_zero", "まったくの初心者"],
  ["beginner", "初級"],
  ["intermediate", "中級"],
  ["advanced", "上級"],
] as const;

export const providerRoles = [
  ["teacher", "Japanese Teacher"],
  ["conversation_host", "Conversation Host"],
  ["local_guide", "Local Guide"],
  ["event_host", "Event Host"],
] as const;

export function validateOptionalUrl(value: string, label: string) {
  if (!value.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? null
      : `${label}はhttpまたはhttpsのURLを入力してください。`;
  } catch {
    return `${label}を正しいURL形式で入力してください。`;
  }
}

export function validateLearnerProfile(input: {
  age: string;
  challenges: string;
  japaneseLevel: string;
  name: string;
  nickname: string;
  peopleToConnect: string;
  profilePhoto: string;
  thingsToDo: string;
}) {
  const basicsError = validateLearnerBasics(input);
  if (basicsError) return basicsError;
  if (!input.japaneseLevel) return "日本語レベルを選択してください。";
  if (parseList(input.thingsToDo).length === 0) return "やってみたいことを1つ以上入力してください。";
  if (parseList(input.peopleToConnect).length === 0) return "つながりたい人を1つ以上入力してください。";
  if (parseList(input.challenges).length === 0) return "挑戦してみたいことを1つ以上入力してください。";

  return validateOptionalUrl(input.profilePhoto, "プロフィール写真のURL");
}

export function validateProviderProfile(input: {
  bio: string;
  displayName: string;
  expertise: string;
  languages: string;
  profilePhoto: string;
  roles: string[];
  socialUrl: string;
  website: string;
}) {
  const basicsError = validateProviderBasics({
    bio: input.bio,
    displayName: input.displayName,
    languages: parseList(input.languages),
  });
  if (basicsError) return basicsError;
  if (input.roles.length === 0) return "提供できる役割を1つ以上選択してください。";
  if (parseList(input.expertise).length === 0) return "得意分野を1つ以上入力してください。";

  return (
    validateOptionalUrl(input.profilePhoto, "プロフィール写真のURL") ||
    validateOptionalUrl(input.website, "Webサイト") ||
    validateOptionalUrl(input.socialUrl, "SNS")
  );
}
