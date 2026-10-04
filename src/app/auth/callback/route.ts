import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserProfile } from "@/lib/user-profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";

  if (!code) {
    return redirectToAuthError(requestUrl);
  }

  const supabase = await createClient();

  if (!supabase) {
    return redirectToAuthError(requestUrl);
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return redirectToAuthError(requestUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToAuthError(requestUrl);
  }

  const { error: profileError } = await upsertUserProfile(supabase, user);

  if (profileError) {
    return redirectToAuthError(requestUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function redirectToAuthError(requestUrl: URL) {
  const redirectUrl = new URL("/", requestUrl.origin);
  redirectUrl.searchParams.set("auth_error", "1");
  return NextResponse.redirect(redirectUrl);
}
