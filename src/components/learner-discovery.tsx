"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { validateBookingDraft, type BookingDraft } from "@/lib/booking";
import {
  experienceThemes,
  filterDiscoveryListings,
  learnPurposes,
  upcomingSchedules,
  type DiscoveryListing,
} from "@/lib/learner-discovery";
import { createClient } from "@/lib/supabase/client";

type LearnerDiscoveryProps = {
  initialView?: "learn" | "experience";
  listings: DiscoveryListing[];
  onOpenConversation: (conversationId: string) => void;
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

export function LearnerDiscovery({ initialView = "learn", listings, onOpenConversation }: LearnerDiscoveryProps) {
  const router = useRouter();
  const [view, setView] = useState<"learn" | "experience">(initialView);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<DiscoveryListing | null>(null);
  const [bookingStep, setBookingStep] = useState<"form" | "confirm" | "success" | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({ message: "", partySize: "1", scheduleId: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
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

  function beginBooking() {
    setBookingDraft({ message: "", partySize: "1", scheduleId: null });
    setBookingMessage(null);
    setBookingStep("form");
  }

  function selectedSchedule(listing: DiscoveryListing) {
    return upcomingSchedules(listing).find((schedule) => schedule.id === bookingDraft.scheduleId) ?? null;
  }

  function continueBooking(listing: DiscoveryListing) {
    const schedule = selectedSchedule(listing);
    const validationError = validateBookingDraft(bookingDraft, schedule?.capacity ?? 0);
    if (validationError) return setBookingMessage(validationError);

    setBookingMessage(null);
    setBookingStep("confirm");
  }

  async function submitBooking(listing: DiscoveryListing) {
    const schedule = selectedSchedule(listing);
    const validationError = validateBookingDraft(bookingDraft, schedule?.capacity ?? 0);
    if (validationError) return setBookingMessage(validationError);

    setIsSubmitting(true);
    setBookingMessage(null);
    const { error } = await createClient().rpc("create_booking_request", {
      p_listing_id: listing.id,
      p_message: bookingDraft.message,
      p_party_size: Number(bookingDraft.partySize),
      p_schedule_id: bookingDraft.scheduleId,
    });
    setIsSubmitting(false);

    if (error) return setBookingMessage(error.message);

    setBookingStep("success");
    router.refresh();
  }

  async function openConversation(listingId: string) {
    setDetailMessage(null);
    const { data, error } = await createClient().rpc("get_or_create_conversation", {
      p_booking_id: null,
      p_listing_id: listingId,
    });
    if (error) return setDetailMessage(error.message);
    onOpenConversation(data as string);
  }

  if (selectedListing) {
    const provider = selectedListing.provider_profiles;
    const schedules = upcomingSchedules(selectedListing);

    if (bookingStep === "success") {
      return <section className="rounded-2xl border border-[#D9E1F5] bg-white p-6"><p className="text-sm font-semibold text-[#6E8FE8]">BOOKING REQUEST SENT</p><h2 className="mt-2 text-2xl font-bold text-[#17203D]">予約リクエストを送りました</h2><p className="mt-3 text-sm leading-7 text-[#42506F]">提供者からの返答をお待ちください。</p><button className="mt-6 h-11 rounded-xl bg-[#6E8FE8] px-5 text-sm font-semibold text-white" onClick={() => { setBookingStep(null); setSelectedListing(null); }} type="button">サービスを探す</button></section>;
    }

    if (bookingStep) {
      const selected = selectedSchedule(selectedListing);
      const isConfirmation = bookingStep === "confirm";
      return <section aria-labelledby="booking-title" className="grid gap-6"><button className="w-fit text-sm font-semibold text-[#6E8FE8]" onClick={() => { setBookingStep(null); setBookingMessage(null); }} type="button">詳細に戻る</button><div className="rounded-2xl border border-[#D9E1F5] bg-white p-5"><p className="text-sm font-semibold text-[#6E8FE8]">BOOKING {isConfirmation ? "2 / 2" : "1 / 2"}</p><h2 className="mt-2 text-xl font-bold text-[#17203D]" id="booking-title">{isConfirmation ? "予約内容を確認" : "予約リクエスト"}</h2>{isConfirmation ? <dl className="mt-5 grid gap-4 text-sm"><div><dt className="text-[#6B7895]">サービス</dt><dd className="mt-1 font-semibold text-[#17203D]">{selectedListing.title}</dd></div><div><dt className="text-[#6B7895]">日時</dt><dd className="mt-1 font-semibold text-[#17203D]">{selected ? formatSchedule(selected.start_at, selected.end_at) : "-"}</dd></div><div><dt className="text-[#6B7895]">参加人数・料金</dt><dd className="mt-1 font-semibold text-[#17203D]">{bookingDraft.partySize}人 / ¥{(selectedListing.price * Number(bookingDraft.partySize)).toLocaleString()}</dd></div>{bookingDraft.message ? <div><dt className="text-[#6B7895]">メッセージ</dt><dd className="mt-1 whitespace-pre-wrap text-[#17203D]">{bookingDraft.message}</dd></div> : null}</dl> : <div className="mt-5 grid gap-5"><fieldset><legend className="text-sm font-semibold text-[#17203D]">日時</legend><div className="mt-3 grid gap-2">{schedules.map((schedule) => <label className={bookingDraft.scheduleId === schedule.id ? "flex cursor-pointer gap-3 rounded-xl border-2 border-[#6E8FE8] bg-[#EAF0FF] p-3 text-sm text-[#17203D]" : "flex cursor-pointer gap-3 rounded-xl border border-[#D9E1F5] p-3 text-sm text-[#17203D]"} key={schedule.id}><input checked={bookingDraft.scheduleId === schedule.id} className="mt-1 size-4 accent-[#6E8FE8]" name="schedule" onChange={() => setBookingDraft({ ...bookingDraft, scheduleId: schedule.id })} type="radio" />{formatSchedule(schedule.start_at, schedule.end_at)} / 定員 {schedule.capacity}人</label>)}</div></fieldset><label className="text-sm font-semibold text-[#17203D]">参加人数<input className="mt-2 h-11 w-full rounded-xl border border-[#BFCBE8] px-3 text-base" min="1" onChange={(event) => setBookingDraft({ ...bookingDraft, partySize: event.target.value })} type="number" value={bookingDraft.partySize} /></label><label className="text-sm font-semibold text-[#17203D]">メッセージ<span className="ml-1 font-normal text-[#6B7895]">任意</span><textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#BFCBE8] p-3 text-base" maxLength={1000} onChange={(event) => setBookingDraft({ ...bookingDraft, message: event.target.value })} value={bookingDraft.message} /></label></div>}{bookingMessage ? <p aria-live="polite" className="mt-4 text-sm text-[#C95551]">{bookingMessage}</p> : null}<div className="mt-6 flex flex-wrap gap-3">{isConfirmation ? <><button className="h-11 rounded-xl border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" disabled={isSubmitting} onClick={() => setBookingStep("form")} type="button">戻る</button><button className="h-11 rounded-xl bg-[#6E8FE8] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={() => void submitBooking(selectedListing)} type="button">{isSubmitting ? "送信中..." : "予約リクエストを送る"}</button></> : <button className="h-11 rounded-xl bg-[#6E8FE8] px-5 text-sm font-semibold text-white" onClick={() => continueBooking(selectedListing)} type="button">内容を確認</button>}</div></div></section>;
    }

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
            {detailMessage ? <p aria-live="polite" className="text-sm text-[#C95551]">{detailMessage}</p> : null}
            <div className="flex flex-wrap gap-3"><button className="h-12 rounded-xl border border-[#6E8FE8] px-5 text-sm font-semibold text-[#476BC7]" onClick={() => void openConversation(selectedListing.id)} type="button">メッセージする</button><button className="h-12 rounded-xl bg-[#6E8FE8] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={!schedules.length} onClick={beginBooking} type="button">予約する</button></div>
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
