import posthog from "posthog-js";

export type AgeBucket = "<13" | "13-17" | "18-24" | "25-34" | "35+";

export type AnalyticsEvent =
  | "$pageview"
  | "saju_calculated"
  | "idol_picked"
  | "partner_submitted"
  | "compat_revealed"
  | "card_shared";

let initialized = false;

/** Initialize PostHog in cookieless/anonymous mode. No-ops without a key. Idempotent. */
export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    persistence: "memory", // cookieless — no consent banner needed
    person_profiles: "never", // anonymous events only
    capture_pageview: false, // captured manually on route change
  });
  initialized = true;
}

/** Send an event. No-ops until initialized; never throws into the app. */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    posthog.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}

/** Coarse age bucket from birth year (no raw DOB ever leaves the client). */
export function ageBucket(birthYear: number): AgeBucket {
  const age = new Date().getFullYear() - birthYear;
  if (age < 13) return "<13";
  if (age <= 17) return "13-17";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  return "35+";
}

/** Coarse compatibility score bucket. */
export function scoreBucket(score: number): string {
  if (score < 40) return "0-39";
  if (score < 60) return "40-59";
  if (score < 80) return "60-79";
  return "80-100";
}
