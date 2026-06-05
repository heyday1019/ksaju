# Product Analytics (PostHog, cookieless) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure traffic + funnel (birth → idol pick → card reveal → share) with hosted PostHog in cookieless/anonymous mode — no custom dashboard, no auth — wired through a no-op-without-key analytics wrapper, plus a `/privacy` page.

**Architecture:** A thin `src/lib/analytics.ts` wrapper (init/track/ageBucket/scoreBucket) hides `posthog-js`, no-ops unless `NEXT_PUBLIC_POSTHOG_KEY` is set, and runs cookieless (`persistence: "memory"`, `person_profiles: "never"`). A client `AnalyticsProvider` in the root layout inits it and captures SPA pageviews. Call sites fire 5 product events. The share helper reports which delivery path it took so `card_shared` can record the method.

**Tech Stack:** Next.js 16 App Router, `posthog-js`, TypeScript, vitest (+happy-dom for window).

**Spec:** `docs/superpowers/specs/2026-06-05-analytics-posthog-design.md`

---

## File Structure

- `src/lib/analytics.ts` (create) — wrapper: `initAnalytics`, `track`, `ageBucket`, `scoreBucket`, `AnalyticsEvent`/`AgeBucket` types.
- `src/lib/analytics.test.ts` (create) — wrapper unit tests.
- `src/components/analytics/analytics-provider.tsx` (create) — client init + pageview.
- `src/lib/share-image.ts` (modify) — `shareOrDownloadPng` returns a `ShareOutcome`.
- `src/lib/share-image.test.ts` (modify) — assert outcomes.
- `src/hooks/use-share-image.ts` (modify) — `onShared` callback.
- `src/components/compat/compatibility-modal.tsx` (modify) — forward `onShared`.
- `src/app/layout.tsx` (modify) — mount `AnalyticsProvider` + `SiteFooter`.
- `src/app/page.tsx`, `src/components/inyeon/inyeon-view.tsx` (modify) — `saju_calculated`.
- `src/components/compat/compatibility-section.tsx` (modify) — `idol_picked` + `compat_revealed` + `card_shared`.
- `src/components/compat/partner-compat-section.tsx` (modify) — `partner_submitted` + `compat_revealed` + `card_shared`.
- `src/app/privacy/page.tsx` (create) — Privacy Policy.
- `src/components/layout/site-footer.tsx` (create) — slim footer w/ Privacy link.
- `.env.example` (create), `docs/deploy-runbook.md` (modify) — config docs.

---

## Task 1: Add posthog-js dependency

**Files:** Modify `package.json`

- [ ] **Step 1: Install**

Run: `npm install posthog-js`
Expected: `dependencies` gains `posthog-js`, lockfile updates, no peer errors.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npm test`
Expected: PASS (146, unchanged).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add posthog-js for product analytics"
```

---

## Task 2: Analytics wrapper (`analytics.ts`)

**Files:**
- Create: `src/lib/analytics.ts`
- Test: `src/lib/analytics.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/analytics.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/analytics.test.ts`
Expected: FAIL — `./analytics` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/analytics.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/analytics.test.ts`
Expected: PASS (4 cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): cookieless PostHog wrapper (no-op without key)"
```

---

## Task 3: AnalyticsProvider (init + pageviews)

**Files:**
- Create: `src/components/analytics/analytics-provider.tsx`
- Modify: `src/app/layout.tsx`

> No unit test — it's a thin effect wrapper over the tested `analytics.ts`. Verified by build + the no-op gate (keyless build/run must stay green) in Task 8.

- [ ] **Step 1: Create the provider**

Create `src/components/analytics/analytics-provider.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, track } from "@/lib/analytics";

/** Initializes analytics once and captures a pageview on each route change. Renders nothing. */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    track("$pageview", { pathname });
  }, [pathname]);

  return null;
}
```

- [ ] **Step 2: Mount it in the layout**

In `src/app/layout.tsx`, add the import near the other component imports:
```tsx
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
```
Then inside the content column, immediately after `<SiteHeader />`:
```tsx
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <AnalyticsProvider />
              <div className="flex flex-1 flex-col">{children}</div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/analytics-provider.tsx src/app/layout.tsx
git commit -m "feat(analytics): AnalyticsProvider — init + SPA pageviews"
```

---

## Task 4: Share helper reports its delivery method

**Files:**
- Modify: `src/lib/share-image.ts`
- Modify: `src/lib/share-image.test.ts`
- Modify: `src/hooks/use-share-image.ts`
- Modify: `src/components/compat/compatibility-modal.tsx`

- [ ] **Step 1: Update the share-image tests to assert outcomes**

In `src/lib/share-image.test.ts`, replace the three `shareOrDownloadPng` cases' bodies to assert the return value. Replace:
```ts
    await shareOrDownloadPng(PNG, "ksaju.png", { title: "T" });
    expect(share).toHaveBeenCalledTimes(1);
```
with:
```ts
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png", { title: "T" });
    expect(outcome).toBe("web_share");
    expect(share).toHaveBeenCalledTimes(1);
```
In the AbortError case, replace:
```ts
    await shareOrDownloadPng(PNG, "ksaju.png");
    expect(click).not.toHaveBeenCalled();
```
with:
```ts
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png");
    expect(outcome).toBe("cancelled");
    expect(click).not.toHaveBeenCalled();
```
In the fallback case, replace:
```ts
    await shareOrDownloadPng(PNG, "ksaju.png");
    expect(click).toHaveBeenCalledTimes(1);
```
with:
```ts
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png");
    expect(outcome).toBe("download");
    expect(click).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/share-image.test.ts`
Expected: FAIL — `shareOrDownloadPng` currently returns `void` (outcomes are `undefined`).

- [ ] **Step 3: Update `shareOrDownloadPng` to return a `ShareOutcome`**

In `src/lib/share-image.ts`, add the type and change the function. Add after the `ShareMeta` type:
```ts
/** Which delivery path the share took. "cancelled" = user dismissed the share sheet. */
export type ShareOutcome = "web_share" | "download" | "cancelled";
```
Replace the whole `shareOrDownloadPng` function with:
```ts
export async function shareOrDownloadPng(
  blob: Blob,
  fileName: string,
  shareMeta: ShareMeta = {},
): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: "image/png" });

  if (canShareFiles(file) && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], ...shareMeta });
      return "web_share";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      // Any other share failure → fall through to download.
    }
  }
  downloadBlob(blob, fileName);
  return "download";
}
```

- [ ] **Step 4: Run share-image tests**

Run: `npx vitest run src/lib/share-image.test.ts`
Expected: PASS (7 cases).

- [ ] **Step 5: Add `onShared` to the hook**

In `src/hooks/use-share-image.ts`, update the import and the hook. Change the import line to:
```ts
import {
  nodeToPngBlob,
  shareOrDownloadPng,
  type ShareMeta,
  type ShareOutcome,
} from "@/lib/share-image";
```
Change the opts type and body. Replace:
```ts
export function useShareImage(
  ref: RefObject<HTMLElement | null>,
  opts: { fileName: string; shareMeta?: ShareMeta; pixelRatio?: number },
) {
  const { fileName, shareMeta, pixelRatio } = opts;
  const [status, setStatus] = useState<ShareStatus>("idle");

  const share = useCallback(async () => {
    const node = ref.current;
    if (!node) return;
    setStatus("rendering");
    try {
      const blob = await nodeToPngBlob(node, { pixelRatio });
      await shareOrDownloadPng(blob, fileName, shareMeta);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [ref, fileName, shareMeta, pixelRatio]);

  return { share, status };
}
```
with:
```ts
export function useShareImage(
  ref: RefObject<HTMLElement | null>,
  opts: {
    fileName: string;
    shareMeta?: ShareMeta;
    pixelRatio?: number;
    onShared?: (method: Exclude<ShareOutcome, "cancelled">) => void;
  },
) {
  const { fileName, shareMeta, pixelRatio, onShared } = opts;
  const [status, setStatus] = useState<ShareStatus>("idle");

  const share = useCallback(async () => {
    const node = ref.current;
    if (!node) return;
    setStatus("rendering");
    try {
      const blob = await nodeToPngBlob(node, { pixelRatio });
      const outcome = await shareOrDownloadPng(blob, fileName, shareMeta);
      setStatus("idle");
      if (outcome !== "cancelled") onShared?.(outcome);
    } catch {
      setStatus("error");
    }
  }, [ref, fileName, shareMeta, pixelRatio, onShared]);

  return { share, status };
}
```

- [ ] **Step 6: Forward `onShared` through the modal**

In `src/components/compat/compatibility-modal.tsx`, add `onShared` to the props type:
```ts
type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
  onShared?: (method: "web_share" | "download") => void;
};
```
Destructure it in the function signature (add `onShared,` after `closeLabel = "← Close",`) and pass it into the hook options:
```ts
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-compat.png",
    shareMeta: {
      title: "My KSaju compatibility",
      text: `You × ${other.name}: ${result.score}/100 — ksaju.me`,
    },
    onShared,
  });
```

- [ ] **Step 7: Run the full suite + type-check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (the existing modal smoke test still passes — it doesn't pass `onShared`, so it's a no-op there).

- [ ] **Step 8: Commit**

```bash
git add src/lib/share-image.ts src/lib/share-image.test.ts src/hooks/use-share-image.ts src/components/compat/compatibility-modal.tsx
git commit -m "feat(share): report delivery method via onShared (for analytics)"
```

---

## Task 5: Wire the funnel events into call sites

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/inyeon/inyeon-view.tsx`
- Modify: `src/components/compat/compatibility-section.tsx`
- Modify: `src/components/compat/partner-compat-section.tsx`

> All edits add `track(...)` calls via the wrapper (which no-ops without a key). No new tests — the wrapper is unit-tested; over-mocking each call site adds little. Verified by build + `npm test` staying green.

- [ ] **Step 1: `saju_calculated` on the home page**

In `src/app/page.tsx`, add the import:
```tsx
import { track, ageBucket } from "@/lib/analytics";
```
In `handleSubmit`, immediately after `setView("result");`, add:
```tsx
      track("saju_calculated", { age_bucket: ageBucket(data.year) });
```

- [ ] **Step 2: `saju_calculated` on /inyeon**

In `src/components/inyeon/inyeon-view.tsx`, add the import:
```tsx
import { track, ageBucket } from "@/lib/analytics";
```
In `handleSelfBirth`, immediately after `setMe(saju);`, add:
```tsx
      track("saju_calculated", { age_bucket: ageBucket(birth.year) });
```

- [ ] **Step 3: idol events in CompatibilitySection**

In `src/components/compat/compatibility-section.tsx`, add imports:
```tsx
import { track, scoreBucket } from "@/lib/analytics";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
```
Replace `handleSelect`:
```tsx
  const handleSelect = (picked: Idol) => {
    setIdol(picked);
    setOpen(true);
  };
```
with:
```tsx
  const handleSelect = (picked: Idol) => {
    const element =
      HEAVENLY_STEMS.find((s) => s.char === picked.saju.dayMaster)?.element ?? "unknown";
    track("idol_picked", { idol: picked.name, group: picked.group, element });
    const r = compatForIdol(mePillars, picked);
    track("compat_revealed", { kind: "idol", score_bucket: scoreBucket(r.score) });
    setIdol(picked);
    setOpen(true);
  };
```
Then add `onShared` to the modal usage — add this prop to `<CompatibilityModal ... >`:
```tsx
          onShared={(method) => track("card_shared", { kind: "idol", method })}
```

- [ ] **Step 4: partner events in PartnerCompatSection**

In `src/components/compat/partner-compat-section.tsx`, add the import:
```tsx
import { track, scoreBucket } from "@/lib/analytics";
```
In `handlePartner`, replace:
```tsx
      setPartnerPillars(pillars);
      setResult(calcCompatibility(mePillars, pillars));
      setOpen(true);
```
with:
```tsx
      setPartnerPillars(pillars);
      const compat = calcCompatibility(mePillars, pillars);
      setResult(compat);
      setOpen(true);
      track("partner_submitted");
      track("compat_revealed", { kind: "partner", score_bucket: scoreBucket(compat.score) });
```
Then add `onShared` to the `<CompatibilityModal ... >` usage:
```tsx
          onShared={(method) => track("card_shared", { kind: "partner", method })}
```

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit`
Expected: PASS — all green (existing component tests unaffected; track no-ops without a key in tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/inyeon/inyeon-view.tsx src/components/compat/compatibility-section.tsx src/components/compat/partner-compat-section.tsx
git commit -m "feat(analytics): fire funnel events (saju/idol/partner/reveal/share)"
```

---

## Task 6: Privacy page + footer

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/components/layout/site-footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the Privacy page**

Create `src/app/privacy/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · KSaju",
  description: "How KSaju handles your data. For entertainment 🌙",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">Privacy</h1>
        <p className="text-muted-foreground">
          KSaju is a fun, for-entertainment saju toy. We keep data collection to a minimum.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Anonymous usage events (pages viewed, buttons tapped) to understand how the site is used.</li>
            <li>A coarse <strong>age range</strong> (e.g. 18–24) derived from the birth date you enter. We never send or store your exact birth date.</li>
            <li>Approximate country, inferred from your IP address by our analytics provider.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What we do not do</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>No accounts, no login, no advertising profiles.</li>
            <li>No cookies for analytics — events are anonymous and not linked across visits.</li>
            <li>Your birth date is used in your browser to compute your saju; the raw date is not stored on our servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Third parties</h2>
          <p>
            We use <strong>PostHog</strong> for anonymous product analytics. Your usage events are
            processed by PostHog on our behalf.
          </p>
        </section>

        <p className="text-muted-foreground">
          Questions? Reach out at{" "}
          <a className="text-primary underline-offset-2 hover:underline" href="mailto:hello@ksaju.me">
            hello@ksaju.me
          </a>
          .
        </p>

        <p>
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            ← Back to KSaju
          </Link>
        </p>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Create the footer**

Create `src/components/layout/site-footer.tsx`:
```tsx
import Link from "next/link";

/** Slim footer. Privacy link + entertainment disclaimer. Seeds the later About/FAQ footer. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-8 border-t border-border/50 px-8 py-6 text-center text-xs text-muted-foreground">
      <nav className="flex justify-center gap-4">
        <Link href="/privacy" className="underline-offset-2 hover:underline hover:text-foreground">
          Privacy
        </Link>
      </nav>
      <p className="mt-2">KSaju · For entertainment 🌙</p>
    </footer>
  );
}
```

- [ ] **Step 3: Mount the footer in the layout**

In `src/app/layout.tsx`, add the import:
```tsx
import { SiteFooter } from "@/components/layout/site-footer";
```
Then place `<SiteFooter />` inside the content column, after the children div:
```tsx
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <AnalyticsProvider />
              <div className="flex flex-1 flex-col">{children}</div>
              <SiteFooter />
            </div>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/privacy/page.tsx src/components/layout/site-footer.tsx src/app/layout.tsx
git commit -m "feat(privacy): /privacy page + slim footer with Privacy link"
```

---

## Task 7: Config docs (.env.example + runbook)

**Files:**
- Create: `.env.example`
- Modify: `docs/deploy-runbook.md`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example`:
```
# Product analytics (PostHog). Leave unset to disable analytics entirely (the app no-ops).
# Get the Project API key from your PostHog project settings.
NEXT_PUBLIC_POSTHOG_KEY=
# Region host: US "https://us.i.posthog.com" (default) or EU "https://eu.i.posthog.com".
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 2: Append an "Analytics" section to the runbook**

At the end of `docs/deploy-runbook.md`, add:
```markdown

## 6. Turn on analytics (optional, anytime)

The app runs fine without analytics — events simply no-op until a key is present.

1. Create a project at <https://posthog.com> (free tier). Copy the **Project API key** (`phc_...`).
2. In Vercel → Project → **Settings → Environment Variables**, add for Production + Preview:
   - `NEXT_PUBLIC_POSTHOG_KEY` = your `phc_...` key
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (or `https://eu.i.posthog.com`)
3. Redeploy (Vercel → Deployments → Redeploy) so the new env vars are baked in.
4. For local dev, copy `.env.example` to `.env.local` and fill the same values.
5. In PostHog, build a funnel: `$pageview → saju_calculated → idol_picked → compat_revealed → card_shared`,
   and a breakdown of `idol_picked` by the `idol` property for most-picked bias.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/deploy-runbook.md
git commit -m "docs: PostHog env example + runbook analytics section"
```

---

## Task 8: Final verification + roadmap docs

**Files:** Modify `CLAUDE.md`, `task-log.md`

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: PASS — prior tests + new `analytics` tests + updated `share-image` tests (≈150 total).

- [ ] **Step 2: Lint + type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: lint shows only the 2 pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang); tsc clean.

- [ ] **Step 3: Production build (keyless — must still succeed and no-op)**

Run: `npm run build`
Expected: succeeds; route list includes `/privacy`. Build runs with no PostHog key set, proving the no-op gate. (Transient Google-font fetch error → re-run once.)

- [ ] **Step 4: Update roadmap docs**

Add a cycle-15 entry to `task-log.md` (work, decisions, commits, that the user enables it via env key per the runbook). In `CLAUDE.md`, add a short note under the roadmap / marketing section that product analytics (PostHog, cookieless) is wired and enabled via `NEXT_PUBLIC_POSTHOG_KEY`. Then commit:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 15 (PostHog analytics) complete"
```

---

## Self-Review Notes (author)

- **Spec coverage:** wrapper (init/track/ageBucket/scoreBucket) → T2 ✓; cookieless config → T2 ✓; no-op-without-key → T2 (tested) ✓; provider + manual pageviews → T3 ✓; 6 events → T3 ($pageview) + T5 (5 product events) ✓; share method for `card_shared` → T4 ✓; age bucket from birth year, no raw DOB → T2 + T5 ✓; `/privacy` + footer → T6 ✓; `.env.example` + runbook → T7 ✓; tests → T2/T4 ✓; build/keyless verification → T8 ✓. Out-of-scope (dashboard/auth/About/FAQ/Vercel Analytics/consent banner) — no task touches them ✓.
- **Type consistency:** `AnalyticsEvent` union used in `track` matches the events fired in T3/T5 (`$pageview`, `saju_calculated`, `idol_picked`, `partner_submitted`, `compat_revealed`, `card_shared`). `ShareOutcome` (`web_share`|`download`|`cancelled`) defined in T4 share-image, consumed by `useShareImage` (`Exclude<…,"cancelled">`) and modal `onShared(method: "web_share"|"download")` and the section `track("card_shared",{method})` — consistent. `ageBucket`/`scoreBucket` signatures match call sites (T5 passes `data.year`/`birth.year` and `r.score`/`compat.score`). `HEAVENLY_STEMS` entries have `.char`/`.element` (verified).
- **Placeholders:** none — every code/command step is complete.
