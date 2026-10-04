"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}
