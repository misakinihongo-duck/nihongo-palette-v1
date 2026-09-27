import Image from "next/image";
import { AppWorkspace } from "@/components/app-workspace";
import { AuthPanel } from "@/components/auth-panel";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchCurrentUserProfile, fetchOnboardingStatus, fetchProviderListings, fetchPublishedListings } from "@/lib/user-profile";

export default async function Home() {
  const config = getSupabaseConfig();
  const supabase = await createClient();
  const profileResult = supabase ? await fetchCurrentUserProfile(supabase) : null;
  const isSignedIn = Boolean(profileResult?.user);
  const onboardingStatus =
    supabase && profileResult?.user
      ? await fetchOnboardingStatus(supabase, profileResult.user.id)
      : null;
  const providerListings =
    supabase && onboardingStatus?.providerProfileId
      ? await fetchProviderListings(supabase, onboardingStatus.providerProfileId)
      : null;
  const publishedListings = supabase && profileResult?.user ? await fetchPublishedListings(supabase) : null;

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-6 sm:px-8 lg:py-10">
        <header className="flex items-center justify-between gap-4">
          <Image
            alt="Nihongo Palette"
            className="h-auto w-44"
            height={54}
            priority
            src="/brand/nihongo-palette-logo-horizontal.svg"
            width={224}
          />
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            Sprint 2
          </span>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="grid gap-5">
            <div className="grid gap-4">
              <p className="text-sm font-semibold text-teal-700">Learn → Experience → Connect</p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                あなたの目的に合う、日本語での時間をつくりましょう。
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-700">
                日本語を学ぶことから、体験や人とのつながりへ。まずはあなたに合う使い方を教えてください。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Supabase", config.isConfigured ? "環境変数 OK" : "設定待ち"],
                ["Auth", isSignedIn ? "Session OK" : "未ログイン"],
                ["User DB", profileResult?.profile ? "users取得 OK" : "確認待ち"],
              ].map(([label, value]) => (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
                  <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">{isSignedIn ? "はじめましょう" : "接続確認"}</h2>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-700">
                <p>
                  {isSignedIn
                    ? `${profileResult?.user?.email ?? "ログインユーザー"}としてログインしています。利用方法を選び、プロフィールを設定しましょう。`
                    : "Google認証を最終形にしつつ、Email/PasswordでもAuth → User → DBの疎通を確認できます。"}
                </p>
                {profileResult?.error ? (
                  <p className="rounded-md bg-rose-50 p-3 text-rose-800">{profileResult.error}</p>
                ) : null}
                {profileResult?.profile && onboardingStatus?.hasLearnerPreferences ? (
                  <AppWorkspace
                    canUseLearner={onboardingStatus.hasLearnerPreferences}
                    initialMode={onboardingStatus.providerProfileId && profileResult.profile.last_active_mode === "provider" ? "provider" : "learner"}
                    providerListings={providerListings?.data ?? []}
                    providerProfileId={onboardingStatus.providerProfileId}
                    publishedListings={publishedListings?.data ?? []}
                  />
                ) : profileResult?.profile && onboardingStatus ? (
                  <OnboardingFlow profile={profileResult.profile} status={onboardingStatus} />
                ) : null}
              </div>
            </section>
          </div>

          {!isSignedIn ? <AuthPanel isConfigured={config.isConfigured} /> : null}
        </section>
      </div>
      </main>
  );
}
