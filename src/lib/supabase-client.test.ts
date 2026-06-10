// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ supabase: "mock-client" }));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  createBrowserClientMock.mockClear();
});

describe("getSupabaseClient", () => {
  it("returns null when env vars are absent", async () => {
    const { getSupabaseClient } = await import("./supabase-client");
    expect(getSupabaseClient()).toBeNull();
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });

  it("returns a client when env vars are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const { getSupabaseClient } = await import("./supabase-client");
    const client = getSupabaseClient();
    expect(client).not.toBeNull();
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
    );
  });

  it("returns the same instance on repeated calls (singleton)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const { getSupabaseClient } = await import("./supabase-client");
    const a = getSupabaseClient();
    const b = getSupabaseClient();
    expect(a).toBe(b);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
  });
});
