"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseList } from "@/lib/onboarding";
import {
  japaneseLevels,
  providerRoles,
  validateLearnerProfile,
  validateProviderProfile,
} from "@/lib/profile";
import type { AppUserProfile, LearnerPreferences, ProviderProfile } from "@/lib/user-profile";

type ProfilePanelProps = {
  learnerPreferences: LearnerPreferences | null;
  mode: "learner" | "provider";
  onOpenLearner?: () => void;
  onOpenProvider?: () => void;
  profile: AppUserProfile;
  providerProfile: ProviderProfile | null;
};

const fieldClassName = "mt-1 w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#17203D] outline-none focus:border-[#6E8FE8] focus:ring-2 focus:ring-[#D9E1F5]";
const labelClassName = "grid text-sm font-medium text-[#17203D]";

function SummaryField({ children, label }: { children: React.ReactNode; label: string }) {
  return <div><dt className="text-xs font-semibold uppercase text-[#6B7895]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#17203D]">{children || "未設定"}</dd></div>;
}

function CommaHint() {
  return <span className="mt-1 text-xs font-normal text-[#6B7895]">複数入力する場合はカンマで区切ります。</span>;
}

export function ProfilePanel({ learnerPreferences, mode, onOpenLearner, onOpenProvider, profile, providerProfile }: ProfilePanelProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [learner, setLearner] = useState({
    age: profile.age?.toString() ?? "",
    bio: profile.bio ?? "",
    challenges: learnerPreferences?.challenges.join(", ") ?? "",
    japaneseLevel: profile.japanese_level ?? "",
    name: profile.name,
    nickname: profile.nickname ?? "",
    peopleToConnect: learnerPreferences?.people_to_connect.join(", ") ?? "",
    profilePhoto: profile.profile_photo ?? "",
    thingsToDo: learnerPreferences?.things_to_do.join(", ") ?? "",
  });
  const [provider, setProvider] = useState({
    area: providerProfile?.area ?? "",
    bio: providerProfile?.bio ?? "",
    displayName: providerProfile?.display_name ?? profile.name,
    experience: providerProfile?.experience ?? "",
    expertise: providerProfile?.expertise.join(", ") ?? "",
    languages: providerProfile?.languages.join(", ") ?? "",
    profilePhoto: providerProfile?.profile_photo ?? "",
    roles: providerProfile?.roles ?? [],
    socialUrl: providerProfile?.social_url ?? "",
    website: providerProfile?.website ?? "",
  });

  async function saveLearner() {
    const error = validateLearnerProfile(learner);
    if (error) return setMessage(error);

    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error: userError } = await supabase.from("users").update({
      age: Number(learner.age),
      bio: learner.bio.trim() || null,
      japanese_level: learner.japaneseLevel,
      name: learner.name.trim(),
      nickname: learner.nickname.trim(),
      profile_photo: learner.profilePhoto.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);

    if (userError) {
      setIsPending(false);
      return setMessage(userError.message);
    }

    const { error: preferenceError } = await supabase.from("learner_preferences").upsert({
      challenges: parseList(learner.challenges),
      people_to_connect: parseList(learner.peopleToConnect),
      things_to_do: parseList(learner.thingsToDo),
      updated_at: new Date().toISOString(),
      user_id: profile.id,
    }, { onConflict: "user_id" });

    setIsPending(false);
    if (preferenceError) return setMessage(preferenceError.message);
    setIsEditing(false);
    setMessage("プロフィールを保存しました。");
    router.refresh();
  }

  async function saveProvider() {
    const error = validateProviderProfile(provider);
    if (error) return setMessage(error);

    setIsPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error: providerError } = await supabase.from("provider_profiles").upsert({
      area: provider.area.trim() || null,
      bio: provider.bio.trim(),
      display_name: provider.displayName.trim(),
      experience: provider.experience.trim() || null,
      expertise: parseList(provider.expertise),
      languages: parseList(provider.languages),
      profile_photo: provider.profilePhoto.trim() || null,
      roles: provider.roles,
      social_url: provider.socialUrl.trim() || null,
      updated_at: new Date().toISOString(),
      user_id: profile.id,
      website: provider.website.trim() || null,
    }, { onConflict: "user_id" });

    if (providerError) {
      setIsPending(false);
      return setMessage(providerError.message);
    }

    const { error: userError } = await supabase.from("users").update({
      last_active_mode: "provider",
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);

    setIsPending(false);
    if (userError) return setMessage(userError.message);
    setIsEditing(false);
    setMessage(providerProfile ? "Providerプロフィールを保存しました。" : "Providerプロフィールを作成しました。");
    router.refresh();
  }

  async function signOut() {
    setIsPending(true);
    setMessage(null);
    const { error } = await createClient().auth.signOut();
    setIsPending(false);
    if (error) return setMessage(error.message);
    router.refresh();
  }

  if (mode === "learner") {
    return <section aria-labelledby="learner-profile-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">LEARNER PROFILE</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="learner-profile-title">プロフィール</h2></div>{!isEditing ? <><dl className="grid gap-5 rounded-lg border border-[#D9E1F5] bg-white p-5 sm:grid-cols-2"><SummaryField label="プロフィール写真">{profile.profile_photo ? "設定済み" : "未設定"}</SummaryField><SummaryField label="Name">{profile.name}</SummaryField><SummaryField label="Nickname">{profile.nickname}</SummaryField><SummaryField label="Age">{profile.age ? `${profile.age}歳` : ""}</SummaryField><SummaryField label="Bio">{profile.bio}</SummaryField><SummaryField label="Japanese Level">{japaneseLevels.find(([value]) => value === profile.japanese_level)?.[1] ?? ""}</SummaryField><SummaryField label="日本でやってみたいこと">{learnerPreferences?.things_to_do.join("、")}</SummaryField><SummaryField label="つながりたい人">{learnerPreferences?.people_to_connect.join("、")}</SummaryField><SummaryField label="挑戦してみたいこと">{learnerPreferences?.challenges.join("、")}</SummaryField></dl><div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => { setMessage(null); setIsEditing(true); }} type="button">プロフィールを編集</button>{onOpenProvider ? <button className="h-10 rounded-md border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={onOpenProvider} type="button">{providerProfile ? "Provider Modeを見る" : "Providerプロフィールを登録"}</button> : null}<button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => void signOut()} type="button">ログアウト</button></div></> : <form className="grid gap-4 rounded-lg border border-[#D9E1F5] bg-white p-5" onSubmit={(event) => { event.preventDefault(); void saveLearner(); }}><label className={labelClassName}>プロフィール写真 URL<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, profilePhoto: event.target.value })} placeholder="https://..." type="url" value={learner.profilePhoto} /></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Name<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, name: event.target.value })} required value={learner.name} /></label><label className={labelClassName}>Nickname<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, nickname: event.target.value })} required value={learner.nickname} /></label><label className={labelClassName}>Age<input className={fieldClassName} min="1" onChange={(event) => setLearner({ ...learner, age: event.target.value })} required type="number" value={learner.age} /></label><label className={labelClassName}>Japanese Level<select className={fieldClassName} onChange={(event) => setLearner({ ...learner, japaneseLevel: event.target.value })} required value={learner.japaneseLevel}><option value="">選択してください</option>{japaneseLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className={labelClassName}>Bio<textarea className={fieldClassName} onChange={(event) => setLearner({ ...learner, bio: event.target.value })} rows={4} value={learner.bio} /></label><label className={labelClassName}>日本でやってみたいこと<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, thingsToDo: event.target.value })} value={learner.thingsToDo} /><CommaHint /></label><label className={labelClassName}>つながりたい人<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, peopleToConnect: event.target.value })} value={learner.peopleToConnect} /><CommaHint /></label><label className={labelClassName}>挑戦してみたいこと<input className={fieldClassName} onChange={(event) => setLearner({ ...learner, challenges: event.target.value })} value={learner.challenges} /><CommaHint /></label><div className="flex gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isPending} type="submit">{isPending ? "保存中..." : "保存"}</button><button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => { setMessage(null); setIsEditing(false); }} type="button">キャンセル</button></div></form>}{message ? <p aria-live="polite" className="rounded-md bg-[#EAF0FF] px-3 py-2 text-sm text-[#17203D]">{message}</p> : null}</section>;
  }

  return <section aria-labelledby="provider-profile-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">PROVIDER PROFILE</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="provider-profile-title">{providerProfile ? "プロフィール" : "Providerプロフィールを登録"}</h2></div>{providerProfile && !isEditing ? <><dl className="grid gap-5 rounded-lg border border-[#D9E1F5] bg-white p-5 sm:grid-cols-2"><SummaryField label="プロフィール写真">{providerProfile.profile_photo ? "設定済み" : "未設定"}</SummaryField><SummaryField label="Display Name">{providerProfile.display_name}</SummaryField><SummaryField label="Provider Roles">{providerProfile.roles.map((role) => providerRoles.find(([value]) => value === role)?.[1] ?? role).join("、")}</SummaryField><SummaryField label="Languages">{providerProfile.languages.join("、")}</SummaryField><SummaryField label="Activity Area">{providerProfile.area}</SummaryField><SummaryField label="Bio">{providerProfile.bio}</SummaryField><SummaryField label="Experience">{providerProfile.experience}</SummaryField><SummaryField label="Expertise / Themes">{providerProfile.expertise.join("、")}</SummaryField><SummaryField label="Website">{providerProfile.website}</SummaryField><SummaryField label="SNS">{providerProfile.social_url}</SummaryField></dl><div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white" onClick={() => { setMessage(null); setIsEditing(true); }} type="button">プロフィールを編集</button>{onOpenLearner ? <button className="h-10 rounded-md border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={onOpenLearner} type="button">生徒としてNihongo Paletteを見る</button> : null}</div></> : <form className="grid gap-4 rounded-lg border border-[#D9E1F5] bg-white p-5" onSubmit={(event) => { event.preventDefault(); void saveProvider(); }}><label className={labelClassName}>プロフィール写真 URL<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, profilePhoto: event.target.value })} placeholder="https://..." type="url" value={provider.profilePhoto} /></label><label className={labelClassName}>Display Name<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, displayName: event.target.value })} required value={provider.displayName} /></label><fieldset><legend className="text-sm font-medium text-[#17203D]">Provider Roles</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{providerRoles.map(([value, label]) => <label className="flex items-center gap-2 text-sm text-[#17203D]" key={value}><input checked={provider.roles.includes(value)} onChange={() => setProvider({ ...provider, roles: provider.roles.includes(value) ? provider.roles.filter((role) => role !== value) : [...provider.roles, value] })} type="checkbox" />{label}</label>)}</div></fieldset><label className={labelClassName}>Bio<textarea className={fieldClassName} onChange={(event) => setProvider({ ...provider, bio: event.target.value })} required rows={4} value={provider.bio} /></label><label className={labelClassName}>Languages<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, languages: event.target.value })} required value={provider.languages} /><CommaHint /></label><label className={labelClassName}>Activity Area<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, area: event.target.value })} value={provider.area} /></label><label className={labelClassName}>Experience / Background<textarea className={fieldClassName} onChange={(event) => setProvider({ ...provider, experience: event.target.value })} rows={3} value={provider.experience} /></label><label className={labelClassName}>Expertise / Themes<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, expertise: event.target.value })} required value={provider.expertise} /><CommaHint /></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Website<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, website: event.target.value })} placeholder="https://..." type="url" value={provider.website} /></label><label className={labelClassName}>SNS<input className={fieldClassName} onChange={(event) => setProvider({ ...provider, socialUrl: event.target.value })} placeholder="https://..." type="url" value={provider.socialUrl} /></label></div><div className="flex gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isPending} type="submit">{isPending ? "保存中..." : "保存"}</button>{providerProfile ? <button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => { setMessage(null); setIsEditing(false); }} type="button">キャンセル</button> : null}</div></form>}{message ? <p aria-live="polite" className="rounded-md bg-[#EAF0FF] px-3 py-2 text-sm text-[#17203D]">{message}</p> : null}</section>;
}
