export const learnerNavigation = [
  ["home", "ホーム"],
  ["learn", "学ぶ"],
  ["experience", "体験する"],
  ["messages", "メッセージ"],
  ["profile", "プロフィール"],
] as const;

export const providerNavigation = [
  ["home", "ホーム"],
  ["services", "サービス"],
  ["bookings", "予約"],
  ["messages", "メッセージ"],
  ["profile", "プロフィール"],
] as const;

export type LearnerNavigationView = (typeof learnerNavigation)[number][0];
export type ProviderNavigationView = (typeof providerNavigation)[number][0];
export type LearnerWorkspaceView = LearnerNavigationView | "bookings" | "notifications";
export type ProviderWorkspaceView = ProviderNavigationView | "notifications";
