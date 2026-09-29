"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseList } from "@/lib/onboarding";
import { createProfileImagePath, isManagedProfileImage, validateProfileImage } from "@/lib/profile-image";
import { japaneseLevels, providerRoles, validateLearnerProfile, validateProviderProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { AppUserProfile, LearnerPreferences, ProviderProfile } from "@/lib/user-profile";

type Props = {
  learnerPreferences: LearnerPreferences | null;
  mode: "learner" | "provider";
  onOpenLearner?: () => void;
  onOpenProvider?: () => void;
  profile: AppUserProfile;
  providerProfile: ProviderProfile | null;
};

const field = "mt-1 w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#17203D] outline-none focus:border-[#6E8FE8] focus:ring-2 focus:ring-[#D9E1F5]";
const label = "grid text-sm font-medium text-[#17203D]";

function Detail({ label: title, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-xs font-semibold uppercase text-[#6B7895]">{title}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#17203D]">{value || "未設定"}</dd></div>;
}

function ListField({ children, title }: { children: React.ReactNode; title: string }) {
  return <label className={label}>{title}{children}<span className="mt-1 text-xs font-normal text-[#6B7895]">複数入力する場合はカンマで区切ります。</span></label>;
}

export function ProfileWorkspace({ learnerPreferences, mode, onOpenLearner, onOpenProvider, profile, providerProfile }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(!providerProfile && mode === "provider");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [learner, setLearner] = useState({
    age: profile.age?.toString() ?? "",
    bio: profile.bio ?? "",
    challenges: learnerPreferences?.challenges.join(", ") ?? "",
    japaneseLevel: profile.japanese_level ?? "",
    name: profile.name,
    nickname: profile.nickname ?? "",
    thingsToDo: learnerPreferences?.things_to_do.join(", ") ?? "",
    peopleToConnect: learnerPreferences?.people_to_connect.join(", ") ?? "",
  });
  const [provider, setProvider] = useState({
    area: providerProfile?.area ?? "",
    bio: providerProfile?.bio ?? "",
    displayName: providerProfile?.display_name ?? profile.name,
    experience: providerProfile?.experience ?? "",
    expertise: providerProfile?.expertise.join(", ") ?? "",
    languages: providerProfile?.languages.join(", ") ?? "",
    roles: providerProfile?.roles ?? [],
    socialUrl: providerProfile?.social_url ?? "",
    website: providerProfile?.website ?? "",
  });

  async function uploadImage(kind: "learner" | "provider", currentPath: string | null) {
    if (!imageFile) return { path: currentPath, uploadedPath: null };
    const validationError = validateProfileImage(imageFile);
    if (validationError) return { error: validationError, path: currentPath, uploadedPath: null };

    const path = createProfileImagePath(profile.id, kind, imageFile, crypto.randomUUID());
    const { error } = await createClient().storage.from("profile-images").upload(path, imageFile, {
      cacheControl: "3600",
      contentType: imageFile.type,
      upsert: false,
    });
    return error ? { error: error.message, path: currentPath, uploadedPath: null } : { path, uploadedPath: path };
  }

  async function removeImage(path: string | null) {
    if (path && isManagedProfileImage(path, profile.id)) {
      await createClient().storage.from("profile-images").remove([path]);
    }
  }

  async function saveLearner() {
    const validationError = validateLearnerProfile(learner);
    if (validationError) return setMessage(validationError);
    setIsPending(true);
    setMessage(null);
    const image = await uploadImage("learner", profile.profile_photo);
    if (image.error) { setIsPending(false); return setMessage(image.error); }

    const supabase = createClient();
    const { error: userError } = await supabase.from("users").update({
      age: Number(learner.age), bio: learner.bio.trim() || null, japanese_level: learner.japaneseLevel,
      name: learner.name.trim(), nickname: learner.nickname.trim(), profile_photo: image.path,
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    if (userError) { await removeImage(image.uploadedPath); setIsPending(false); return setMessage(userError.message); }

    const { error: preferencesError } = await supabase.from("learner_preferences").upsert({
      challenges: parseList(learner.challenges), people_to_connect: parseList(learner.peopleToConnect),
      things_to_do: parseList(learner.thingsToDo), updated_at: new Date().toISOString(), user_id: profile.id,
    }, { onConflict: "user_id" });
    setIsPending(false);
    if (preferencesError) return setMessage(preferencesError.message);
    if (image.uploadedPath) await removeImage(profile.profile_photo);
    setImageFile(null);
    setEditing(false);
    setMessage("プロフィールを保存しました。");
    router.refresh();
  }

  async function saveProvider() {
    const validationError = validateProviderProfile(provider);
    if (validationError) return setMessage(validationError);
    setIsPending(true);
    setMessage(null);
    const image = await uploadImage("provider", providerProfile?.profile_photo ?? null);
    if (image.error) { setIsPending(false); return setMessage(image.error); }

    const supabase = createClient();
    const { error: providerError } = await supabase.from("provider_profiles").upsert({
      area: provider.area.trim() || null, bio: provider.bio.trim(), display_name: provider.displayName.trim(),
      experience: provider.experience.trim() || null, expertise: parseList(provider.expertise),
      languages: parseList(provider.languages), profile_photo: image.path, roles: provider.roles,
      social_url: provider.socialUrl.trim() || null, updated_at: new Date().toISOString(), user_id: profile.id,
      website: provider.website.trim() || null,
    }, { onConflict: "user_id" });
    if (providerError) { await removeImage(image.uploadedPath); setIsPending(false); return setMessage(providerError.message); }

    const { error: userError } = await supabase.from("users").update({ last_active_mode: "provider", updated_at: new Date().toISOString() }).eq("id", profile.id);
    setIsPending(false);
    if (userError) return setMessage(userError.message);
    if (image.uploadedPath) await removeImage(providerProfile?.profile_photo ?? null);
    setImageFile(null);
    setEditing(false);
    setMessage(providerProfile ? "Providerプロフィールを保存しました。" : "Providerプロフィールを作成しました。");
    router.refresh();
  }

  async function signOut() {
    setIsPending(true);
    const { error } = await createClient().auth.signOut();
    setIsPending(false);
    if (error) return setMessage(error.message);
    router.refresh();
  }

  function imagePicker() {
    return <label className={label}>プロフィール写真<input accept="image/jpeg,image/png,image/webp,image/gif" className={`${field} file:mr-3 file:border-0 file:bg-[#EAF0FF] file:px-2 file:py-1 file:text-sm file:font-semibold file:text-[#476BC7]`} onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setMessage(null); }} type="file" /><span className="mt-1 text-xs font-normal text-[#6B7895]">JPEG、PNG、WebP、GIF形式。5MBまで。</span>{imageFile ? <span className="mt-1 text-xs font-normal text-[#476BC7]">選択中: {imageFile.name}</span> : null}</label>;
  }

  if (mode === "learner") {
    const level = japaneseLevels.find(([value]) => value === profile.japanese_level)?.[1] ?? null;
    return <section aria-labelledby="learner-profile-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">LEARNER PROFILE</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="learner-profile-title">プロフィール</h2></div>{!editing ? <><dl className="grid gap-5 rounded-lg border border-[#D9E1F5] bg-white p-5 sm:grid-cols-2"><Detail label="プロフィール写真" value={profile.profile_photo ? "設定済み" : null} /><Detail label="Name" value={profile.name} /><Detail label="Nickname" value={profile.nickname} /><Detail label="Age" value={profile.age ? `${profile.age}歳` : null} /><Detail label="Bio" value={profile.bio} /><Detail label="Japanese Level" value={level} /><Detail label="日本でやってみたいこと" value={learnerPreferences?.things_to_do.join("、")} /><Detail label="つながりたい人" value={learnerPreferences?.people_to_connect.join("、")} /><Detail label="挑戦してみたいこと" value={learnerPreferences?.challenges.join("、")} /></dl><div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white" onClick={() => { setMessage(null); setEditing(true); }} type="button">プロフィールを編集</button>{onOpenProvider ? <button className="h-10 rounded-md border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={onOpenProvider} type="button">{providerProfile ? "Provider Modeを見る" : "Providerプロフィールを登録"}</button> : null}<button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => void signOut()} type="button">ログアウト</button></div></> : <form className="grid gap-4 rounded-lg border border-[#D9E1F5] bg-white p-5" onSubmit={(event) => { event.preventDefault(); void saveLearner(); }}>{imagePicker()}<div className="grid gap-4 sm:grid-cols-2"><label className={label}>Name<input className={field} onChange={(event) => setLearner({ ...learner, name: event.target.value })} required value={learner.name} /></label><label className={label}>Nickname<input className={field} onChange={(event) => setLearner({ ...learner, nickname: event.target.value })} required value={learner.nickname} /></label><label className={label}>Age<input className={field} min="1" onChange={(event) => setLearner({ ...learner, age: event.target.value })} required type="number" value={learner.age} /></label><label className={label}>Japanese Level<select className={field} onChange={(event) => setLearner({ ...learner, japaneseLevel: event.target.value })} required value={learner.japaneseLevel}><option value="">選択してください</option>{japaneseLevels.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label></div><label className={label}>Bio<textarea className={field} onChange={(event) => setLearner({ ...learner, bio: event.target.value })} rows={4} value={learner.bio} /></label><ListField title="日本でやってみたいこと"><input className={field} onChange={(event) => setLearner({ ...learner, thingsToDo: event.target.value })} value={learner.thingsToDo} /></ListField><ListField title="つながりたい人"><input className={field} onChange={(event) => setLearner({ ...learner, peopleToConnect: event.target.value })} value={learner.peopleToConnect} /></ListField><ListField title="挑戦してみたいこと"><input className={field} onChange={(event) => setLearner({ ...learner, challenges: event.target.value })} value={learner.challenges} /></ListField><div className="flex gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isPending} type="submit">{isPending ? "保存中..." : "保存"}</button><button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => { setImageFile(null); setMessage(null); setEditing(false); }} type="button">キャンセル</button></div></form>}{message ? <p aria-live="polite" className="rounded-md bg-[#EAF0FF] px-3 py-2 text-sm text-[#17203D]">{message}</p> : null}</section>;
  }

  const providerEditing = editing || !providerProfile;
  return <section aria-labelledby="provider-profile-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">PROVIDER PROFILE</p><h2 className="mt-1 text-2xl font-bold text-[#17203D]" id="provider-profile-title">{providerProfile ? "プロフィール" : "Providerプロフィールを登録"}</h2></div>{!providerEditing && providerProfile ? <><dl className="grid gap-5 rounded-lg border border-[#D9E1F5] bg-white p-5 sm:grid-cols-2"><Detail label="プロフィール写真" value={providerProfile.profile_photo ? "設定済み" : null} /><Detail label="Display Name" value={providerProfile.display_name} /><Detail label="Provider Roles" value={providerProfile.roles.map((role) => providerRoles.find(([value]) => value === role)?.[1] ?? role).join("、")} /><Detail label="Languages" value={providerProfile.languages.join("、")} /><Detail label="Activity Area" value={providerProfile.area} /><Detail label="Bio" value={providerProfile.bio} /><Detail label="Experience" value={providerProfile.experience} /><Detail label="Expertise / Themes" value={providerProfile.expertise.join("、")} /><Detail label="Website" value={providerProfile.website} /><Detail label="SNS" value={providerProfile.social_url} /></dl><div className="flex flex-wrap gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white" onClick={() => { setMessage(null); setEditing(true); }} type="button">プロフィールを編集</button>{onOpenLearner ? <button className="h-10 rounded-md border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7]" onClick={onOpenLearner} type="button">生徒としてNihongo Paletteを見る</button> : null}</div></> : <form className="grid gap-4 rounded-lg border border-[#D9E1F5] bg-white p-5" onSubmit={(event) => { event.preventDefault(); void saveProvider(); }}>{imagePicker()}<label className={label}>Display Name<input className={field} onChange={(event) => setProvider({ ...provider, displayName: event.target.value })} required value={provider.displayName} /></label><fieldset><legend className="text-sm font-medium text-[#17203D]">Provider Roles</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{providerRoles.map(([value, title]) => <label className="flex items-center gap-2 text-sm text-[#17203D]" key={value}><input checked={provider.roles.includes(value)} onChange={() => setProvider({ ...provider, roles: provider.roles.includes(value) ? provider.roles.filter((role) => role !== value) : [...provider.roles, value] })} type="checkbox" />{title}</label>)}</div></fieldset><label className={label}>Bio<textarea className={field} onChange={(event) => setProvider({ ...provider, bio: event.target.value })} required rows={4} value={provider.bio} /></label><ListField title="Languages"><input className={field} onChange={(event) => setProvider({ ...provider, languages: event.target.value })} required value={provider.languages} /></ListField><label className={label}>Activity Area<input className={field} onChange={(event) => setProvider({ ...provider, area: event.target.value })} value={provider.area} /></label><label className={label}>Experience / Background<textarea className={field} onChange={(event) => setProvider({ ...provider, experience: event.target.value })} rows={3} value={provider.experience} /></label><ListField title="Expertise / Themes"><input className={field} onChange={(event) => setProvider({ ...provider, expertise: event.target.value })} required value={provider.expertise} /></ListField><div className="grid gap-4 sm:grid-cols-2"><label className={label}>Website<input className={field} onChange={(event) => setProvider({ ...provider, website: event.target.value })} placeholder="https://..." type="url" value={provider.website} /></label><label className={label}>SNS<input className={field} onChange={(event) => setProvider({ ...provider, socialUrl: event.target.value })} placeholder="https://..." type="url" value={provider.socialUrl} /></label></div><div className="flex gap-3"><button className="h-10 rounded-md bg-[#6E8FE8] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={isPending} type="submit">{isPending ? "保存中..." : "保存"}</button>{providerProfile ? <button className="h-10 rounded-md border border-[#CBD5E1] px-4 text-sm font-semibold text-[#42506F]" disabled={isPending} onClick={() => { setImageFile(null); setMessage(null); setEditing(false); }} type="button">キャンセル</button> : null}</div></form>}{message ? <p aria-live="polite" className="rounded-md bg-[#EAF0FF] px-3 py-2 text-sm text-[#17203D]">{message}</p> : null}</section>;
}
