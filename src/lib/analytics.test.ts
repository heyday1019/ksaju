// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock declarations (hoisted by vitest) ──────────────────────────────────
const init = vi.fn();
const capture = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    init: (...a: unknown[]) => init(...a),
    capture: (...a: unknown[]) => capture(...a),
  },
}));

const vercelTrackMock = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...a: unknown[]) => vercelTrackMock(...a),
}));

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
const fromMock = vi.fn(() => ({ insert: insertMock }));
const sbClientMock = { from: fromMock };
const getSupabaseClientMock = vi.fn(() => sbClientMock as unknown);
vi.mock("./supabase-client", () => ({
  getSupabaseClient: () => getSupabaseClientMock(),
}));
// ──────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  init.mockClear();
  capture.mockClear();
  vercelTrackMock.mockClear();
  fromMock.mockClear();
  insertMock.mockClear();
  getSupabaseClientMock.mockClear();
  getSupabaseClientMock.mockReturnValue(sbClientMock);
});

describe("ageBucket", () => {
  it("buckets ages by birth year", async () => {
    const { ageBucket } = await import("./analytics");
    const y = new Date().getFullYear();
    expect(ageBucket(y - 12)).toBe("<13");
    expect(ageBucket(y - 13)).toBe("13-17");
    expect(ageBucket(y - 17)).toBe("13-17");
    expect(ageBucket(y - 18)).toBe("18-24");
    expect(ageBucket(y - 24)).toBe("18-24");
    expect(ageBucket(y - 25)).toBe("25-34");
    expect(ageBucket(y - 34)).toBe("25-34");
    expect(ageBucket(y - 35)).toBe("35+");
  });
});

describe("scoreBucket", () => {
  it("buckets a 0-100 score", async () => {
    const { scoreBucket } = await import("./analytics");
    expect(scoreBucket(0)).toBe("0-39");
    expect(scoreBucket(39)).toBe("0-39");
    expect(scoreBucket(40)).toBe("40-59");
    expect(scoreBucket(60)).toBe("60-79");
    expect(scoreBucket(80)).toBe("80-100");
    expect(scoreBucket(100)).toBe("80-100");
  });
});

describe("init/track gating", () => {
  it("no-ops posthog init and capture when no key is set", async () => {
    const mod = await import("./analytics");
    mod.initAnalytics();
    mod.track("$pageview");
    expect(init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("inits cookieless and captures to posthog when a key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const mod = await import("./analytics");
    mod.initAnalytics();
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ persistence: "memory", person_profiles: "never" }),
    );
    mod.track("$pageview", { age_bucket: "18-24" });
    expect(capture).toHaveBeenCalledWith("$pageview", { age_bucket: "18-24" });
  });
});

describe("multi-sink track()", () => {
  it("calls Vercel and Supabase regardless of PostHog init state", async () => {
    const mod = await import("./analytics");
    // PostHog not initialized (no key)
    mod.track("birth_submitted", { has_time: false });
    expect(capture).not.toHaveBeenCalled();
    expect(vercelTrackMock).toHaveBeenCalledWith("birth_submitted", { has_time: false });
    expect(fromMock).toHaveBeenCalledWith("analytics_events");
    expect(insertMock).toHaveBeenCalledWith({
      event: "birth_submitted",
      props: { has_time: false },
    });
  });

  it("calls all 3 sinks when PostHog key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const mod = await import("./analytics");
    mod.initAnalytics();
    mod.track("idol_selected", { idol_name: "RM", group: "BTS" });
    expect(capture).toHaveBeenCalledWith("idol_selected", { idol_name: "RM", group: "BTS" });
    expect(vercelTrackMock).toHaveBeenCalledWith("idol_selected", {
      idol_name: "RM",
      group: "BTS",
    });
    expect(fromMock).toHaveBeenCalledWith("analytics_events");
  });

  it("Supabase no-ops when getSupabaseClient returns null", async () => {
    getSupabaseClientMock.mockReturnValueOnce(null);
    const mod = await import("./analytics");
    mod.track("card_generated", { idol_name: "Jennie", score: 80 });
    expect(vercelTrackMock).toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("Supabase insert uses null props when props are undefined", async () => {
    const mod = await import("./analytics");
    mod.track("another_idol_clicked");
    expect(insertMock).toHaveBeenCalledWith({
      event: "another_idol_clicked",
      props: null,
    });
  });
});
