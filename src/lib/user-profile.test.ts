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

  it("creates a profile when an authenticated user does not have one yet", async () => {
    const user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "learner@example.com",
      user_metadata: {},
    };
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: user.id,
          email: user.email,
          name: "learner",
          nickname: null,
          age: null,
          profile_photo: null,
          bio: null,
          japanese_level: null,
          last_active_mode: "learner",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle };
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: vi.fn().mockReturnValue({ ...query, upsert }),
    } as unknown as SupabaseClient;

    const result = await fetchCurrentUserProfile(supabase);

    expect(upsert).toHaveBeenCalledOnce();
    expect(result.profile?.id).toBe(user.id);
    expect(result.error).toBeNull();
  });
});
