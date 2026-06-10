# Multi-Sink Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `track()` to fan out to PostHog + Vercel Analytics + Supabase simultaneously, and wire 5 new named events into the correct components.

**Architecture:** New `getSupabaseClient()` singleton provides a browser Supabase client (no-op when env vars absent). `analytics.ts` `track()` calls all three sinks in independent try-catch blocks — a failure in one never affects others. Five new `AnalyticsEvent` members replace three retired names. Env vars already set in `.env.local` and Vercel environment.

**Tech Stack:** `@supabase/ssr` createBrowserClient · `@vercel/analytics` track · posthog-js · Next.js App Router · vitest/happy-dom

---

## File Map

| File | Change |
|---|---|
| `src/lib/supabase-client.ts` | **create** — browser Supabase singleton |
| `src/lib/supabase-client.test.ts` | **create** — 3 unit tests |
| `src/lib/analytics.ts` | **modify** — multi-sink track() + updated AnalyticsEvent type |
| `src/lib/analytics.test.ts` | **modify** — add multi-sink assertions |
| `src/app/page.tsx` | **modify** — birth_submitted |
| `src/components/compat/compatibility-section.tsx` | **modify** — idol_selected + card_generated + another_idol_clicked |
| `src/components/compat/compatibility-modal.tsx` | **modify** — share_clicked + remove onShared prop |
| `src/components/compat/partner-compat-section.tsx` | **modify** — remove onShared prop call only |
| `.env.example` | **modify** — add Supabase vars |
| `docs/supabase-migration.sql` | **create** — analytics_events table + RLS |

---

## Task 1: Supabase browser client singleton

**Files:**
- Create: `src/lib/supabase-client.ts`
- Create: `src/lib/supabase-client.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/supabase-client.test.ts`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ supabase: "mock-client" }));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...a: unknown[]) => createBrowserClientMock(...a),
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
```

- [ ] **Step 2: Run tests — expect FAIL (module not found)**

```bash
npx vitest run src/lib/supabase-client.test.ts
```

Expected: 3 failures like `Cannot find module './supabase-client'`

- [ ] **Step 3: Implement the singleton**

Create `src/lib/supabase-client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createBrowserClient(url, key);
  return _client;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/lib/supabase-client.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase-client.ts src/lib/supabase-client.test.ts
git commit -m "feat(analytics): Supabase browser client singleton"
```

---

## Task 2: Multi-sink analytics.ts extension

**Files:**
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/analytics.test.ts`

- [ ] **Step 1: Add multi-sink tests to analytics.test.ts**

Open `src/lib/analytics.test.ts`. The file currently has top-level mocks for `posthog-js` and a `beforeEach` that calls `vi.resetModules()`. Add new mocks **before** the existing `vi.mock("posthog-js", ...)` line, and add mock clears to `beforeEach`.

Replace the entire file with:

```typescript
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
    mod.track("saju_calculated" as Parameters<typeof mod.track>[0], { age_bucket: "18-24" });
    expect(capture).toHaveBeenCalledWith("saju_calculated", { age_bucket: "18-24" });
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
```

- [ ] **Step 2: Run tests — expect new multi-sink tests to FAIL**

```bash
npx vitest run src/lib/analytics.test.ts
```

Expected: existing ageBucket/scoreBucket/init tests pass; 4 new multi-sink tests fail because track() doesn't call Vercel/Supabase yet.

- [ ] **Step 3: Update analytics.ts**

Replace `src/lib/analytics.ts` with:

```typescript
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
  | "saju_calculated"; // kept temporarily for existing posthog test — remove after Task 3

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
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run src/lib/analytics.test.ts src/lib/supabase-client.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): multi-sink track() — PostHog + Vercel + Supabase"
```

---

## Task 3: `birth_submitted` event in page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update handleSubmit in page.tsx**

Open `src/app/page.tsx`. In `handleSubmit`, replace:

```typescript
// REMOVE this line:
track("saju_calculated", { age_bucket: ageBucket(data.year) });
```

Add `birth_submitted` at the top of `handleSubmit` (before the try block), and remove the `ageBucket` import if no longer needed:

Find the `handleSubmit` function and update it:

```typescript
const handleSubmit = async (data: BirthData) => {
  track("birth_submitted", { has_time: data.hour !== undefined });
  setErrorMessage(null);
  setSubmitting(true);
  try {
    const kstResult = convertToKST(data);
    const [saju, luck] = await Promise.all([
      calcUserSaju(data),
      calcCurrentLuck(),
    ]);
    setKst(kstResult);
    setUserSaju(saju);
    setCurrentLuck(luck);
    saveUserSaju(saju);
    setView("result");
  } catch (err) {
    console.error("Saju calculation failed:", err);
    setErrorMessage(
      "Couldn't read this birth date. Please double-check your info and try again."
    );
  } finally {
    setSubmitting(false);
  }
};
```

Also update the import line — remove `ageBucket` since it's no longer used here:

```typescript
// BEFORE:
import { track, ageBucket } from "@/lib/analytics";
// AFTER:
import { track } from "@/lib/analytics";
```

- [ ] **Step 2: Remove `saju_calculated` from AnalyticsEvent type in analytics.ts**

Open `src/lib/analytics.ts`. Remove the `saju_calculated` entry from the union (the comment said it was temporary):

```typescript
export type AnalyticsEvent =
  | "$pageview"
  | "birth_submitted"
  | "idol_selected"
  | "card_generated"
  | "share_clicked"
  | "another_idol_clicked"
  | "partner_submitted"
  | "compat_revealed";
```

Also in `src/lib/analytics.test.ts`, find the test that casts `"saju_calculated"` and update it to use a valid event name so TypeScript stays clean:

```typescript
// In the "inits cookieless and captures to posthog when a key is set" test, replace:
mod.track("saju_calculated" as Parameters<typeof mod.track>[0], { age_bucket: "18-24" });
// With:
mod.track("$pageview", { age_bucket: "18-24" });
expect(capture).toHaveBeenCalledWith("$pageview", { age_bucket: "18-24" });
```

- [ ] **Step 3: Type-check + run full test suite**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: no type errors, all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(analytics): birth_submitted replaces saju_calculated"
```

---

## Task 4: `idol_selected`, `card_generated`, `another_idol_clicked` in CompatibilitySection

**Files:**
- Modify: `src/components/compat/compatibility-section.tsx`

- [ ] **Step 1: Update compatibility-section.tsx**

Replace the entire file content:

```typescript
"use client";

import { useMemo, useState } from "react";
import { IdolPicker } from "@/components/idols/idol-picker";
import { CompatibilityModal } from "./compatibility-modal";
import { compatForIdol, type Idol } from "@/lib/idols";
import { normalizeIdolSaju, type SajuPillars } from "@/lib/compatibility";
import type { UserSaju } from "@/lib/saju-types";
import { track } from "@/lib/analytics";

/**
 * '내 사주' 뷰 안의 궁합 부가 섹션.
 * 아이돌 선택 → compatForIdol → 결과 모달. "Check another idol" 루프.
 */
export function CompatibilitySection({ userSaju }: { userSaju: UserSaju }) {
  const [idol, setIdol] = useState<Idol | null>(null);
  const [open, setOpen] = useState(false);

  const mePillars: SajuPillars = useMemo(
    () => ({
      year: userSaju.pillars.year,
      month: userSaju.pillars.month,
      day: userSaju.pillars.day,
    }),
    [userSaju],
  );

  const result = idol ? compatForIdol(mePillars, idol) : null;

  const handleSelect = (picked: Idol) => {
    track("idol_selected", { idol_name: picked.name, group: picked.group });
    const r = compatForIdol(mePillars, picked);
    track("card_generated", { idol_name: picked.name, score: r.score });
    setIdol(picked);
    setOpen(true);
  };

  const handleClose = () => {
    track("another_idol_clicked");
    setOpen(false);
  };

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="text-center">
        <p className="font-display font-semibold">
          Check compatibility with your bias ✨
        </p>
        <p className="text-xs text-muted-foreground">
          Tap an idol to reveal your saju match.
        </p>
      </div>

      <IdolPicker onSelect={handleSelect} />

      {idol && !open && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View {idol.name} result again ✨
          </button>
        </div>
      )}

      {idol && result && (
        <CompatibilityModal
          open={open}
          onClose={handleClose}
          mePillars={mePillars}
          other={{
            name: idol.name,
            sub: idol.group,
            pillars: normalizeIdolSaju(idol.saju),
          }}
          result={result}
          closeLabel="← Check another idol"
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run the CompatibilitySection tests**

```bash
npx vitest run src/components/compat/compatibility-section.test.tsx
```

Expected: both tests still pass (tests verify UI flow, not event names)

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/compat/compatibility-section.tsx
git commit -m "feat(analytics): idol_selected + card_generated + another_idol_clicked"
```

---

## Task 5: `share_clicked` in CompatibilityModal + remove `onShared`

**Files:**
- Modify: `src/components/compat/compatibility-modal.tsx`
- Modify: `src/components/compat/partner-compat-section.tsx`

- [ ] **Step 1: Update compatibility-modal.tsx**

Replace the entire file content:

```typescript
"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";
import { CompatShareCard, type CompatOther } from "./compat-share-card";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";

export type { CompatOther };

type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
};

/**
 * Compatibility result modal. The body IS the 9:16 CompatShareCard, scaled to
 * fit the dialog so the preview equals the exported PNG. Share captures the
 * full-resolution card via useShareImage. Generic: idol + general partner.
 */
export function CompatibilityModal({
  open,
  onClose,
  mePillars,
  other,
  result,
  closeLabel = "← Close",
}: CompatibilityModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-compat.png",
    shareMeta: {
      title: "My KSaju compatibility",
      text: `You × ${other.name}: ${result.score}/100 — make yours at ksaju.me`,
    },
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">
          Your saju compatibility with {other.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju compatibility score between you and {other.name}.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <CompatShareCard
          ref={cardRef}
          mePillars={mePillars}
          other={other}
          result={result}
        />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => {
              track("share_clicked", { idol_name: other.name, score: result.score });
              share();
            }}
            disabled={status === "rendering"}
            className="w-full"
          >
            {shareLabel}
          </Button>
          {status === "error" && (
            <p className="text-center text-xs text-destructive">
              Couldn&apos;t create image — try again
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            {closeLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Remove `onShared` call from partner-compat-section.tsx**

Open `src/components/compat/partner-compat-section.tsx`. Find the `<CompatibilityModal>` usage and remove the `onShared` prop. Also remove the now-unused `scoreBucket` import if present.

Find this block:
```typescript
<CompatibilityModal
  open={open}
  onClose={() => setOpen(false)}
  mePillars={mePillars}
  other={{ name: partnerName.trim() || "Them", pillars: partnerPillars }}
  result={result}
  closeLabel="← Check someone else"
  onShared={(method) => track("card_shared", { kind: "partner", method })}
/>
```

Replace with:
```typescript
<CompatibilityModal
  open={open}
  onClose={() => setOpen(false)}
  mePillars={mePillars}
  other={{ name: partnerName.trim() || "Them", pillars: partnerPillars }}
  result={result}
  closeLabel="← Check someone else"
/>
```

Leave the import line unchanged — `scoreBucket` is still used by the existing `track("compat_revealed", ...)` call which stays as-is:
```typescript
// DO NOT change this line:
import { track, scoreBucket } from "@/lib/analytics";
```

The `partner_submitted` and `compat_revealed` events remain in the `AnalyticsEvent` union, so those calls are fine as-is. The only change to this file is removing `onShared` from the modal props.

- [ ] **Step 3: Run modal + partner tests**

```bash
npx vitest run src/components/compat/compatibility-modal.test.tsx src/components/compat/partner-compat-section.test.tsx
```

Expected: all tests pass

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors (onShared removed from type + all callers updated)

- [ ] **Step 5: Commit**

```bash
git add src/components/compat/compatibility-modal.tsx src/components/compat/partner-compat-section.tsx
git commit -m "feat(analytics): share_clicked in modal + remove onShared prop"
```

---

## Task 6: Migration SQL + .env.example

**Files:**
- Create: `docs/supabase-migration.sql`
- Modify: `.env.example`

- [ ] **Step 1: Create the Supabase migration SQL**

Create `docs/supabase-migration.sql`:

```sql
-- KSaju analytics_events table
-- Run this in the Supabase SQL Editor for your project.
-- Idempotent: safe to re-run.

create table if not exists analytics_events (
  id         uuid        primary key default gen_random_uuid(),
  event      text        not null,
  props      jsonb,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table analytics_events enable row level security;

-- Allow anonymous users to insert events (anon key is public by design)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'analytics_events' and policyname = 'allow anon insert'
  ) then
    create policy "allow anon insert"
      on analytics_events
      for insert
      with check (true);
  end if;
end $$;
```

- [ ] **Step 2: Update .env.example**

Open `.env.example`. Append:

```
# Supabase (browser client — public anon key, safe to expose).
# Create project at supabase.com, run docs/supabase-migration.sql in SQL Editor.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Run full test suite + type-check + build**

```bash
npx tsc --noEmit && npx vitest run && npx next build
```

Expected: all tests pass, no type errors, all routes build as static ○

- [ ] **Step 4: Commit + push**

```bash
git add docs/supabase-migration.sql .env.example
git commit -m "docs(analytics): Supabase migration SQL + .env.example"
git push origin main
```

---

## Post-Implementation: Supabase Setup (User Action)

After push, run this in **Supabase Dashboard → SQL Editor**:

```
docs/supabase-migration.sql  (copy-paste the file contents)
```

Then verify in **Table Editor → analytics_events** that the table exists with RLS enabled and the `allow anon insert` policy active.

To confirm events are landing: open the app, submit a birth date, then check **Table Editor → analytics_events** for a row with `event = 'birth_submitted'`.
