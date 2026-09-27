"use client";

import { useState } from "react";
import { LearnerBookingManager } from "@/components/learner-booking-manager";
import { LearnerDiscovery } from "@/components/learner-discovery";
import { NotificationList } from "@/components/notification-list";
import { ProviderBookingManager } from "@/components/provider-booking-manager";
import { ProviderServiceManager } from "@/components/provider-service-manager";
import type { DiscoveryListing } from "@/lib/learner-discovery";
import type { LearnerBooking } from "@/lib/learner-bookings";
import type { AppNotification } from "@/lib/notifications";
import type { ProviderBooking } from "@/lib/provider-bookings";
import type { ProviderListing } from "@/lib/user-profile";

type AppWorkspaceProps = {
  canUseLearner: boolean;
  initialMode: "learner" | "provider";
  learnerBookings: LearnerBooking[];
  notifications: AppNotification[];
  providerListings: ProviderListing[];
  providerBookings: ProviderBooking[];
  providerProfileId: string | null;
  publishedListings: DiscoveryListing[];
};

export function AppWorkspace({ canUseLearner, initialMode, learnerBookings, notifications, providerListings, providerBookings, providerProfileId, publishedListings }: AppWorkspaceProps) {
  const [mode, setMode] = useState(initialMode);
  const [learnerView, setLearnerView] = useState<"discovery" | "bookings" | "notifications">("discovery");
  const [providerView, setProviderView] = useState<"services" | "bookings" | "notifications">("services");
  const canUseProvider = Boolean(providerProfileId);

  return (
    <div className="grid gap-6">
      {canUseLearner && canUseProvider ? <div className="flex gap-2 border-b border-[#D9E1F5]" role="tablist" aria-label="利用モード"><button aria-selected={mode === "learner"} className={mode === "learner" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("learner")} role="tab" type="button">探す</button><button aria-selected={mode === "provider"} className={mode === "provider" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("provider")} role="tab" type="button">サービス管理</button></div> : null}
      {mode === "learner" && canUseLearner ? <><div className="flex gap-2" role="tablist" aria-label="学習者メニュー"><button aria-selected={learnerView === "discovery"} className={learnerView === "discovery" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setLearnerView("discovery")} role="tab" type="button">探す</button><button aria-selected={learnerView === "bookings"} className={learnerView === "bookings" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setLearnerView("bookings")} role="tab" type="button">予約</button><button aria-selected={learnerView === "notifications"} className={learnerView === "notifications" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setLearnerView("notifications")} role="tab" type="button">お知らせ</button></div>{learnerView === "discovery" ? <LearnerDiscovery listings={publishedListings} /> : learnerView === "bookings" ? <LearnerBookingManager bookings={learnerBookings} /> : <NotificationList notifications={notifications} />}</> : null}
      {mode === "provider" && providerProfileId ? <><div className="flex gap-2" role="tablist" aria-label="提供者メニュー"><button aria-selected={providerView === "services"} className={providerView === "services" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setProviderView("services")} role="tab" type="button">サービス</button><button aria-selected={providerView === "bookings"} className={providerView === "bookings" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setProviderView("bookings")} role="tab" type="button">予約</button><button aria-selected={providerView === "notifications"} className={providerView === "notifications" ? "border-b-2 border-[#6E8FE8] px-3 pb-2 text-sm font-semibold text-[#17203D]" : "px-3 pb-2 text-sm text-[#6B7895]"} onClick={() => setProviderView("notifications")} role="tab" type="button">お知らせ</button></div>{providerView === "services" ? <ProviderServiceManager listings={providerListings} providerProfileId={providerProfileId} /> : providerView === "bookings" ? <ProviderBookingManager bookings={providerBookings} /> : <NotificationList notifications={notifications} />}</> : null}
    </div>
  );
}
