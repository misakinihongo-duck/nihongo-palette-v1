"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notificationMessage, type AppNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

type NotificationListProps = { notifications: AppNotification[] };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function markAsRead(notification: AppNotification) {
    if (notification.read_at) return;
    setProcessingId(notification.id);
    setMessage(null);
    const { error } = await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notification.id);
    setProcessingId(null);
    if (error) return setMessage(error.message);
    router.refresh();
  }

  return <section aria-labelledby="notifications-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">NOTIFICATIONS</p><h2 className="mt-1 text-xl font-bold text-[#17203D]" id="notifications-title">お知らせ</h2></div>{message ? <p aria-live="polite" className="text-sm text-[#C95551]">{message}</p> : null}{notifications.length ? <div className="grid gap-3">{notifications.map((notification) => <article className={notification.read_at ? "rounded-2xl border border-[#D9E1F5] bg-white p-4" : "rounded-2xl border border-[#BFCBE8] bg-[#EAF0FF] p-4"} key={notification.id}><p className="text-sm font-semibold text-[#17203D]">{notificationMessage(notification)}</p><p className="mt-2 text-xs text-[#6B7895]">{formatDateTime(notification.created_at)}</p>{notification.read_at ? <p className="mt-3 text-xs text-[#6B7895]">確認済み</p> : <button className="mt-3 h-9 rounded-xl border border-[#6E8FE8] px-3 text-sm font-semibold text-[#476BC7] disabled:opacity-60" disabled={processingId === notification.id} onClick={() => void markAsRead(notification)} type="button">{processingId === notification.id ? "更新中..." : "確認する"}</button>}</article>)}</div> : <div className="rounded-2xl border border-dashed border-[#BFCBE8] bg-[#FFF9ED] px-5 py-8 text-sm leading-7 text-[#42506F]">新しいお知らせはありません。</div>}</section>;
}
