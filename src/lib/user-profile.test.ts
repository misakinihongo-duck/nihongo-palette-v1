import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { fetchCurrentUserProfile } from "./user-profile";

describe("fetchCurrentUserProfile", () => {
  it("does not treat a missing session as an application error", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Auth session missing!"),
        }),
      },
    } as unknown as SupabaseClient;

    await expect(fetchCurrentUserProfile(supabase)).resolves.toEqual({
      user: null,
      profile: null,
      error: null,
    });
  });
});
