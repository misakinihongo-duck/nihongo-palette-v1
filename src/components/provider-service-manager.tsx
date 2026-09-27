"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderServiceCreator } from "@/components/provider-service-creator";
import { validateServiceSchedule } from "@/lib/service-form";
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
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, { capacity: string; date: string; endTime: string; startTime: string }>>({});

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

  async function addSchedule(listingId: string) {
    const draft = scheduleDrafts[listingId] ?? { capacity: "1", date: "", endTime: "", startTime: "" };
    const validationError = validateServiceSchedule(draft);
    if (validationError) return setMessage(validationError);

    setMessage(null);
    const { error } = await createClient().from("listing_schedules").insert({
      capacity: Number(draft.capacity),
      end_at: new Date(`${draft.date}T${draft.endTime}`).toISOString(),
      listing_id: listingId,
      start_at: new Date(`${draft.date}T${draft.startTime}`).toISOString(),
    });
    if (error) return setMessage(error.message);

    router.refresh();
  }

  async function uploadCover(listingId: string, file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      return setMessage("JPEG、PNG、WebP形式で5MB以下の画像を選んでください。");
    }

    setMessage(null);
    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return setMessage("ログイン状態を確認できませんでした。");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userData.user.id}/${listingId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file, { contentType: file.type });
    if (uploadError) return setMessage(uploadError.message);

    const { error: imageError } = await supabase.from("listing_images").upsert(
      { image_url: path, listing_id: listingId, sort_order: 0 },
      { onConflict: "listing_id,sort_order" },
    );
    if (imageError) return setMessage(imageError.message);

    const { error: listingError } = await supabase.from("listings").update({ cover_image: path }).eq("id", listingId);
    if (listingError) return setMessage(listingError.message);

    setMessage("カバー画像を保存しました。");
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
      {visibleListings.length === 0 ? <p className="mt-8 text-sm leading-7 text-slate-600">この状態のサービスはありません。</p> : <div className="mt-6 grid gap-6">{visibleListings.map((listing) => { const draft = scheduleDrafts[listing.id] ?? { capacity: "1", date: "", endTime: "", startTime: "" }; return <article className="border-b border-slate-200 pb-6" key={listing.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-teal-700">{statusLabel[listing.status]}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{listing.title}</h3><p className="mt-1 text-sm text-slate-600">{listing.type} / ¥{listing.price} / {listing.duration_minutes}分</p>{listing.listing_schedules[0] ? <p className="mt-2 text-sm text-slate-700">最初の日時枠: {new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(listing.listing_schedules[0].start_at))}</p> : null}</div><div className="flex flex-wrap gap-2">{listing.status !== "published" ? <button className="h-9 border border-teal-700 px-3 text-sm font-semibold text-teal-800" onClick={() => void updateStatus(listing.id, "published")} type="button">公開</button> : <button className="h-9 border border-slate-300 px-3 text-sm font-semibold text-slate-700" onClick={() => void updateStatus(listing.id, "unpublished")} type="button">非公開</button>}<button className="h-9 border border-rose-300 px-3 text-sm font-semibold text-rose-700" onClick={() => void archiveListing(listing.id)} type="button">削除</button></div></div><div className="mt-5 grid gap-3 border-t border-slate-100 pt-4"><label className="text-sm font-medium text-slate-700">カバー画像<input accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadCover(listing.id, file); }} type="file" /></label><div className="grid gap-2 sm:grid-cols-4"><input className="h-10 border border-slate-300 px-2 text-sm" onChange={(event) => setScheduleDrafts({ ...scheduleDrafts, [listing.id]: { ...draft, date: event.target.value } })} type="date" value={draft.date} /><input className="h-10 border border-slate-300 px-2 text-sm" onChange={(event) => setScheduleDrafts({ ...scheduleDrafts, [listing.id]: { ...draft, startTime: event.target.value } })} type="time" value={draft.startTime} /><input className="h-10 border border-slate-300 px-2 text-sm" onChange={(event) => setScheduleDrafts({ ...scheduleDrafts, [listing.id]: { ...draft, endTime: event.target.value } })} type="time" value={draft.endTime} /><input className="h-10 border border-slate-300 px-2 text-sm" min="1" onChange={(event) => setScheduleDrafts({ ...scheduleDrafts, [listing.id]: { ...draft, capacity: event.target.value } })} type="number" value={draft.capacity} /></div><button className="h-10 w-fit border border-slate-300 px-3 text-sm font-semibold text-slate-700" onClick={() => void addSchedule(listing.id)} type="button">日時枠を追加</button></div></article>; })}</div>}
    </section>
  );
}
