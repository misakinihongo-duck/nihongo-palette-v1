"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { filterProviderBookings, type ProviderBooking } from "@/lib/provider-bookings";
import { createClient } from "@/lib/supabase/client";

type ProviderBookingManagerProps = { bookings: ProviderBooking[] };
type Tab = "pending" | "confirmed" | "past";

const labels: Record<Tab, string> = { confirmed: "確定済み", past: "過去", pending: "リクエスト" };

function formatDateTime(startAt: string, endAt: string) {
  const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" }).format(new Date(endAt));
  return `${date} - ${end}`;
}

export function ProviderBookingManager({ bookings }: ProviderBookingManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const visibleBookings = filterProviderBookings(bookings, tab);

  async function respond(bookingId: string, status: "confirmed" | "rejected") {
    setMessage(null);
    setProcessingId(bookingId);
    const { error } = await createClient().rpc("respond_to_booking_request", {
      p_booking_id: bookingId,
      p_status: status,
    });
    setProcessingId(null);

    if (error) return setMessage(error.message);
    setMessage(status === "confirmed" ? "予約を承認しました。" : "予約リクエストをお断りしました。");
    router.refresh();
  }

  return <section aria-labelledby="provider-bookings-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">BOOKINGS</p><h2 className="mt-1 text-xl font-bold text-[#17203D]" id="provider-bookings-title">予約管理</h2></div><div className="grid grid-cols-3 gap-2" role="tablist" aria-label="予約の状態">{(["pending", "confirmed", "past"] as const).map((item) => <button aria-selected={tab === item} className={tab === item ? "h-10 rounded-xl bg-[#6E8FE8] px-2 text-sm font-semibold text-white" : "h-10 rounded-xl border border-[#BFCBE8] bg-white px-2 text-sm font-semibold text-[#17203D]"} key={item} onClick={() => setTab(item)} role="tab" type="button">{labels[item]}</button>)}</div>{message ? <p aria-live="polite" className="text-sm text-[#42506F]">{message}</p> : null}{visibleBookings.length ? <div className="grid gap-4">{visibleBookings.map((booking) => <article className="rounded-2xl border border-[#D9E1F5] bg-white p-4" key={booking.id}><p className="text-xs font-semibold text-[#F47A6A]">{tab === "pending" ? "要対応" : labels[tab]}</p><h3 className="mt-2 text-lg font-bold text-[#17203D]">{booking.listing?.title ?? "サービス"}</h3><p className="mt-1 text-sm text-[#42506F]">{booking.learner?.nickname || booking.learner?.name || "Learner"} / {booking.party_size}人</p><p className="mt-3 text-sm font-medium text-[#17203D]">{formatDateTime(booking.start_at, booking.end_at)}</p><p className="mt-1 text-sm text-[#42506F]">¥{booking.booked_price.toLocaleString()} / 人</p>{booking.message ? <p className="mt-4 border-l-2 border-[#F6A65D] pl-3 text-sm leading-6 text-[#42506F]">{booking.message}</p> : null}{tab === "pending" ? <div className="mt-5 flex flex-wrap gap-3"><button className="h-11 rounded-xl bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={processingId === booking.id} onClick={() => void respond(booking.id, "confirmed")} type="button">{processingId === booking.id ? "処理中..." : "承認する"}</button><button className="h-11 rounded-xl border border-[#F47A6A] px-4 text-sm font-semibold text-[#C95551] disabled:opacity-60" disabled={processingId === booking.id} onClick={() => void respond(booking.id, "rejected")} type="button">今回は断る</button></div> : null}</article>)}</div> : <div className="rounded-2xl border border-dashed border-[#BFCBE8] bg-[#FFF9ED] px-5 py-8 text-sm leading-7 text-[#42506F]">{tab === "pending" ? "新しい予約リクエストはありません。" : tab === "confirmed" ? "今後の確定済み予約はありません。" : "過去の予約はありません。"}</div>}</section>;
}
