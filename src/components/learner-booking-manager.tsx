"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { filterLearnerBookings, type LearnerBooking } from "@/lib/learner-bookings";
import { createClient } from "@/lib/supabase/client";

type LearnerBookingManagerProps = { bookings: LearnerBooking[] };
type Tab = "requests" | "upcoming" | "past";

const labels: Record<Tab, string> = { past: "過去・履歴", requests: "リクエスト", upcoming: "確定済み" };
const statusLabels: Record<LearnerBooking["status"], string> = {
  cancelled: "キャンセル済み",
  confirmed: "確定済み",
  pending: "返答待ち",
  rejected: "お断り",
};

function formatDateTime(startAt: string, endAt: string) {
  const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" }).format(new Date(endAt));
  return `${date} - ${end}`;
}

export function LearnerBookingManager({ bookings }: LearnerBookingManagerProps) {
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState<LearnerBooking | null>(null);
  const [tab, setTab] = useState<Tab>("requests");
  const [message, setMessage] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const visibleBookings = filterLearnerBookings(bookings, tab);

  async function cancelBooking() {
    if (!selectedBooking || !window.confirm("この予約をキャンセルしますか？")) return;

    setIsCancelling(true);
    setMessage(null);
    const { error } = await createClient().rpc("cancel_booking", { p_booking_id: selectedBooking.id });
    setIsCancelling(false);

    if (error) return setMessage(error.message);
    setMessage("予約をキャンセルしました。");
    router.refresh();
  }

  if (selectedBooking) {
    const canCancel = selectedBooking.status === "confirmed" && new Date(selectedBooking.end_at) >= new Date();
    return (
      <section aria-labelledby="learner-booking-detail-title" className="grid gap-5">
        <button className="w-fit text-sm font-semibold text-[#476BC7]" onClick={() => setSelectedBooking(null)} type="button">予約一覧に戻る</button>
        <div className="rounded-2xl border border-[#D9E1F5] bg-white p-5">
          <p className="text-sm font-semibold text-[#6E8FE8]">BOOKING DETAIL</p>
          <h2 className="mt-1 text-xl font-bold text-[#17203D]" id="learner-booking-detail-title">{selectedBooking.listing?.title ?? "サービス"}</h2>
          <p className="mt-3 text-sm font-semibold text-[#F47A6A]">{statusLabels[selectedBooking.status]}</p>
          <dl className="mt-5 grid gap-4 text-sm">
            <div><dt className="text-[#6B7895]">提供者</dt><dd className="mt-1 font-semibold text-[#17203D]">{selectedBooking.provider?.display_name ?? "Provider"}</dd></div>
            <div><dt className="text-[#6B7895]">日時</dt><dd className="mt-1 font-semibold text-[#17203D]">{formatDateTime(selectedBooking.start_at, selectedBooking.end_at)}</dd></div>
            <div><dt className="text-[#6B7895]">参加人数・料金</dt><dd className="mt-1 font-semibold text-[#17203D]">{selectedBooking.party_size}人 / ¥{(selectedBooking.booked_price * selectedBooking.party_size).toLocaleString()}</dd></div>
            {selectedBooking.message ? <div><dt className="text-[#6B7895]">メッセージ</dt><dd className="mt-1 whitespace-pre-wrap text-[#17203D]">{selectedBooking.message}</dd></div> : null}
          </dl>
          {message ? <p aria-live="polite" className="mt-5 text-sm text-[#42506F]">{message}</p> : null}
          {canCancel ? <button className="mt-6 h-11 rounded-xl border border-[#F47A6A] px-4 text-sm font-semibold text-[#C95551] disabled:opacity-60" disabled={isCancelling} onClick={() => void cancelBooking()} type="button">{isCancelling ? "キャンセル中..." : "予約をキャンセルする"}</button> : null}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="learner-bookings-title" className="grid gap-5">
      <div><p className="text-sm font-semibold text-[#6E8FE8]">MY BOOKINGS</p><h2 className="mt-1 text-xl font-bold text-[#17203D]" id="learner-bookings-title">予約</h2></div>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="予約の状態">
        {(["requests", "upcoming", "past"] as const).map((item) => <button aria-selected={tab === item} className={tab === item ? "h-10 rounded-xl bg-[#6E8FE8] px-2 text-sm font-semibold text-white" : "h-10 rounded-xl border border-[#BFCBE8] bg-white px-2 text-sm font-semibold text-[#17203D]"} key={item} onClick={() => setTab(item)} role="tab" type="button">{labels[item]}</button>)}
      </div>
      {visibleBookings.length ? <div className="grid gap-4">{visibleBookings.map((booking) => <article className="rounded-2xl border border-[#D9E1F5] bg-white p-4" key={booking.id}><p className="text-xs font-semibold text-[#F47A6A]">{statusLabels[booking.status]}</p><h3 className="mt-2 text-lg font-bold text-[#17203D]">{booking.listing?.title ?? "サービス"}</h3><p className="mt-1 text-sm text-[#42506F]">{booking.provider?.display_name ?? "Provider"}</p><p className="mt-3 text-sm font-medium text-[#17203D]">{formatDateTime(booking.start_at, booking.end_at)}</p><p className="mt-1 text-sm text-[#42506F]">{booking.party_size}人 / ¥{(booking.booked_price * booking.party_size).toLocaleString()}</p><button className="mt-5 h-10 rounded-xl border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={() => setSelectedBooking(booking)} type="button">予約の詳細を見る</button></article>)}</div> : <div className="rounded-2xl border border-dashed border-[#BFCBE8] bg-[#FFF9ED] px-5 py-8 text-sm leading-7 text-[#42506F]">{tab === "requests" ? "返答待ちの予約リクエストはありません。" : tab === "upcoming" ? "今後の確定済み予約はありません。" : "過去の予約はありません。"}</div>}
    </section>
  );
}
