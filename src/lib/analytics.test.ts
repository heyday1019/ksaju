// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

const init = vi.fn();
const capture = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    init: (...a: unknown[]) => init(...a),
    capture: (...a: unknown[]) => capture(...a),
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  init.mockClear();
  capture.mockClear();
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
  it("no-ops init and track when no key is set", async () => {
    const mod = await import("./analytics");
    mod.initAnalytics();
    mod.track("$pageview");
    expect(init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("inits cookieless and captures events when a key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    const mod = await import("./analytics");
    mod.initAnalytics();
    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ persistence: "memory", person_profiles: "never" }),
    );
    mod.track("saju_calculated", { age_bucket: "18-24" });
    expect(capture).toHaveBeenCalledWith("saju_calculated", { age_bucket: "18-24" });
  });
});
