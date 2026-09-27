"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderServiceCreator } from "@/components/provider-service-creator";
import { createClient } from "@/lib/supabase/client";
import type { ProviderListing } from "@/lib/user-profile";

type Filter = "all" | ProviderListing["status"];

type ProviderServiceManagerProps = {
  listings: ProviderListing[];
  providerProfileId: string;
};

const statusLabel = {
  draft: "下書き",
  published: "公開中",
  unpublished: "非公開",
};

export function ProviderServiceManager({ listings: initialListings, providerProfileId }: ProviderServiceManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [isCreating, setIsCreating] = useState(initialListings.length === 0);
  const [message, setMessage] = useState<string | null>(null);

  const visibleListings =
    filter === "all" ? initialListings : initialListings.filter((listing) => listing.status === filter);

  async function updateStatus(listingId: string, status: ProviderListing["status"]) {
    setMessage(null);
    const { error } = await createClient().from("listings").update({ status }).eq("id", listingId);
    if (error) return setMessage(error.message);

    router.refresh();
  }

  async function archiveListing(listingId: string) {
    if (!window.confirm("このサービスを削除しますか？予約履歴は保持されます。")) return;

    setMessage(null);
    const { error } = await createClient()
      .from("listings")
      .update({ deleted_at: new Date().toISOString(), status: "unpublished" })
      .eq("id", listingId);
    if (error) return setMessage(error.message);

    router.refresh();
  }

  if (isCreating) {
    return (
      <div>
        {initialListings.length > 0 ? <button className="mb-5 h-10 border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={() => setIsCreating(false)} type="button">サービス一覧へ戻る</button> : null}
        <ProviderServiceCreator onDone={() => setIsCreating(false)} providerProfileId={providerProfileId} />
      </div>
    );
  }

  return (
    <section className="border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">SERVICES</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">サービス管理</h2>
        </div>
        <button className="h-11 bg-slate-950 px-4 text-sm font-semibold text-white" onClick={() => setIsCreating(true)} type="button">新しいサービスを作成</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="サービスの状態">
        {(["all", "published", "draft", "unpublished"] as const).map((value) => (
          <button aria-selected={filter === value} className={filter === value ? "h-9 bg-teal-700 px-3 text-sm font-semibold text-white" : "h-9 border border-slate-300 px-3 text-sm font-semibold text-slate-700"} key={value} onClick={() => setFilter(value)} role="tab" type="button">{value === "all" ? "すべて" : statusLabel[value]}</button>
        ))}
      </div>
      {message ? <p aria-live="polite" className="mt-4 text-sm text-rose-700">{message}</p> : null}
      {visibleListings.length === 0 ? <p className="mt-8 text-sm leading-7 text-slate-600">この状態のサービスはありません。</p> : <div className="mt-6 grid gap-4">{visibleListings.map((listing) => <article className="border-b border-slate-200 pb-5" key={listing.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-teal-700">{statusLabel[listing.status]}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{listing.title}</h3><p className="mt-1 text-sm text-slate-600">{listing.type} / ¥{listing.price} / {listing.duration_minutes}分</p>{listing.listing_schedules[0] ? <p className="mt-2 text-sm text-slate-700">最初の日時枠: {new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(listing.listing_schedules[0].start_at))}</p> : null}</div><div className="flex flex-wrap gap-2">{listing.status !== "published" ? <button className="h-9 border border-teal-700 px-3 text-sm font-semibold text-teal-800" onClick={() => void updateStatus(listing.id, "published")} type="button">公開</button> : <button className="h-9 border border-slate-300 px-3 text-sm font-semibold text-slate-700" onClick={() => void updateStatus(listing.id, "unpublished")} type="button">非公開</button>}<button className="h-9 border border-rose-300 px-3 text-sm font-semibold text-rose-700" onClick={() => void archiveListing(listing.id)} type="button">削除</button></div></div></article>)}</div>}
    </section>
  );
}
