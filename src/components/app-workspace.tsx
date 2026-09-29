"use client";

import { useState } from "react";
import { LearnerBookingManager } from "@/components/learner-booking-manager";
import { LearnerDiscovery } from "@/components/learner-discovery";
import { LearnerHome } from "@/components/learner-home";
import { MessagingPanel } from "@/components/messaging-panel";
import { NotificationList } from "@/components/notification-list";
import { ProfileWorkspace } from "@/components/profile-workspace";
import { ProviderBookingManager } from "@/components/provider-booking-manager";
import { ProviderHome } from "@/components/provider-home";
import { ProviderServiceManager } from "@/components/provider-service-manager";
import type { DiscoveryListing } from "@/lib/learner-discovery";
import type { LearnerBooking } from "@/lib/learner-bookings";
import type { ConversationSummary } from "@/lib/messaging";
import type { AppNotification } from "@/lib/notifications";
import type { ProviderBooking } from "@/lib/provider-bookings";
import type { AppUserProfile, LearnerPreferences, ProviderListing, ProviderProfile } from "@/lib/user-profile";

type AppWorkspaceProps = {
  canUseLearner: boolean;
  conversations: ConversationSummary[];
  initialMode: "learner" | "provider";
  learnerBookings: LearnerBooking[];
  learnerPreferences: LearnerPreferences | null;
  notifications: AppNotification[];
  profile: AppUserProfile;
  providerBookings: ProviderBooking[];
  providerListings: ProviderListing[];
  providerProfileId: string | null;
  providerProfile: ProviderProfile | null;
  publishedListings: DiscoveryListing[];
};

const learnerTabs = [
  ["home", "ホーム"],
  ["discovery", "探す"],
  ["bookings", "予約"],
  ["messages", "メッセージ"],
  ["notifications", "お知らせ"],
  ["profile", "プロフィール"],
] as const;

const providerTabs = [
  ["home", "ホーム"],
  ["services", "サービス"],
  ["bookings", "予約"],
  ["messages", "メッセージ"],
  ["notifications", "お知らせ"],
  ["profile", "プロフィール"],
] as const;

export function AppWorkspace({
  canUseLearner,
  conversations,
  initialMode,
  learnerBookings,
  learnerPreferences,
  notifications,
  profile,
  providerBookings,
  providerListings,
  providerProfileId,
  providerProfile,
  publishedListings,
}: AppWorkspaceProps) {
  const [mode, setMode] = useState(initialMode);
  const [learnerView, setLearnerView] = useState<(typeof learnerTabs)[number][0]>("home");
  const [providerView, setProviderView] = useState<(typeof providerTabs)[number][0]>("home");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const canUseProvider = Boolean(providerProfileId);

  function openLearnerConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setLearnerView("messages");
  }

  function openProviderConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setProviderView("messages");
  }

  return (
    <div className="grid gap-6">
      {canUseLearner && canUseProvider ? (
        <div className="flex gap-2 border-b border-[#D9E1F5]" role="tablist" aria-label="利用モード">
          <button aria-selected={mode === "learner"} className={mode === "learner" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("learner")} role="tab" type="button">探す</button>
          <button aria-selected={mode === "provider"} className={mode === "provider" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("provider")} role="tab" type="button">サービス管理</button>
        </div>
      ) : null}

      {mode === "learner" && canUseLearner ? (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="学習者メニュー">
            {learnerTabs.map(([view, label]) => <button aria-selected={learnerView === view} className={learnerView === view ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} key={view} onClick={() => { setActiveConversationId(null); setLearnerView(view); }} role="tab" type="button">{label}</button>)}
          </div>
          {learnerView === "home" ? <LearnerHome bookings={learnerBookings} onNavigate={setLearnerView} /> : null}
          {learnerView === "discovery" ? <LearnerDiscovery listings={publishedListings} onOpenConversation={openLearnerConversation} /> : null}
          {learnerView === "bookings" ? <LearnerBookingManager bookings={learnerBookings} onOpenConversation={openLearnerConversation} /> : null}
          {learnerView === "messages" ? <MessagingPanel activeConversationId={activeConversationId} conversations={conversations} onConversationChange={setActiveConversationId} /> : null}
          {learnerView === "notifications" ? <NotificationList notifications={notifications} /> : null}
          {learnerView === "profile" ? <ProfileWorkspace key="learner-profile" learnerPreferences={learnerPreferences} mode="learner" onOpenProvider={() => { setMode("provider"); setProviderView("profile"); }} profile={profile} providerProfile={providerProfile} /> : null}
        </>
      ) : null}

      {mode === "provider" ? (
        <>
          {canUseProvider ? <div className="flex flex-wrap gap-2" role="tablist" aria-label="提供者メニュー">
            {providerTabs.map(([view, label]) => <button aria-selected={providerView === view} className={providerView === view ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} key={view} onClick={() => { setActiveConversationId(null); setProviderView(view); }} role="tab" type="button">{label}</button>)}
          </div> : null}
          {providerView === "home" && canUseProvider ? <ProviderHome bookings={providerBookings} conversations={conversations} listings={providerListings} onNavigate={setProviderView} /> : null}
          {providerView === "services" && providerProfileId ? <ProviderServiceManager listings={providerListings} providerProfileId={providerProfileId} /> : null}
          {providerView === "bookings" && canUseProvider ? <ProviderBookingManager bookings={providerBookings} onOpenConversation={openProviderConversation} /> : null}
          {providerView === "messages" && canUseProvider ? <MessagingPanel activeConversationId={activeConversationId} conversations={conversations} onConversationChange={setActiveConversationId} /> : null}
          {providerView === "notifications" && canUseProvider ? <NotificationList notifications={notifications} /> : null}
          {providerView === "profile" || !canUseProvider ? <ProfileWorkspace key="provider-profile" learnerPreferences={learnerPreferences} mode="provider" onOpenLearner={() => { setMode("learner"); setLearnerView("home"); }} profile={profile} providerProfile={providerProfile} /> : null}
        </>
      ) : null}
    </div>
  );
}
