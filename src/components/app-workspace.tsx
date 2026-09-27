"use client";

import { useState } from "react";
import { LearnerDiscovery } from "@/components/learner-discovery";
import { ProviderServiceManager } from "@/components/provider-service-manager";
import type { DiscoveryListing } from "@/lib/learner-discovery";
import type { ProviderListing } from "@/lib/user-profile";

type AppWorkspaceProps = {
  canUseLearner: boolean;
  initialMode: "learner" | "provider";
  providerListings: ProviderListing[];
  providerProfileId: string | null;
  publishedListings: DiscoveryListing[];
};

export function AppWorkspace({ canUseLearner, initialMode, providerListings, providerProfileId, publishedListings }: AppWorkspaceProps) {
  const [mode, setMode] = useState(initialMode);
  const canUseProvider = Boolean(providerProfileId);

  return (
    <div className="grid gap-6">
      {canUseLearner && canUseProvider ? <div className="flex gap-2 border-b border-[#D9E1F5]" role="tablist" aria-label="利用モード"><button aria-selected={mode === "learner"} className={mode === "learner" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("learner")} role="tab" type="button">探す</button><button aria-selected={mode === "provider"} className={mode === "provider" ? "border-b-2 border-[#6E8FE8] px-3 pb-3 text-sm font-semibold text-[#17203D]" : "px-3 pb-3 text-sm text-[#6B7895]"} onClick={() => setMode("provider")} role="tab" type="button">サービス管理</button></div> : null}
      {mode === "learner" && canUseLearner ? <LearnerDiscovery listings={publishedListings} /> : null}
      {mode === "provider" && providerProfileId ? <ProviderServiceManager listings={providerListings} providerProfileId={providerProfileId} /> : null}
    </div>
  );
}
