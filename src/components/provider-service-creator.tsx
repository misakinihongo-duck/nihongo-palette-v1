"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { parseList } from "@/lib/onboarding";
import { validateServiceDetails, validateServiceSchedule } from "@/lib/service-form";
import { createClient } from "@/lib/supabase/client";

type ListingType = "lesson" | "experience" | "local_guide";
type ListingStatus = "draft" | "published";

type ProviderServiceCreatorProps = {
  providerProfileId: string;
};

const fieldClassName =
  "mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-teal-700";

const listingTypes: Array<{ description: string; label: string; value: ListingType }> = [
  { value: "lesson", label: "Japanese Lesson", description: "目的に合わせた日本語レッスン" },
  { value: "experience", label: "Experience / Event", description: "文化・食・交流を体験するサービス" },
  { value: "local_guide", label: "Local Guide", description: "地域を知る人と街を歩くサービス" },
];

function StepHeader({ current, title }: { current: number; title: string }) {
  return (
    <div className="grid gap-2 border-b border-slate-200 pb-4">
      <p className="text-sm font-semibold text-teal-700">SERVICE CREATION {current} / 5</p>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-teal-700" style={{ width: `${(current / 5) * 100}%` }} />
      </div>
    </div>
  );
}

export function ProviderServiceCreator({ providerProfileId }: ProviderServiceCreatorProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [service, setService] = useState({
    capacity: "1",
    category: "",
    description: "",
    durationMinutes: "60",
    format: "online" as "online" | "offline",
    languages: "Japanese",
    location: "",
    price: "0",
    targetLevels: [] as string[],
    themes: "",
    title: "",
    type: null as ListingType | null,
  });
  const [schedule, setSchedule] = useState({
    capacity: "1",
    date: "",
    endTime: "",
    startTime: "",
  });

  function goNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (step === 1 && !service.type) return setMessage("サービス種別を1つ選んでください。");
    if (step === 2) {
      if (!service.title.trim()) return setMessage("タイトルを入力してください。");
      if (!service.description.trim()) return setMessage("説明を入力してください。");
      if (parseList(service.languages).length === 0) return setMessage("対応言語を1つ以上入力してください。");
    }
    if (step === 3) {
      const error = validateServiceDetails(service);
      if (error) return setMessage(error);
    }
    if (step === 4) {
      const error = validateServiceSchedule(schedule);
      if (error) return setMessage(error);
    }

    setStep((current) => current + 1);
  }

  async function saveService(status: ListingStatus) {
    if (!service.type) return;
    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        capacity: Number(service.capacity),
        category: service.category.trim() || null,
        description: service.description.trim(),
        duration_minutes: Number(service.durationMinutes),
        format: service.format,
        languages: parseList(service.languages),
        location: service.format === "offline" ? service.location.trim() : null,
        price: Number(service.price),
        provider_profile_id: providerProfileId,
        status,
        target_levels: service.type === "lesson" ? service.targetLevels : null,
        themes: parseList(service.themes),
        title: service.title.trim(),
        type: service.type,
      })
      .select("id")
      .single();

    if (listingError || !listing) {
      setIsPending(false);
      return setMessage(listingError?.message ?? "サービスを保存できませんでした。");
    }

    const startAt = new Date(`${schedule.date}T${schedule.startTime}`).toISOString();
    const endAt = new Date(`${schedule.date}T${schedule.endTime}`).toISOString();
    const { error: scheduleError } = await supabase.from("listing_schedules").insert({
      capacity: Number(schedule.capacity),
      end_at: endAt,
      listing_id: listing.id,
      start_at: startAt,
    });

    setIsPending(false);
    if (scheduleError) return setMessage(scheduleError.message);

    setMessage(status === "published" ? "サービスを公開しました。" : "下書きを保存しました。");
    router.refresh();
  }

  if (message && (message === "サービスを公開しました。" || message === "下書きを保存しました。")) {
    return (
      <section className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-teal-700">SERVICE SAVED</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{message}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">次のサービスも同じ流れで作成できます。</p>
        <button className="mt-5 h-11 bg-slate-950 px-5 text-sm font-semibold text-white" onClick={() => { setMessage(null); setStep(1); }} type="button">新しいサービスを作成</button>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-200 pt-6">
      <form className="grid gap-6" onSubmit={goNext}>
        {step === 1 ? (
          <>
            <StepHeader current={1} title="サービス種別" />
            <div className="grid gap-2">
              {listingTypes.map((listingType) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3" key={listingType.value}>
                  <input checked={service.type === listingType.value} className="mt-1 size-4 accent-teal-700" name="listing-type" onChange={() => setService({ ...service, type: listingType.value })} type="radio" />
                  <span><strong className="block text-sm text-slate-950">{listingType.label}</strong><span className="text-sm text-slate-600">{listingType.description}</span></span>
                </label>
              ))}
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <StepHeader current={2} title="基本情報" />
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-800">Title<input className={fieldClassName} onChange={(event) => setService({ ...service, title: event.target.value })} required value={service.title} /></label>
              <label className="text-sm font-medium text-slate-800">Description<textarea className="mt-1 min-h-32 w-full rounded-md border border-slate-300 bg-white p-3 text-base outline-none focus:border-teal-700" onChange={(event) => setService({ ...service, description: event.target.value })} required value={service.description} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-800">Category<input className={fieldClassName} onChange={(event) => setService({ ...service, category: event.target.value })} value={service.category} /></label>
                <label className="text-sm font-medium text-slate-800">Supported Languages<input className={fieldClassName} onChange={(event) => setService({ ...service, languages: event.target.value })} required value={service.languages} /><span className="mt-1 block text-xs font-normal text-slate-500">複数ある場合はカンマで区切ります。</span></label>
              </div>
              {service.type === "lesson" ? <div><p className="text-sm font-medium text-slate-800">Target Japanese Level</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{["beginner_zero", "beginner", "intermediate", "advanced"].map((level) => <label className="flex items-center gap-2 text-sm text-slate-700" key={level}><input checked={service.targetLevels.includes(level)} className="size-4 accent-teal-700" onChange={() => setService({ ...service, targetLevels: service.targetLevels.includes(level) ? service.targetLevels.filter((item) => item !== level) : [...service.targetLevels, level] })} type="checkbox" />{level}</label>)}</div></div> : null}
            </div>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <StepHeader current={3} title="詳細" />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">Price (JPY)<input className={fieldClassName} min="0" onChange={(event) => setService({ ...service, price: event.target.value })} required type="number" value={service.price} /></label>
              <label className="text-sm font-medium text-slate-800">Duration (minutes)<input className={fieldClassName} min="1" onChange={(event) => setService({ ...service, durationMinutes: event.target.value })} required type="number" value={service.durationMinutes} /></label>
              <label className="text-sm font-medium text-slate-800">Capacity<input className={fieldClassName} min="1" onChange={(event) => setService({ ...service, capacity: event.target.value })} required type="number" value={service.capacity} /></label>
              <label className="text-sm font-medium text-slate-800">Themes<input className={fieldClassName} onChange={(event) => setService({ ...service, themes: event.target.value })} value={service.themes} /><span className="mt-1 block text-xs font-normal text-slate-500">複数ある場合はカンマで区切ります。</span></label>
              <div className="sm:col-span-2"><p className="text-sm font-medium text-slate-800">Format</p><div className="mt-2 flex gap-4"><label className="flex items-center gap-2 text-sm"><input checked={service.format === "online"} className="size-4 accent-teal-700" onChange={() => setService({ ...service, format: "online" })} type="radio" />Online</label><label className="flex items-center gap-2 text-sm"><input checked={service.format === "offline"} className="size-4 accent-teal-700" onChange={() => setService({ ...service, format: "offline" })} type="radio" />Offline</label></div></div>
              {service.format === "offline" ? <label className="text-sm font-medium text-slate-800 sm:col-span-2">Location<input className={fieldClassName} onChange={(event) => setService({ ...service, location: event.target.value })} required value={service.location} /></label> : null}
            </div>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <StepHeader current={4} title="日時枠" />
            <p className="text-sm leading-7 text-slate-700">最初の予約可能な日時を1つ追加します。複数の日時枠は、サービス保存後に追加できます。</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">Date<input className={fieldClassName} onChange={(event) => setSchedule({ ...schedule, date: event.target.value })} required type="date" value={schedule.date} /></label>
              <label className="text-sm font-medium text-slate-800">Capacity<input className={fieldClassName} min="1" onChange={(event) => setSchedule({ ...schedule, capacity: event.target.value })} required type="number" value={schedule.capacity} /></label>
              <label className="text-sm font-medium text-slate-800">Start Time<input className={fieldClassName} onChange={(event) => setSchedule({ ...schedule, startTime: event.target.value })} required type="time" value={schedule.startTime} /></label>
              <label className="text-sm font-medium text-slate-800">End Time<input className={fieldClassName} onChange={(event) => setSchedule({ ...schedule, endTime: event.target.value })} required type="time" value={schedule.endTime} /></label>
            </div>
          </>
        ) : null}
        {step === 5 ? (
          <>
            <StepHeader current={5} title="確認" />
            <dl className="grid gap-3 text-sm leading-6 text-slate-700"><div><dt className="font-semibold text-slate-950">{service.title}</dt><dd>{service.description}</dd></div><div><dt className="font-semibold text-slate-950">形式・料金</dt><dd>{service.format} / ¥{service.price} / {service.durationMinutes}分 / 定員{service.capacity}人</dd></div><div><dt className="font-semibold text-slate-950">日時枠</dt><dd>{schedule.date} {schedule.startTime} - {schedule.endTime}</dd></div></dl>
          </>
        ) : null}
        {message ? <p aria-live="polite" className="text-sm text-rose-700">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          {step > 1 ? <button className="h-11 border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={() => { setStep((current) => current - 1); setMessage(null); }} type="button">戻る</button> : null}
          {step < 5 ? <button className="h-11 bg-teal-700 px-5 text-sm font-semibold text-white" type="submit">次へ</button> : null}
          {step === 5 ? <><button className="h-11 border border-teal-700 px-5 text-sm font-semibold text-teal-800 disabled:border-slate-300 disabled:text-slate-400" disabled={isPending} onClick={() => void saveService("draft")} type="button">{isPending ? "保存中..." : "下書きを保存"}</button><button className="h-11 bg-slate-950 px-5 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isPending} onClick={() => void saveService("published")} type="button">{isPending ? "保存中..." : "公開する"}</button></> : null}
        </div>
      </form>
    </section>
  );
}
