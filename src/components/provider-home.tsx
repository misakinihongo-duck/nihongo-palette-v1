import { nextConfirmedBooking } from "@/lib/home";
import type { ConversationSummary } from "@/lib/messaging";
import type { ProviderBooking } from "@/lib/provider-bookings";
import type { ProviderListing } from "@/lib/user-profile";

type ProviderHomeProps = {
  bookings: ProviderBooking[];
  conversations: ConversationSummary[];
  listings: ProviderListing[];
  onNavigate: (view: "services" | "bookings" | "messages") => void;
};

function formatDateTime(startAt: string, endAt: string) {
  const start = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" }).format(new Date(endAt));
  return `${start} - ${end}`;
}

export function ProviderHome({ bookings, conversations, listings, onNavigate }: ProviderHomeProps) {
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const upcoming = nextConfirmedBooking(bookings);
  const unreadCount = conversations.reduce((total, conversation) => total + conversation.unread_count, 0);

  return <section aria-labelledby="provider-home-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">PROVIDER HOME</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="provider-home-title">あなたの得意を、誰かの日本時間に。</h2></div>{pendingCount ? <button className="rounded-2xl border border-[#F6D3AF] bg-[#FFF9ED] p-4 text-left" onClick={() => onNavigate("bookings")} type="button"><p className="text-sm font-semibold text-[#C9732D]">予約リクエスト</p><p className="mt-1 text-sm text-[#17203D]">対応が必要なリクエストが{pendingCount}件あります。</p></button> : null}<div className="grid gap-3 sm:grid-cols-2"><section className="rounded-2xl border border-[#D9E1F5] bg-white p-5"><p className="text-sm font-semibold text-[#6E8FE8]">今後の予定</p>{upcoming ? <><h3 className="mt-3 text-base font-bold text-[#17203D]">{upcoming.listing?.title ?? "サービス"}</h3><p className="mt-2 text-sm text-[#42506F]">{formatDateTime(upcoming.start_at, upcoming.end_at)}</p><button className="mt-4 text-sm font-semibold text-[#476BC7]" onClick={() => onNavigate("bookings")} type="button">予約を見る</button></> : <p className="mt-3 text-sm text-[#42506F]">今後の予定はありません。</p>}</section><section className="rounded-2xl border border-[#D9E1F5] bg-white p-5"><p className="text-sm font-semibold text-[#6E8FE8]">新着メッセージ</p><p className="mt-3 text-sm text-[#42506F]">{unreadCount ? `未読メッセージが${unreadCount}件あります。` : "新しいメッセージはありません。"}</p><button className="mt-4 text-sm font-semibold text-[#476BC7]" onClick={() => onNavigate("messages")} type="button">メッセージを見る</button></section></div><section className="rounded-2xl border border-[#D9E1F5] bg-white p-5"><p className="text-sm font-semibold text-[#6E8FE8]">サービス</p><p className="mt-3 text-sm text-[#42506F]">{listings.length ? `公開・下書きのサービスが${listings.length}件あります。` : "最初のサービスを作成してみましょう。"}</p><button className="mt-4 h-10 rounded-xl bg-[#6E8FE8] px-4 text-sm font-semibold text-white" onClick={() => onNavigate("services")} type="button">サービスを管理する</button></section></section>;
}
