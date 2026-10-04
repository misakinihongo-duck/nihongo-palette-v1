"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthPanelProps = {
  isConfigured: boolean;
};

export function AuthPanel({ isConfigured }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setMessage(error.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google認証を開始できませんでした。");
    } finally {
      setIsPending(false);
    }
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        setMessage(
          signUpError
            ? signUpError.message
            : "確認メールを送信しました。確認後にもう一度ログインしてください。",
        );
      } else {
        window.location.reload();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Emailログインを開始できませんでした。");
    } finally {
      setIsPending(false);
    }
  }

  if (!isConfigured) {
    return (
      <div className="rounded-lg border border-[#F6D3AF] bg-[#FFF9ED] p-5 text-sm leading-7 text-[#42506F]">
        <p className="font-semibold text-[#17203D]">ログインの準備中です</p>
        <p className="mt-2">まもなくNihongo Paletteを始められます。</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="auth-title" className="rounded-lg border border-[#D9E1F5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[#6E8FE8]">WELCOME</p>
          <h2 className="mt-1 text-xl font-bold text-[#17203D]" id="auth-title">Nihongo Paletteをはじめる</h2>
          <p className="mt-2 text-sm leading-6 text-[#42506F]">Googleアカウントで、すぐにあなたのPaletteをつくれます。</p>
        </div>
        <button
          className="h-11 rounded-md bg-[#17203D] px-4 text-sm font-semibold text-white transition hover:bg-[#2C3B65] disabled:cursor-not-allowed disabled:bg-[#A8B5D5]"
          disabled={isPending}
          onClick={signInWithGoogle}
          type="button"
        >
          Googleで続ける
        </button>

        {showEmailForm ? <form className="grid gap-3 border-t border-[#E7ECF8] pt-4" onSubmit={handleEmailAuth}>
          <label className="grid gap-1 text-sm font-medium text-[#17203D]">
            メールアドレス
            <input
              className="h-11 rounded-md border border-[#BFCBE8] px-3 text-base outline-none transition focus:border-[#6E8FE8] focus:ring-2 focus:ring-[#D9E1F5]"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#17203D]">
            パスワード
            <input
              className="h-11 rounded-md border border-[#BFCBE8] px-3 text-base outline-none transition focus:border-[#6E8FE8] focus:ring-2 focus:ring-[#D9E1F5]"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="h-11 rounded-md border border-[#6E8FE8] px-4 text-sm font-semibold text-[#476BC7] transition hover:bg-[#EAF0FF] disabled:cursor-not-allowed disabled:border-[#D9E1F5] disabled:text-[#A8B5D5]"
            disabled={isPending}
            type="submit"
          >
            メールアドレスで続ける
          </button>
        </form> : <button className="w-fit text-sm font-semibold text-[#476BC7] hover:text-[#2F56AE]" disabled={isPending} onClick={() => { setMessage(null); setShowEmailForm(true); }} type="button">メールアドレスで続ける</button>}

        {message ? <p aria-live="polite" className="text-sm leading-6 text-[#42506F]">{message}</p> : null}
      </div>
    </section>
  );
}
