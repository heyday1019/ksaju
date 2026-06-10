import posthog from "posthog-js";
import { track as vercelTrack } from "@vercel/analytics";
import { getSupabaseClient } from "./supabase-client";

export type AgeBucket = "<13" | "13-17" | "18-24" | "25-34" | "35+";

export type AnalyticsEvent =
  | "$pageview"
  | "birth_submitted"
  | "idol_selected"
  | "card_generated"
  | "share_clicked"
  | "another_idol_clicked"
  | "partner_submitted"
  | "compat_revealed"
  | "saju_calculated"; // kept temporarily — removed in Task 3

let initialized = false;

/** Initialize PostHog in cookieless/anonymous mode. No-ops without a key. Idempotent. */
export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    persistence: "memory",
    person_profiles: "never",
    capture_pageview: false,
  });
  initialized = true;
}

/** Send an event to all configured sinks. Each sink is independent — never throws into the app. */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  // PostHog (no-op until initAnalytics called with valid key)
  if (initialized) {
    try {
      posthog.capture(event, props);
    } catch { /* analytics must never break the app */ }
  }

  // Vercel Analytics (no-op outside Vercel deployment)
  try {
    vercelTrack(event, props as Record<string, string | number | boolean | null> | undefined);
  } catch { /* analytics must never break the app */ }

  // Supabase (fire-and-forget, no-op when env vars absent)
  try {
    const sb = getSupabaseClient();
    if (sb) {
      void sb.from("analytics_events").insert({ event, props: props ?? null });
    }
  } catch { /* analytics must never break the app */ }
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
