import Image from "next/image";
import { AppWorkspace } from "@/components/app-workspace";
import { AuthPanel } from "@/components/auth-panel";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchConversationSummaries, fetchCurrentUserProfile, fetchLearnerBookings, fetchLearnerPreferences, fetchNotifications, fetchOnboardingStatus, fetchProviderBookings, fetchProviderListings, fetchProviderProfile, fetchPublishedListings } from "@/lib/user-profile";

type HomeProps = {
  searchParams: Promise<{ auth_error?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { auth_error: authError } = await searchParams;
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
  const providerBookings =
    supabase && onboardingStatus?.providerProfileId
      ? await fetchProviderBookings(supabase)
      : null;
  const learnerBookings = supabase && profileResult?.user ? await fetchLearnerBookings(supabase) : null;
  const notifications = supabase && profileResult?.user ? await fetchNotifications(supabase) : null;
  const conversations = supabase && profileResult?.user ? await fetchConversationSummaries(supabase) : null;
  const publishedListings = supabase && profileResult?.user ? await fetchPublishedListings(supabase) : null;
  const learnerPreferences = supabase && profileResult?.user ? await fetchLearnerPreferences(supabase, profileResult.user.id) : null;
  const providerProfile = supabase && profileResult?.user ? await fetchProviderProfile(supabase, profileResult.user.id) : null;

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
        </header>

        {!isSignedIn ? <section className="grid gap-10 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-16">
          <div className="grid gap-5">
            <p className="text-sm font-semibold text-[#6E8FE8]">LEARN → EXPERIENCE → CONNECT</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[#17203D] sm:text-5xl">日本語で過ごす時間を、自分らしく。</h1>
            <p className="max-w-2xl text-base leading-8 text-[#42506F]">先生と学び、街で使い、気になる人とつながる。Nihongo Paletteで、あなたの毎日に合う日本語の時間を見つけましょう。</p>
            <div className="grid gap-4 border-t border-[#D9E1F5] pt-6 sm:grid-cols-3">
              <p className="text-sm leading-7 text-[#42506F]"><strong className="block text-[#17203D]">学ぶ</strong>目的に合う先生を探す。</p>
              <p className="text-sm leading-7 text-[#42506F]"><strong className="block text-[#17203D]">体験する</strong>日本語を使う時間を選ぶ。</p>
              <p className="text-sm leading-7 text-[#42506F]"><strong className="block text-[#17203D]">つながる</strong>人との会話をはじめる。</p>
            </div>
          </div>
          <div className="grid gap-3">
            {authError ? <p aria-live="polite" className="rounded-lg border border-[#F6D3AF] bg-[#FFF9ED] px-4 py-3 text-sm leading-6 text-[#6B4A25]">ログインを完了できませんでした。もう一度お試しください。</p> : null}
            <AuthPanel isConfigured={config.isConfigured} />
          </div>
        </section> : <section className="grid gap-5">
          {profileResult?.error ? <p aria-live="polite" className="rounded-lg border border-[#F3C2C0] bg-[#FFF2F1] px-4 py-3 text-sm leading-6 text-[#9B3631]">プロフィールを読み込めませんでした。ページを更新してください。</p> : null}
          {profileResult?.profile && onboardingStatus?.hasLearnerPreferences ? <AppWorkspace
            canUseLearner={onboardingStatus.hasLearnerPreferences}
            initialMode={onboardingStatus.providerProfileId && profileResult.profile.last_active_mode === "provider" ? "provider" : "learner"}
            learnerBookings={learnerBookings?.data ?? []}
            learnerPreferences={learnerPreferences?.data ?? null}
            notifications={notifications?.data ?? []}
            profile={profileResult.profile}
            conversations={conversations?.data ?? []}
            providerBookings={providerBookings?.data ?? []}
            providerListings={providerListings?.data ?? []}
            providerProfileId={onboardingStatus.providerProfileId}
            providerProfile={providerProfile?.data ?? null}
            publishedListings={publishedListings?.data ?? []}
          /> : profileResult?.profile && onboardingStatus ? <OnboardingFlow profile={profileResult.profile} status={onboardingStatus} /> : null}
        </section>}
      </div>
    </main>
  );
}
