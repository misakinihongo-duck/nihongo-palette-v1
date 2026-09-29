import { nextConfirmedBooking } from "@/lib/home";
import type { LearnerWorkspaceView } from "@/lib/app-navigation";
import type { LearnerBooking } from "@/lib/learner-bookings";

type LearnerHomeProps = {
  bookings: LearnerBooking[];
  onNavigate: (view: LearnerWorkspaceView) => void;
};

function formatDateTime(startAt: string, endAt: string) {
  const start = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(startAt));
  const end = new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" }).format(new Date(endAt));
  return `${start} - ${end}`;
}

export function LearnerHome({ bookings, onNavigate }: LearnerHomeProps) {
  const upcoming = nextConfirmedBooking(bookings);

  return <section aria-labelledby="learner-home-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">YOUR PALETTE</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="learner-home-title">学んで、体験して、つながる。</h2></div><section className="rounded-2xl border border-[#D9E1F5] bg-white p-5"><p className="text-sm font-semibold text-[#6E8FE8]">次の予定</p>{upcoming ? <><h3 className="mt-3 text-lg font-bold text-[#17203D]">{upcoming.listing?.title ?? "サービス"}</h3><p className="mt-2 text-sm text-[#42506F]">{upcoming.provider?.display_name ?? "Provider"}</p><p className="mt-2 text-sm font-medium text-[#17203D]">{formatDateTime(upcoming.start_at, upcoming.end_at)}</p><div className="mt-5 flex flex-wrap gap-3"><button className="h-10 rounded-xl border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={() => onNavigate("bookings")} type="button">予約の詳細を見る</button><button className="h-10 rounded-xl bg-[#6E8FE8] px-4 text-sm font-semibold text-white" onClick={() => onNavigate("messages")} type="button">メッセージする</button></div></> : <p className="mt-3 text-sm leading-7 text-[#42506F]">まだ予定はありません。</p>}</section><div className="grid gap-3 sm:grid-cols-2"><button className="rounded-2xl border border-[#D9E1F5] bg-[#EAF0FF] p-5 text-left" onClick={() => onNavigate("learn")} type="button"><p className="text-sm font-semibold text-[#476BC7]">LEARN</p><h3 className="mt-2 text-lg font-bold text-[#17203D]">日本語を学ぶ</h3><p className="mt-2 text-sm leading-6 text-[#42506F]">目的に合う先生を探します。</p></button><button className="rounded-2xl border border-[#F6D3AF] bg-[#FFF9ED] p-5 text-left" onClick={() => onNavigate("experience")} type="button"><p className="text-sm font-semibold text-[#C9732D]">EXPERIENCE</p><h3 className="mt-2 text-lg font-bold text-[#17203D]">日本を体験する</h3><p className="mt-2 text-sm leading-6 text-[#42506F]">街・食・文化の時間を探します。</p></button></div></section>;
}
