"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseList,
  validateLearnerBasics,
  validateProviderBasics,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/client";
import type { AppUserProfile, OnboardingStatus } from "@/lib/user-profile";

type Mode = "learner" | "provider";

type OnboardingFlowProps = {
  profile: AppUserProfile;
  status: OnboardingStatus;
};

const learnerThingsToDo = [
  "日本語会話",
  "日本の文化",
  "料理・食文化",
  "街歩き",
  "ローカルとの会話",
  "居酒屋・グルメ",
  "アニメ・マンガ",
  "伝統文化・芸術",
  "ビジネス日本語",
  "旅行で使える日本語",
  "その他",
];

const learnerPeople = [
  "日本語の先生",
  "同世代の日本人",
  "ローカルの人 / 地域の人",
  "同じ趣味の仲間",
  "日本で働く社会人",
  "他の日本語学習者",
  "ホストファミリーのような人",
  "イベントで出会う人",
  "特にこだわりはない",
  "その他",
];

const learnerChallenges = [
  "日本語だけで注文してみたい",
  "日本人と深い会話をしてみたい",
  "日本で一人旅してみたい",
  "日本語で仕事に挑戦したい",
  "日本文化・習慣をもっと知りたい",
  "イベントやコミュニティに参加したい",
  "自分の趣味を通じてつながりたい",
  "日本での生活に慣れたい",
  "特に挑戦したいことはない",
  "その他",
];

const providerRoles = [
  ["teacher", "Japanese Teacher"],
  ["conversation_host", "Conversation Host"],
  ["local_guide", "Local Guide"],
  ["event_host", "Event Host"],
] as const;

const fieldClassName =
  "mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-teal-700";

function ToggleList({
  choices,
  selected,
  onChange,
}: {
  choices: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {choices.map((choice) => {
        const isSelected = selected.includes(choice);
        return (
          <label
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            key={choice}
          >
            <input
              checked={isSelected}
              className="size-4 accent-teal-700"
              onChange={() =>
                onChange(isSelected ? selected.filter((item) => item !== choice) : [...selected, choice])
              }
              type="checkbox"
            />
            <span>{choice}</span>
          </label>
        );
      })}
    </div>
  );
}

function StepHeader({ current, total, title }: { current: number; total: number; title: string }) {
  return (
    <div className="grid gap-2 border-b border-slate-200 pb-4">
      <p className="text-sm font-semibold text-teal-700">
        {current} / {total}
      </p>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-teal-700" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function OnboardingFlow({ profile, status }: OnboardingFlowProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [learnerStep, setLearnerStep] = useState(1);
  const [providerStep, setProviderStep] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [learner, setLearner] = useState({
    age: profile.age?.toString() ?? "",
    bio: profile.bio ?? "",
    challenges: [] as string[],
    japaneseLevel: profile.japanese_level ?? "",
    name: profile.name,
    nickname: profile.nickname ?? "",
    peopleToConnect: [] as string[],
    thingsToDo: [] as string[],
  });
  const [provider, setProvider] = useState({
    area: "",
    bio: "",
    displayName: profile.name,
    experience: "",
    expertise: "",
    languages: "Japanese",
    roles: [] as string[],
    serviceType: "",
    socialUrl: "",
    website: "",
  });

  const learnerAlreadyComplete = status.hasLearnerPreferences;
  const providerAlreadyComplete = status.hasProviderProfile;

  function chooseMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
  }

  function backToMode() {
    setMode(null);
    setMessage(null);
  }

  function nextLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (learnerStep === 1) {
      const error = validateLearnerBasics(learner);
      if (error) return setMessage(error);
    }
    if (learnerStep === 2 && learner.thingsToDo.length === 0) {
      return setMessage("やってみたいことを1つ以上選んでください。");
    }
    if (learnerStep === 3 && learner.peopleToConnect.length === 0) {
      return setMessage("つながりたい人を1つ以上選んでください。");
    }
    if (learnerStep === 4 && learner.challenges.length === 0) {
      return setMessage("挑戦してみたいことを1つ以上選んでください。");
    }
    if (learnerStep === 5 && !learner.japaneseLevel) {
      return setMessage("日本語レベルを1つ選んでください。");
    }

    if (learnerStep === 6) {
      void saveLearner();
    } else {
      setLearnerStep((current) => current + 1);
    }
  }

  async function saveLearner() {
    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error: userError } = await supabase
      .from("users")
      .update({
        age: Number(learner.age),
        bio: learner.bio.trim() || null,
        japanese_level: learner.japaneseLevel,
        last_active_mode: "learner",
        name: learner.name.trim(),
        nickname: learner.nickname.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (userError) {
      setIsPending(false);
      return setMessage(userError.message);
    }

    const { error: preferenceError } = await supabase.from("learner_preferences").upsert(
      {
        challenges: learner.challenges,
        people_to_connect: learner.peopleToConnect,
        things_to_do: learner.thingsToDo,
        updated_at: new Date().toISOString(),
        user_id: profile.id,
      },
      { onConflict: "user_id" },
    );

    setIsPending(false);
    if (preferenceError) return setMessage(preferenceError.message);

    setMessage("Learnerプロフィールを保存しました。");
    router.refresh();
  }

  function nextProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (providerStep === 1 && provider.roles.length === 0) {
      return setMessage("提供したいことを1つ以上選んでください。");
    }
    if (providerStep === 2) {
      const error = validateProviderBasics({
        bio: provider.bio,
        displayName: provider.displayName,
        languages: parseList(provider.languages),
      });
      if (error) return setMessage(error);
    }

    if (providerStep === 4) {
      void saveProvider();
    } else {
      setProviderStep((current) => current + 1);
    }
  }

  async function saveProvider() {
    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error: userError } = await supabase
      .from("users")
      .update({
        last_active_mode: "provider",
        name: provider.displayName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (userError) {
      setIsPending(false);
      return setMessage(userError.message);
    }

    const { error: providerError } = await supabase.from("provider_profiles").upsert(
      {
        area: provider.area.trim() || null,
        bio: provider.bio.trim(),
        display_name: provider.displayName.trim(),
        experience: provider.experience.trim() || null,
        expertise: parseList(provider.expertise),
        languages: parseList(provider.languages),
        roles: provider.roles,
        social_url: provider.socialUrl.trim() || null,
        updated_at: new Date().toISOString(),
        user_id: profile.id,
        website: provider.website.trim() || null,
      },
      { onConflict: "user_id" },
    );

    setIsPending(false);
    if (providerError) return setMessage(providerError.message);

    setMessage("Providerプロフィールを保存しました。次はサービスを作成できます。");
    router.refresh();
  }

  if (learnerAlreadyComplete && providerAlreadyComplete && !mode) {
    return (
      <section className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-teal-700">ONBOARDING COMPLETE</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">LearnerとProviderの準備ができました。</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          次のスプリントで、Providerのサービス作成とLearner向けの一覧画面を追加します。
        </p>
      </section>
    );
  }

  if (!mode) {
    return (
      <section className="border-t border-slate-200 pt-6">
        <p className="text-sm font-semibold text-teal-700">GET STARTED</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">最初に、利用したい方法を選んでください。</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          ひとつのアカウントでLearnerとProviderの両方を利用できます。
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {!learnerAlreadyComplete ? (
            <button
              className="border border-teal-700 bg-teal-700 px-4 py-4 text-left text-white transition hover:bg-teal-800"
              onClick={() => chooseMode("learner")}
              type="button"
            >
              <span className="block text-base font-bold">生徒として利用する</span>
              <span className="mt-1 block text-sm text-teal-50">学びたいことや、出会いたい人を登録します。</span>
            </button>
          ) : null}
          {!providerAlreadyComplete ? (
            <button
              className="border border-slate-900 bg-slate-950 px-4 py-4 text-left text-white transition hover:bg-slate-800"
              onClick={() => chooseMode("provider")}
              type="button"
            >
              <span className="block text-base font-bold">講師・ホストとして利用する</span>
              <span className="mt-1 block text-sm text-slate-200">提供できることとプロフィールを登録します。</span>
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (mode === "learner") {
    return (
      <section className="border-t border-slate-200 pt-6">
        <form className="grid gap-6" onSubmit={nextLearner}>
          {learnerStep === 1 ? (
            <>
              <StepHeader current={1} title="あなたのプロフィールを入力" total={6} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-800">
                  Name
                  <input className={fieldClassName} onChange={(event) => setLearner({ ...learner, name: event.target.value })} required value={learner.name} />
                </label>
                <label className="text-sm font-medium text-slate-800">
                  Nickname
                  <input className={fieldClassName} onChange={(event) => setLearner({ ...learner, nickname: event.target.value })} required value={learner.nickname} />
                </label>
                <label className="text-sm font-medium text-slate-800">
                  Age
                  <input className={fieldClassName} min="1" onChange={(event) => setLearner({ ...learner, age: event.target.value })} required type="number" value={learner.age} />
                </label>
              </div>
            </>
          ) : null}
          {learnerStep === 2 ? (
            <>
              <StepHeader current={2} title="日本でやってみたいこと" total={6} />
              <ToggleList choices={learnerThingsToDo} onChange={(thingsToDo) => setLearner({ ...learner, thingsToDo })} selected={learner.thingsToDo} />
            </>
          ) : null}
          {learnerStep === 3 ? (
            <>
              <StepHeader current={3} title="どんな人とつながりたいか" total={6} />
              <ToggleList choices={learnerPeople} onChange={(peopleToConnect) => setLearner({ ...learner, peopleToConnect })} selected={learner.peopleToConnect} />
            </>
          ) : null}
          {learnerStep === 4 ? (
            <>
              <StepHeader current={4} title="挑戦してみたいこと" total={6} />
              <ToggleList choices={learnerChallenges} onChange={(challenges) => setLearner({ ...learner, challenges })} selected={learner.challenges} />
            </>
          ) : null}
          {learnerStep === 5 ? (
            <>
              <StepHeader current={5} title="日本語レベル" total={6} />
              <div className="grid gap-2">
                {[
                  ["beginner_zero", "まったくの初心者", "はじめて学ぶ"],
                  ["beginner", "初級", "日常の簡単な会話ができる"],
                  ["intermediate", "中級", "ある程度会話ができる"],
                  ["advanced", "上級", "ビジネスや専門的な会話ができる"],
                ].map(([value, label, description]) => (
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3" key={value}>
                    <input checked={learner.japaneseLevel === value} className="mt-1 size-4 accent-teal-700" name="japanese-level" onChange={() => setLearner({ ...learner, japaneseLevel: value })} type="radio" />
                    <span><strong className="block text-sm text-slate-950">{label}</strong><span className="text-sm text-slate-600">{description}</span></span>
                  </label>
                ))}
              </div>
            </>
          ) : null}
          {learnerStep === 6 ? (
            <>
              <StepHeader current={6} title="プロフィール設定" total={6} />
              <p className="text-sm leading-7 text-slate-700">プロフィール写真はあとから設定できます。今は自己紹介を追加するか、そのまま完了できます。</p>
              <label className="text-sm font-medium text-slate-800">
                Bio
                <textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-base outline-none focus:border-teal-700" onChange={(event) => setLearner({ ...learner, bio: event.target.value })} value={learner.bio} />
              </label>
            </>
          ) : null}
          {message ? <p aria-live="polite" className="text-sm text-rose-700">{message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button className="h-11 border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={learnerStep === 1 ? backToMode : () => { setLearnerStep((step) => step - 1); setMessage(null); }} type="button">戻る</button>
            <button className="h-11 bg-teal-700 px-5 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isPending} type="submit">{learnerStep === 6 ? (isPending ? "保存中..." : "完了") : "次へ"}</button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-200 pt-6">
      <form className="grid gap-6" onSubmit={nextProvider}>
        {providerStep === 1 ? (
          <>
            <StepHeader current={1} title="提供したいこと" total={4} />
            <div className="grid gap-2 sm:grid-cols-2">
              {providerRoles.map(([value, label]) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800" key={value}>
                  <input checked={provider.roles.includes(value)} className="size-4 accent-teal-700" onChange={() => setProvider({ ...provider, roles: provider.roles.includes(value) ? provider.roles.filter((role) => role !== value) : [...provider.roles, value] })} type="checkbox" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </>
        ) : null}
        {providerStep === 2 ? (
          <>
            <StepHeader current={2} title="Providerプロフィール" total={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">Display Name<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, displayName: event.target.value })} required value={provider.displayName} /></label>
              <label className="text-sm font-medium text-slate-800">Languages<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, languages: event.target.value })} required value={provider.languages} /><span className="mt-1 block text-xs font-normal text-slate-500">複数ある場合はカンマで区切ります。</span></label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">Activity Area<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, area: event.target.value })} value={provider.area} /></label>
              <label className="text-sm font-medium text-slate-800 sm:col-span-2">Bio<textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-base outline-none focus:border-teal-700" onChange={(event) => setProvider({ ...provider, bio: event.target.value })} required value={provider.bio} /></label>
            </div>
          </>
        ) : null}
        {providerStep === 3 ? (
          <>
            <StepHeader current={3} title="経験・得意分野" total={4} />
            <div className="grid gap-4">
              <label className="text-sm font-medium text-slate-800">Experience / Background<textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-base outline-none focus:border-teal-700" onChange={(event) => setProvider({ ...provider, experience: event.target.value })} value={provider.experience} /></label>
              <label className="text-sm font-medium text-slate-800">Expertise / Themes<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, expertise: event.target.value })} value={provider.expertise} /><span className="mt-1 block text-xs font-normal text-slate-500">複数ある場合はカンマで区切ります。</span></label>
              <label className="text-sm font-medium text-slate-800">Website<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, website: event.target.value })} type="url" value={provider.website} /></label>
              <label className="text-sm font-medium text-slate-800">SNS<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, socialUrl: event.target.value })} type="url" value={provider.socialUrl} /></label>
            </div>
          </>
        ) : null}
        {providerStep === 4 ? (
          <>
            <StepHeader current={4} title="最初のサービス作成" total={4} />
            <p className="text-sm leading-7 text-slate-700">プロフィールを完了したあと、次のステップでサービスを作成できます。最初に作りたい種類を選ぶか、あとで決めてください。</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["日本語レッスンを作る", "体験・イベントを作る", "ローカルガイドを作る", "あとで決める"].map((label) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800" key={label}>
                  <input checked={provider.serviceType === label} className="size-4 accent-teal-700" name="service-type" onChange={() => setProvider({ ...provider, serviceType: label })} type="radio" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </>
        ) : null}
        {message ? <p aria-live="polite" className="text-sm text-rose-700">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button className="h-11 border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={providerStep === 1 ? backToMode : () => { setProviderStep((step) => step - 1); setMessage(null); }} type="button">戻る</button>
          <button className="h-11 bg-slate-950 px-5 text-sm font-semibold text-white disabled:bg-slate-400" disabled={isPending} type="submit">{providerStep === 4 ? (isPending ? "保存中..." : "完了") : "次へ"}</button>
        </div>
      </form>
    </section>
  );
}
