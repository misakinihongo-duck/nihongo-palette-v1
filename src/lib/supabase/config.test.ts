import { describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "./config";

describe("getSupabaseConfig", () => {
  it("reports unconfigured when Supabase env vars are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(getSupabaseConfig()).toEqual({
      isConfigured: false,
      url: "",
      publishableKey: "",
    });

    vi.unstubAllEnvs();
  });

  it("reports configured when both public env vars are present", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    expect(getSupabaseConfig()).toEqual({
      isConfigured: true,
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });

    vi.unstubAllEnvs();
  });
});
