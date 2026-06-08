# /inyeon UX Polish — Design (Cycle 21)

**Date:** 2026-06-08
**Status:** Approved (brainstorming)

## Goal

Sharpen the `/inyeon` experience after the catalog grew to 19 groups (cycle 20). Four
presentation-only improvements, all reusing existing helpers (cycle-19 `ELEMENT_TEXT`,
`saju-display`'s `dayMasterInfo`/`WUXING_META`/`elementOf`). No new dependencies, no new
data, no analytics changes, no engine changes.

1. Idol-picker browsing (alphabetical groups, search emphasis + hint, count badge, default-expanded group)
2. "Your saju" summary bar visualized (per-char element color + day-master line)
3. Light section copy polish
4. Re-openable result (view the last match again without re-selecting)

## Non-Goals (YAGNI)

- Personalization (remembering a user's bias), popularity/recommendation ranking.
- Fuzzy-search changes, modal internals redesign, new design system.
- New analytics events. New idol data. Changes to `idols.ts` exports or the compat engine.

---

## Item 1 — Idol-picker browsing (`src/components/idols/idol-picker.tsx`)

**Current:** search box + accordion of groups in DB-insertion order, all collapsed by
default (one-at-a-time). With 19 groups the list is long and the empty default looks inert.

**Changes:**
- **Alphabetical group order.** Sort a *local copy* of the exported `groups` (do NOT mutate
  `idols.ts`'s `groups`; other consumers keep insertion order). Sort key strips
  non-alphanumerics and lowercases, so `(G)I-DLE` → `gidle`, `LE SSERAFIM` → `lesserafim`;
  `aespa` sorts first.
- **Default-expanded group = `aespa`** (the first sorted group). `expandedGroup` initial
  state becomes the first sorted group instead of `null`. Tradeoff accepted: the list is
  slightly taller, pushing "Or someone else" down a bit.
- **Search emphasis:** `autoFocus` on the search `Input` (user-confirmed ON; note: on mobile
  this may scroll to the picker on load) + a one-line hint under it:
  *"Try a name or group — e.g. BTS, Mingyu, ATEEZ"* (`text-xs text-muted-foreground`).
- **Member-count badge:** the current faint inline number becomes a small pill badge
  (e.g. `rounded-full bg-muted px-1.5 text-[10px]`) for readability. Cosmetic only.
- **'Soloist' label:** left as the stored DB value (IU); no rename, no data change.

The search/flat-results and selection logic are otherwise unchanged.

---

## Item 2 — "Your saju" summary bar (`src/components/inyeon/saju-summary-bar.tsx` new + `inyeon-view.tsx`)

**Current:** an inline `<section>` in `inyeon-view.tsx` showing
`{year} · {month} · {day}` as plain bold hanja + an "Edit on home →" link.

**Changes:** extract a small `SajuSummaryBar({ saju }: { saju: UserSaju })` component
(keeps `inyeon-view.tsx` lean), which renders:
- The three pillars with **each hanja char element-colored** via `ELEMENT_TEXT[elementOf(char)]`
  (same per-char approach as `PillarsGrid`/the share-card mini-saju).
- A **day-master line:** `dayMasterInfo(saju.dayMaster)` → e.g.
  `Day master · 辛 Metal · <keyword>`, with the hanja + element label in the element color
  (`WUXING_META[element].label`) and the fun `keyword` from `DAY_MASTER_KEYWORDS`.
- The existing "Edit on home →" link, unchanged.

`inyeon-view.tsx` replaces its inline saju `<section>` with `<SajuSummaryBar saju={me} />`.

---

## Item 3 — Section copy polish (light)

Small, friendly wording touch-ups only (no rewrites): keep the idol section
("Check compatibility with your bias ✨" / "Tap an idol to reveal your saju match.") and
the partner section header as-is unless a phrase reads awkwardly next to the new bar; the
empty/error states already read clearly and stay. This item is intentionally minimal — the
visible wins are Items 1, 2, 4.

---

## Item 4 — Re-openable result (`compatibility-section.tsx`, `partner-compat-section.tsx`)

**Current:** after the modal closes, the last result still lives in state but there's no way
back to it without re-selecting/re-submitting.

**Changes:** when a result exists and the modal is closed, show a button to reopen it:
- **Idol section:** when `idol` is set and `open` is false, render
  *"View {idol.name} result again ✨"* that sets `open` true. (No new compute — `result` is
  already derived from `idol`.)
- **Partner section:** when `result && partnerPillars` and `open` is false, render
  *"View {name||'their'} result again ✨"* that sets `open` true.

No new analytics (reopening is not a new reveal).

---

## Testing

- `idol-picker.test.tsx`:
  - **Update** the existing "기본 상태: 모두 접힘 / radio 0개" test — the default now expands
    `aespa`, so on mount the aespa members ARE shown. Rewrite it to assert the default-expanded
    group (aespa) shows its members and its toggle is `aria-expanded="true"`, while another
    group (e.g. BTS) is collapsed.
  - **Add:** group toggles render in alphabetical order (assert the first group button is
    `aespa` and that it precedes `BTS` in the DOM).
  - **Add:** the search hint text is present.
  - Existing toggle/accordion/search/select tests stay green (clicking BTS still closes aespa,
    etc.).
- `saju-summary-bar.test.tsx` (new): renders the day-master keyword and at least one element
  color class on a known saju (e.g. RM `辛` → metal → `text-wuxing-geum`).
- `compatibility-section.test.tsx` / `partner-compat-section.test.tsx`: after selecting/
  submitting and closing the modal, the "View … result again" button appears and reopens the
  modal.
- Full gate: `npm test` + `npx tsc --noEmit` + `npm run lint` (only the 2 known warnings) +
  `npm run build` (routes static).

## Files

- Modify: `src/components/idols/idol-picker.tsx`, `src/components/idols/idol-picker.test.tsx`
- Create: `src/components/inyeon/saju-summary-bar.tsx`, `src/components/inyeon/saju-summary-bar.test.tsx`
- Modify: `src/components/inyeon/inyeon-view.tsx`
- Modify: `src/components/compat/compatibility-section.tsx` (+ test), `src/components/compat/partner-compat-section.tsx` (+ test)

## Risks

- The existing idol-picker default-state test MUST be updated in lockstep with the
  default-expand change, or it will fail — explicitly handled in the plan.
- `autoFocus` may cause a slight scroll-to-picker on mobile load; accepted by user.
