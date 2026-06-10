# Spec: Multi-Sink Analytics (Cycle 24)

**Date:** 2026-06-10
**Status:** Draft

---

## Goal

Unify all analytics into a single `track()` call that fans out to three sinks simultaneously:
1. **PostHog** (existing — cookieless, anonymous)
2. **Vercel Analytics** custom events (`@vercel/analytics`)
3. **Supabase** `analytics_events` table (browser client, fire-and-forget)

Add five new named events replacing overlapping PostHog event names. No new dependencies beyond what is already installed (`@vercel/analytics`, `@supabase/supabase-js`, `@supabase/ssr`).

---

## Events

| Event | Props | Fire location | Replaces |
|---|---|---|---|
| `birth_submitted` | `{ has_time: boolean }` | `page.tsx` `handleSubmit` entry | `saju_calculated` |
| `idol_selected` | `{ idol_name: string, group: string }` | `compatibility-section.tsx` `handleSelect` | `idol_picked` |
| `card_generated` | `{ idol_name: string, score: number }` | `compatibility-section.tsx` after `compatForIdol()` | _(new)_ |
| `share_clicked` | `{ idol_name: string, score: number }` | `compatibility-modal.tsx` Share button `onClick` | `card_shared` |
| `another_idol_clicked` | — | `compatibility-section.tsx` `onClose` wrapper | _(new)_ |

Retired event names (`saju_calculated`, `idol_picked`, `card_shared`) are removed from the `AnalyticsEvent` union type. `partner_submitted`, `compat_revealed`, `$pageview` are kept as-is — they continue routing to PostHog (and now also Vercel + Supabase via the unified `track()`).

---

## Architecture

### `src/lib/supabase-client.ts` (new)

Browser-only Supabase client using `createBrowserClient` from `@supabase/ssr`.
Returns `null` when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent (dev/test no-op).

```ts
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
```

Singleton pattern: client is created once and reused.

### `src/lib/analytics.ts` (extend)

`track()` extended to call all three sinks. Each sink is independent — a failure in one never throws into the app.

```
track(event, props)
  ├─ PostHog: posthog.capture(event, props)          [no-op without key]
  ├─ Vercel:  vercelTrack(event, props)               [no-op outside Vercel]
  └─ Supabase: supabase.from('analytics_events')
               .insert({ event, props })              [no-op without env vars]
```

Supabase insert is **fire-and-forget** (`void promise` — no await, no error surfaced to UI).

`AnalyticsEvent` type updated:
- Add: `birth_submitted`, `idol_selected`, `card_generated`, `share_clicked`, `another_idol_clicked`
- Remove: `saju_calculated`, `idol_picked`, `card_shared`
- Keep: `$pageview`, `compat_revealed`, `partner_submitted`

### Supabase table

```sql
create table analytics_events (
  id         uuid        primary key default gen_random_uuid(),
  event      text        not null,
  props      jsonb,
  created_at timestamptz not null default now()
);

alter table analytics_events enable row level security;

create policy "allow anon insert"
  on analytics_events
  for insert
  with check (true);
```

Saved to `docs/supabase-migration.sql` for user to run in Supabase SQL Editor.

---

## Component Changes

### `src/app/page.tsx`
- Replace `track("saju_calculated", ...)` with `track("birth_submitted", { has_time: !!(data.hour !== undefined) })` — fires at `handleSubmit` entry (before async calls).

### `src/components/compat/compatibility-section.tsx`
```
handleSelect(picked):
  track("idol_selected", { idol_name: picked.name, group: picked.group })
  result = compatForIdol(mePillars, picked)
  track("card_generated", { idol_name: picked.name, score: result.score })
  setIdol / setOpen(true)

onClose wrapper:
  track("another_idol_clicked")
  setOpen(false)
```
Remove old `track("idol_picked", ...)` and `track("compat_revealed", ...)` calls.

### `src/components/compat/compatibility-modal.tsx`
Share button `onClick`:
```tsx
onClick={() => {
  track("share_clicked", { idol_name: other.name, score: result.score });
  share();
}}
```
Remove `onShared` prop usage from `CompatibilitySection` (it called the old `card_shared`).

---

## Env Vars

Add to `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

User action: add both to Vercel project env vars after deployment.

---

## Tests

`src/lib/analytics.test.ts` extended:
- Mock `@vercel/analytics` (`track` spy)
- Mock `@supabase/ssr` (`createBrowserClient` → `from().insert()` spy)
- Assert all 3 sinks called when env vars present
- Assert Vercel + Supabase no-op when env vars absent
- Assert PostHog still no-ops without PostHog key (existing tests pass)

`src/lib/supabase-client.test.ts` (new, minimal):
- Returns `null` when env vars absent
- Returns client instance when present

---

## Files Touched

| File | Change |
|---|---|
| `src/lib/supabase-client.ts` | new |
| `src/lib/supabase-client.test.ts` | new |
| `src/lib/analytics.ts` | extend track() + update AnalyticsEvent type |
| `src/lib/analytics.test.ts` | extend for multi-sink assertions |
| `src/app/page.tsx` | birth_submitted |
| `src/components/compat/compatibility-section.tsx` | idol_selected, card_generated, another_idol_clicked |
| `src/components/compat/compatibility-modal.tsx` | share_clicked, remove onShared |
| `.env.example` | add Supabase vars |
| `docs/supabase-migration.sql` | new — table + RLS SQL |

**Total: 9 files. No new runtime dependencies.**

---

## Out of Scope

- `/inyeon` `PartnerCompatSection` — `partner_submitted` / `compat_revealed` keep existing behavior; no new events added for general partner flow in this cycle.
- Server-side Supabase (service role key, rate limiting) — future cycle if needed.
- Supabase Row-level analytics dashboard — Supabase Table Editor or Metabase integration — future.
