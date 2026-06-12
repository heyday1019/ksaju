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
  | "compat_revealed";

let initialized = false;
let currentLocale: string | undefined;

/** Store the active locale so track() can attach it to every event automatically. */
export function setCurrentLocale(locale: string): void {
  currentLocale = locale;
}

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

  // Automatically attach locale to every event when available
  const merged: Record<string, unknown> | undefined = currentLocale
    ? { locale: currentLocale, ...props }
    : props;

  // PostHog (no-op until initAnalytics called with valid key)
  if (initialized) {
    try {
      posthog.capture(event, merged);
    } catch { /* analytics must never break the app */ }
  }

  // Vercel Analytics (no-op outside Vercel deployment)
  try {
    vercelTrack(event, merged as Record<string, string | number | boolean | null> | undefined);
  } catch { /* analytics must never break the app */ }

  // Supabase (fire-and-forget, no-op when env vars absent)
  try {
    const sb = getSupabaseClient();
    if (sb) {
      sb.from("analytics_events")
        .insert({ event, props: merged ?? null })
        .then(({ error }) => {
          if (error) console.error("[analytics] Supabase insert failed:", error.message, error.details);
        });
    } else {
      console.warn("[analytics] Supabase client unavailable — check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
  } catch (e) { console.error("[analytics] Supabase unexpected error:", e); }
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
