"use client";

import { useState } from "react";
import { LearnerBookingManager } from "@/components/learner-booking-manager";
import { LearnerDiscovery } from "@/components/learner-discovery";
import { LearnerHome } from "@/components/learner-home";
import { IntroPage } from "@/components/intro-page";
import { MessagingPanel } from "@/components/messaging-panel";
import { NotificationList } from "@/components/notification-list";
import { ProfileWorkspace } from "@/components/profile-workspace";
import { ProviderBookingManager } from "@/components/provider-booking-manager";
import { ProviderHome } from "@/components/provider-home";
import { ProviderServiceManager } from "@/components/provider-service-manager";
import {
  learnerNavigation,
  providerNavigation,
  type LearnerWorkspaceView,
  type ProviderWorkspaceView,
} from "@/lib/app-navigation";
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
  const [learnerView, setLearnerView] = useState<LearnerWorkspaceView>("home");
  const [providerView, setProviderView] = useState<ProviderWorkspaceView>("home");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const canUseProvider = Boolean(providerProfileId);

  function openLearnerView(view: LearnerWorkspaceView) {
    setActiveConversationId(null);
    setShowIntro(false);
    setMode("learner");
    setLearnerView(view);
  }

  function openProviderView(view: ProviderWorkspaceView) {
    setActiveConversationId(null);
    setShowIntro(false);
    setMode("provider");
    setProviderView(view);
  }

  function openLearnerConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setShowIntro(false);
    setMode("learner");
    setLearnerView("messages");
  }

  function openProviderConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setShowIntro(false);
    setMode("provider");
    setProviderView("messages");
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#D9E1F5]" role="tablist" aria-label="共通メニュー">
        <button aria-selected={showIntro} className={showIntro ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setShowIntro(true)} role="tab" type="button">はじめに</button>
        {canUseLearner && canUseProvider ? <><span aria-hidden="true" className="mb-3 h-4 border-l border-[#D9E1F5]" /><button aria-selected={!showIntro && mode === "learner"} className={!showIntro && mode === "learner" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => openLearnerView("home")} role="tab" type="button">Learner</button><button aria-selected={!showIntro && mode === "provider"} className={!showIntro && mode === "provider" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => openProviderView("home")} role="tab" type="button">Provider</button></> : null}
      </div>

      {showIntro ? <IntroPage hasProviderProfile={canUseProvider} onOpenExperience={() => openLearnerView("experience")} onOpenLearn={() => openLearnerView("learn")} onOpenProvider={() => openProviderView(canUseProvider ? "services" : "profile")} /> : null}

      {!showIntro && mode === "learner" && canUseLearner ? (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="学習者メニュー">
            {learnerNavigation.map(([view, label]) => <button aria-selected={learnerView === view} className={learnerView === view ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} key={view} onClick={() => openLearnerView(view)} role="tab" type="button">{label}</button>)}
          </div>
          {learnerView === "home" ? <LearnerHome bookings={learnerBookings} onNavigate={setLearnerView} /> : null}
          {learnerView === "learn" ? <LearnerDiscovery initialView="learn" key="learn" listings={publishedListings} onOpenConversation={openLearnerConversation} /> : null}
          {learnerView === "experience" ? <LearnerDiscovery initialView="experience" key="experience" listings={publishedListings} onOpenConversation={openLearnerConversation} /> : null}
          {learnerView === "bookings" ? <LearnerBookingManager bookings={learnerBookings} onOpenConversation={openLearnerConversation} /> : null}
          {learnerView === "messages" ? <MessagingPanel activeConversationId={activeConversationId} conversations={conversations} onConversationChange={setActiveConversationId} /> : null}
          {learnerView === "notifications" ? <NotificationList notifications={notifications} /> : null}
          {learnerView === "profile" ? <ProfileWorkspace key="learner-profile" learnerPreferences={learnerPreferences} mode="learner" onOpenProvider={() => openProviderView("profile")} profile={profile} providerProfile={providerProfile} /> : null}
        </>
      ) : null}

      {!showIntro && mode === "provider" ? (
        <>
          {canUseProvider ? <div className="flex flex-wrap gap-2" role="tablist" aria-label="提供者メニュー">
            {providerNavigation.map(([view, label]) => <button aria-selected={providerView === view} className={providerView === view ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} key={view} onClick={() => openProviderView(view)} role="tab" type="button">{label}</button>)}
          </div> : null}
          {providerView === "home" && canUseProvider ? <ProviderHome bookings={providerBookings} conversations={conversations} listings={providerListings} onNavigate={setProviderView} /> : null}
          {providerView === "services" && providerProfileId ? <ProviderServiceManager listings={providerListings} providerProfileId={providerProfileId} /> : null}
          {providerView === "bookings" && canUseProvider ? <ProviderBookingManager bookings={providerBookings} onOpenConversation={openProviderConversation} /> : null}
          {providerView === "messages" && canUseProvider ? <MessagingPanel activeConversationId={activeConversationId} conversations={conversations} onConversationChange={setActiveConversationId} /> : null}
          {providerView === "notifications" && canUseProvider ? <NotificationList notifications={notifications} /> : null}
          {providerView === "profile" || !canUseProvider ? <ProfileWorkspace key="provider-profile" learnerPreferences={learnerPreferences} mode="provider" onOpenLearner={() => openLearnerView("home")} profile={profile} providerProfile={providerProfile} /> : null}
        </>
      ) : null}
    </div>
  );
}
