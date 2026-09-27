import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserProfile } from "@/lib/user-profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await upsertUserProfile(supabase, user);
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
