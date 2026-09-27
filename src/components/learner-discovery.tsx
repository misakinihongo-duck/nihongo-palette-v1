"use client";

import { useMemo, useState } from "react";
import {
  experienceThemes,
  filterDiscoveryListings,
  learnPurposes,
  upcomingSchedules,
  type DiscoveryListing,
} from "@/lib/learner-discovery";

type LearnerDiscoveryProps = {
  listings: DiscoveryListing[];
};

const listingTypeLabel = {
  experience: "体験・イベント",
  lesson: "日本語レッスン",
  local_guide: "ローカルガイド",
};

function formatSchedule(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" });
  return `${formatter.format(new Date(startAt))} - ${new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" }).format(new Date(endAt))}`;
}

export function LearnerDiscovery({ listings }: LearnerDiscoveryProps) {
  const [view, setView] = useState<"learn" | "experience">("learn");
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<DiscoveryListing | null>(null);
  const filters = view === "learn" ? learnPurposes : experienceThemes;
  const visibleListings = useMemo(
    () => filterDiscoveryListings(listings, view, filter),
    [filter, listings, view],
  );

  function changeView(nextView: "learn" | "experience") {
    setFilter(null);
    setSelectedListing(null);
    setView(nextView);
  }

  if (selectedListing) {
    const provider = selectedListing.provider_profiles;
    const schedules = upcomingSchedules(selectedListing);

    return (
      <section aria-labelledby="listing-detail-title" className="grid gap-6">
        <button className="w-fit text-sm font-semibold text-[#6E8FE8]" onClick={() => setSelectedListing(null)} type="button">一覧に戻る</button>
        <div className="overflow-hidden rounded-2xl border border-[#D9E1F5] bg-white">
          <div className="min-h-44 bg-[#FFF9ED] p-5">
            <p className="text-sm font-semibold text-[#F47A6A]">{listingTypeLabel[selectedListing.type]}</p>
            <h2 className="mt-3 text-2xl font-bold text-[#17203D]" id="listing-detail-title">{selectedListing.title}</h2>
          </div>
          <div className="grid gap-6 p-5">
            <div>
              <p className="text-sm font-semibold text-[#6E8FE8]">{provider?.display_name ?? "Provider"}</p>
              <p className="mt-2 text-sm leading-7 text-[#42506F]">{provider?.bio ?? "プロフィールを準備中です。"}</p>
            </div>
            <p className="text-sm leading-7 text-[#17203D]">{selectedListing.description}</p>
            <dl className="grid gap-3 border-y border-[#E7ECF8] py-4 text-sm text-[#42506F] sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-[#6B7895]">料金</dt><dd className="mt-1 font-semibold text-[#17203D]">¥{selectedListing.price.toLocaleString()}</dd></div>
              <div><dt className="text-xs font-semibold text-[#6B7895]">所要時間</dt><dd className="mt-1 font-semibold text-[#17203D]">{selectedListing.duration_minutes}分</dd></div>
              <div><dt className="text-xs font-semibold text-[#6B7895]">形式</dt><dd className="mt-1 font-semibold text-[#17203D]">{selectedListing.format === "online" ? "オンライン" : selectedListing.location ?? "オフライン"}</dd></div>
              <div><dt className="text-xs font-semibold text-[#6B7895]">対応言語</dt><dd className="mt-1 font-semibold text-[#17203D]">{provider?.languages.join(" / ") || "Japanese"}</dd></div>
            </dl>
            <div>
              <h3 className="text-base font-bold text-[#17203D]">開催日時</h3>
              {schedules.length ? <ul className="mt-3 grid gap-2">{schedules.map((schedule) => <li className="rounded-xl border border-[#D9E1F5] px-3 py-3 text-sm text-[#17203D]" key={schedule.id}>{formatSchedule(schedule.start_at, schedule.end_at)} / 定員 {schedule.capacity}人</li>)}</ul> : <p className="mt-2 text-sm text-[#6B7895]">現在選べる日時はありません。</p>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="discovery-title" className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-[#6E8FE8]">DISCOVERY</p>
        <h2 className="mt-1 text-xl font-bold text-[#17203D]" id="discovery-title">日本語で過ごす時間を探す</h2>
      </div>
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="サービスの探し方">
        <button aria-selected={view === "learn"} className={view === "learn" ? "h-11 rounded-xl bg-[#6E8FE8] px-3 text-sm font-semibold text-white" : "h-11 rounded-xl border border-[#BFCBE8] bg-white px-3 text-sm font-semibold text-[#17203D]"} onClick={() => changeView("learn")} role="tab" type="button">学ぶ</button>
        <button aria-selected={view === "experience"} className={view === "experience" ? "h-11 rounded-xl bg-[#6E8FE8] px-3 text-sm font-semibold text-white" : "h-11 rounded-xl border border-[#BFCBE8] bg-white px-3 text-sm font-semibold text-[#17203D]"} onClick={() => changeView("experience")} role="tab" type="button">体験する</button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label={view === "learn" ? "学ぶ目的" : "体験テーマ"}>
        <button aria-pressed={filter === null} className={filter === null ? "rounded-full border border-[#6E8FE8] bg-[#EAF0FF] px-3 py-2 text-sm font-semibold text-[#17203D]" : "rounded-full border border-[#D9E1F5] bg-white px-3 py-2 text-sm text-[#42506F]"} onClick={() => setFilter(null)} type="button">すべて</button>
        {filters.map((item) => <button aria-pressed={filter === item} className={filter === item ? "rounded-full border border-[#6E8FE8] bg-[#EAF0FF] px-3 py-2 text-sm font-semibold text-[#17203D]" : "rounded-full border border-[#D9E1F5] bg-white px-3 py-2 text-sm text-[#42506F]"} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}
      </div>
      {visibleListings.length ? <div className="grid gap-4 sm:grid-cols-2">{visibleListings.map((listing) => {
        const nextSchedule = upcomingSchedules(listing)[0];
        return <article className="overflow-hidden rounded-2xl border border-[#D9E1F5] bg-white" key={listing.id}><div className="h-28 bg-[#FFF9ED]" /><div className="grid gap-3 p-4"><div><p className="text-xs font-semibold text-[#F47A6A]">{listingTypeLabel[listing.type]}</p><h3 className="mt-1 text-lg font-bold text-[#17203D]">{listing.title}</h3><p className="mt-1 text-sm text-[#42506F]">{listing.provider_profiles?.display_name ?? "Provider"}</p></div><p className="text-sm text-[#42506F]">¥{listing.price.toLocaleString()} / {listing.duration_minutes}分</p>{view === "experience" ? <p className="text-sm text-[#42506F]">{nextSchedule ? formatSchedule(nextSchedule.start_at, nextSchedule.end_at) : listing.location ?? "日時を確認中"}</p> : null}<button className="h-11 rounded-xl border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={() => setSelectedListing(listing)} type="button">詳細を見る</button></div></article>;
      })}</div> : <div className="rounded-2xl border border-dashed border-[#BFCBE8] bg-[#FFF9ED] px-5 py-8 text-sm leading-7 text-[#42506F]">{view === "learn" ? "該当する先生が見つかりません。目的を変えて探してみましょう。" : "該当する体験が見つかりません。すべてのテーマから探してみましょう。"}</div>}
    </section>
  );
}
