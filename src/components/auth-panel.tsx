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
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Supabase環境変数が未設定です</p>
        <p className="mt-2">
          `.env.local`に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`を設定すると、
          Google認証とEmail/Password確認を開始できます。
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <button
          className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          onClick={signInWithGoogle}
          type="button"
        >
          Googleで続ける
        </button>

        <form className="grid gap-3" onSubmit={handleEmailAuth}>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-teal-600"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-teal-600"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="h-11 rounded-md border border-teal-700 px-4 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            disabled={isPending}
            type="submit"
          >
            Emailで接続確認
          </button>
        </form>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </section>
  );
}
