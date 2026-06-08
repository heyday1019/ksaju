# Card / Idol Visual Polish — Design (Cycle 19)

**Date:** 2026-06-08
**Status:** Approved (brainstorming)

## Goal

A bundle of small, presentation-only polish items that make the saju meaning more
visible and the copy friendlier — no new dependencies, no new data, no new
components. Everything reuses the existing element-color tokens
(`wuxing-mok/hwa/to/geum/su`), `elementOf`, and `WUXING_META`.

Four items, in priority order:

1. Element-colored idol avatars (IdolCard)
2. Hanja spacing + element color on the share card mini-saju and the home pillars grid
3. Name + group disambiguation (lightweight — mostly already present)
4. Birth-time helper copy (BirthForm)

## Non-Goals (YAGNI)

- Real idol photos or logos (CLAUDE.md forbids; monogram stays).
- New color palette or design tokens.
- New components or files (beyond a possible tiny shared element-color map).
- Search/disambiguation algorithm changes.
- Animations or motion.

---

## Item 1 — Element-colored idol avatars (IdolCard)

**Current:** the monogram circle in `src/components/idols/idol-card.tsx` uses
`bg-gradient-to-br from-primary to-accent` with white text — the same pink→gold for
every idol.

**Change:** background becomes the idol's **day-master element** as a soft tint and
the initial takes the element color, mirroring `WuxingBalance`'s `BG` map:

```
const AVATAR: Record<WuXing, string> = {
  wood:  "bg-wuxing-mok/15 text-wuxing-mok",
  fire:  "bg-wuxing-hwa/15 text-wuxing-hwa",
  earth: "bg-wuxing-to/15 text-wuxing-to",
  metal: "bg-wuxing-geum/15 text-wuxing-geum",
  water: "bg-wuxing-su/15 text-wuxing-su",
};
```

- Element source: `elementOf(idol.saju.dayMaster)` (e.g. RM `辛` → metal →
  `bg-wuxing-geum/15 text-wuxing-geum`).
- The initial letter (`idol.name.charAt(0)`) is kept.
- Only place avatars appear is the IdolPicker list, so this is the only touch point.

**Rationale:** gives each idol a saju-meaningful color and visual variety, while
matching the tinted-chip aesthetic already used across the site (user-chosen
tinted `/15` style over solid).

---

## Item 2 — Hanja spacing + element color (share card mini-saju + pillars grid)

**Current:**
- `CompatShareCard` `MiniSaju` renders `{year} {month} {day}` as a plain
  space-separated string, bold but neutral (no element color).
- `PillarsGrid` already colors each char by element (`Char`), but the two chars of a
  pillar sit immediately adjacent.

**Change:**
- Mini-saju: render the three pillars in an `inline-flex` row with explicit gaps so
  spacing is even regardless of font, and **color each hanja by its element** (reuse
  the same per-char element-color approach as `PillarsGrid`'s `Char`). Confirmed with
  user: mini-saju gets element color (not neutral).
- Pillars grid: add a small gap between the two chars of each pillar for even
  spacing.
- A small shared per-char element-color helper may be extracted so the share card and
  the pillars grid use one source (the existing `TEXT` map in `pillars-grid.tsx`).
  Keep maps as literal strings (Tailwind v4 JIT only scans literals).

**Rationale:** unifies the element-color language across home result and share card,
and fixes the uneven plain-space hanja layout.

---

## Item 3 — Name + group disambiguation (lightweight)

**Already present:** IdolCard shows name + group on two lines; the compat card header
receives `sub: idol.group` (`compatibility-section.tsx`) so it reads
"You × Jisoo · BLACKPINK".

**Change (small):**
- Add a combined `aria-label` (e.g. `"RM, BTS"`) to the IdolCard radio button so
  screen readers announce name and group together unambiguously.
- Keep the group line clearly readable (existing `text-muted-foreground`); no new
  logic.

**Rationale:** the visible disambiguation already exists; this closes the a11y gap
without inventing busywork.

---

## Item 4 — Birth-time helper copy (BirthForm)

**Current** `FormDescription` under the birth-time field:
"Needed for your full saju (12지지 hour pillar)." — mixes Korean jargon (`12지지`)
and says "Needed", which contradicts the field's `(optional)` label.

**Change:** rewrite to friendly English for the target audience (English-speaking Gen
Z K-pop fans), making clear it is **optional** and that adding a time makes the **hour
pillar and reading more accurate**. No Korean jargon. Label keeps "(optional)".

**Rationale:** removes a genuine copy wart (jargon + optional/required contradiction).

---

## Testing

- `idol-card.test.tsx` (TDD): assert RM's avatar carries the metal element class
  (`text-wuxing-geum`), and assert the radio's accessible name includes both "RM" and
  "BTS" (combined `aria-label`).
- `compat-share-card.test.tsx`: keep green; optionally assert at least one element
  color class is present on the rendered mini-saju hanja.
- Hanja spacing and birth-time copy are visual/string changes — covered by existing
  render tests and `next build`; no new dedicated test files.
- Full gate: `npm test` + `npx tsc --noEmit` + `npm run lint` (only the two
  pre-existing warnings) + `npm run build` (all routes still static `○`).

## Files (anticipated)

- Modify: `src/components/idols/idol-card.tsx` (element avatar + aria-label)
- Modify: `src/components/idols/idol-card.test.tsx` (assertions)
- Modify: `src/components/compat/compat-share-card.tsx` (mini-saju spacing + color)
- Modify: `src/components/saju/pillars-grid.tsx` (char gap; possibly export the
  element-color map)
- Modify: `src/components/kst/birth-form.tsx` (helper copy)
- Possibly add: a tiny shared element-color map module if extraction is cleaner than
  duplicating the literal map.
