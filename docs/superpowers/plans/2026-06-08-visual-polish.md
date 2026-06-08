# Card / Idol Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four presentation-only polish items — element-colored idol avatars, element-colored + evenly-spaced hanja on the share card and pillars grid, an a11y name+group label, and friendlier birth-time copy.

**Architecture:** Pure component/CSS changes reusing the existing element-color tokens (`wuxing-mok/hwa/to/geum/su`), `elementOf`, and `WUXING_META`. One shared per-char text-color map is added to `saju-display.ts` and consumed by both the pillars grid and the share card mini-saju (DRY). No new dependencies, no new data, no new runtime logic.

**Tech Stack:** Next.js 16 App Router (client presentational components), Tailwind v4 (literal class maps for JIT), vitest + happy-dom + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-08-visual-polish-design.md`

---

## File Structure

- `src/lib/saju-display.ts` (modify) — add exported `ELEMENT_TEXT` per-char color map.
- `src/lib/saju-display.test.ts` (modify) — assert `ELEMENT_TEXT`.
- `src/components/idols/idol-card.tsx` (modify) — element-tinted avatar + combined `aria-label`.
- `src/components/idols/idol-card.test.tsx` (modify) — avatar color + aria-label assertions.
- `src/components/saju/pillars-grid.tsx` (modify) — consume `ELEMENT_TEXT`, even char gap.
- `src/components/compat/compat-share-card.tsx` (modify) — mini-saju element color + even spacing.
- `src/components/compat/compat-share-card.test.tsx` (modify) — mini-saju color assertion.
- `src/components/kst/birth-form.tsx` (modify) — birth-time helper copy.

**Reused patterns (read before starting):** `src/components/saju/wuxing-balance.tsx` (literal `BG` element-class map — the avatar map mirrors it). `src/components/saju/pillars-grid.tsx` (the `Char` per-char color pattern reused on the share card). `src/lib/saju-display.ts` (`elementOf`, `WUXING_META`).

---

## Task 1: Shared `ELEMENT_TEXT` map + pillars-grid adoption

**Files:**
- Modify: `src/lib/saju-display.ts`
- Modify: `src/lib/saju-display.test.ts`
- Modify: `src/components/saju/pillars-grid.tsx`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/saju-display.test.ts`:
```ts
import { ELEMENT_TEXT } from "./saju-display";

describe("ELEMENT_TEXT", () => {
  it("maps each element to its literal wuxing text-color class", () => {
    expect(ELEMENT_TEXT).toEqual({
      wood: "text-wuxing-mok",
      fire: "text-wuxing-hwa",
      earth: "text-wuxing-to",
      metal: "text-wuxing-geum",
      water: "text-wuxing-su",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/saju-display.test.ts`
Expected: FAIL — `ELEMENT_TEXT` is not exported (undefined).

- [ ] **Step 3: Add `ELEMENT_TEXT` to `saju-display.ts`**

In `src/lib/saju-display.ts`, after the `WUXING_META` block, add:
```ts
/**
 * 오행 → 글자색 클래스 (globals.css `--color-wuxing-*`).
 * Tailwind v4 JIT가 정적 리터럴만 스캔하므로 문자열 리터럴 맵으로 유지.
 * PillarsGrid · CompatShareCard 미니사주가 공유.
 */
export const ELEMENT_TEXT: Record<WuXing, string> = {
  wood: "text-wuxing-mok",
  fire: "text-wuxing-hwa",
  earth: "text-wuxing-to",
  metal: "text-wuxing-geum",
  water: "text-wuxing-su",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/saju-display.test.ts`
Expected: PASS.

- [ ] **Step 5: Adopt `ELEMENT_TEXT` in `pillars-grid.tsx` + even char gap**

Replace the top of `src/components/saju/pillars-grid.tsx` (imports + local `TEXT` + `Char`):
```tsx
import { elementOf, pillarKo, ELEMENT_TEXT } from "@/lib/saju-display";
import type { UserSaju } from "@/lib/saju-types";

function Char({ char }: { char: string }) {
  return <span className={`hanja ${ELEMENT_TEXT[elementOf(char)]}`}>{char}</span>;
}
```
(Removes the now-unused local `TEXT` map and the `WuXing` type import.)

Then wrap the two chars in an even-gap flex row — replace the existing pillar `<p>` block:
```tsx
              <p className="mt-1 text-3xl font-bold leading-tight">
                <span className="inline-flex justify-center gap-0.5">
                  <Char char={pillar[0]} />
                  <Char char={pillar[1]} />
                </span>
              </p>
```

- [ ] **Step 6: Type-check + run the saju render test**

Run: `npx tsc --noEmit`
Expected: clean (no unused `WuXing`/`TEXT`).
Run: `npx vitest run src/components/saju/saju-result.test.tsx`
Expected: PASS (PillarsGrid still renders inside SajuResult).

- [ ] **Step 7: Commit**

```bash
git add src/lib/saju-display.ts src/lib/saju-display.test.ts src/components/saju/pillars-grid.tsx
git commit -m "refactor(saju): shared ELEMENT_TEXT map + even hanja gap in pillars grid"
```

---

## Task 2: Element-colored idol avatar + name/group a11y label (IdolCard)

**Files:**
- Modify: `src/components/idols/idol-card.test.tsx`
- Modify: `src/components/idols/idol-card.tsx`

- [ ] **Step 1: Write the failing tests**

Add these two `it` blocks inside the existing `describe("IdolCard", ...)` in `src/components/idols/idol-card.test.tsx`:
```tsx
  it("tints the avatar by the idol's day-master element (辛 → metal)", () => {
    render(<IdolCard idol={RM} selected={false} onSelect={() => {}} />);
    // monogram is the single-letter "R" span
    expect(screen.getByText("R")).toHaveClass("text-wuxing-geum");
  });

  it("exposes a combined name+group accessible label", () => {
    render(<IdolCard idol={RM} selected={false} onSelect={() => {}} />);
    expect(screen.getByRole("radio", { name: "RM, BTS" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/idols/idol-card.test.tsx`
Expected: FAIL — avatar still uses `text-white` (no `text-wuxing-geum`); radio accessible name is `"RM BTS R"`-ish, not `"RM, BTS"`.

- [ ] **Step 3: Implement element avatar + aria-label**

Replace the body of `src/components/idols/idol-card.tsx` with:
```tsx
import { cn } from "@/lib/utils";
import { elementOf } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { Idol } from "@/lib/idols";

interface IdolCardProps {
  idol: Idol;
  selected: boolean;
  onSelect: (idol: Idol) => void;
}

// 오행 튼트 아바타 (배경 /15 + 오행색 글자). Tailwind v4 JIT용 리터럴 맵.
const AVATAR: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/15 text-wuxing-mok",
  fire: "bg-wuxing-hwa/15 text-wuxing-hwa",
  earth: "bg-wuxing-to/15 text-wuxing-to",
  metal: "bg-wuxing-geum/15 text-wuxing-geum",
  water: "bg-wuxing-su/15 text-wuxing-su",
};

/**
 * 아이돌 한 명을 보여주는 선택 카드 (순수 프레젠테이션).
 * 공식 사진·로고는 쓰지 않고 이름 첫 글자 모노그램으로 대체한다 (CLAUDE.md).
 * 모노그램 배경은 일간 오행 색으로 칠해 사주 의미를 시각화.
 * radiogroup 안에서 단일 선택되는 radio로 동작.
 */
export function IdolCard({ idol, selected, onSelect }: IdolCardProps) {
  const initial = idol.name.charAt(0).toUpperCase();
  const element = elementOf(idol.saju.dayMaster);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${idol.name}, ${idol.group}`}
      onClick={() => onSelect(idol)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold",
          AVATAR[element],
        )}
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display font-semibold">
          {idol.name}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {idol.group}
        </span>
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/idols/idol-card.test.tsx`
Expected: PASS (all 5 tests — the 3 originals plus the 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/idols/idol-card.tsx src/components/idols/idol-card.test.tsx
git commit -m "feat(idols): element-colored avatar + name/group aria-label"
```

---

## Task 3: Compat share card mini-saju — element color + even spacing

**Files:**
- Modify: `src/components/compat/compat-share-card.test.tsx`
- Modify: `src/components/compat/compat-share-card.tsx`

- [ ] **Step 1: Write the failing test**

Add this `it` block inside `describe("CompatShareCard", ...)` in `src/components/compat/compat-share-card.test.tsx`:
```tsx
  it("colors the mini-saju hanja by element (辛 in 辛卯 → metal)", () => {
    const { container } = render(
      <CompatShareCard
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER }}
        result={RESULT}
      />,
    );
    // ME.day = 辛卯 → 辛 is metal → text-wuxing-geum
    expect(container.querySelector(".text-wuxing-geum")).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/compat/compat-share-card.test.tsx`
Expected: FAIL — mini-saju is still a plain bold string with no element color class.

- [ ] **Step 3: Implement colored, evenly-spaced mini-saju**

In `src/components/compat/compat-share-card.tsx`, update the import line to add the element helpers:
```tsx
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";
import { getReading } from "@/lib/reading";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
```

Then replace the `MiniSaju` component:
```tsx
function HanjaPillars({ pillars }: { pillars: SajuPillars }) {
  const cells = [pillars.year, pillars.month, pillars.day];
  return (
    <span className="hanja inline-flex items-center justify-center gap-2 text-xl font-bold">
      {cells.map((p, i) => (
        <span key={i} className="inline-flex gap-0.5">
          <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
          <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
        </span>
      ))}
    </span>
  );
}

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <HanjaPillars pillars={pillars} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/compat/compat-share-card.test.tsx`
Expected: PASS (the original render test still passes — it asserts score/label/names/watermark, none of which moved).

- [ ] **Step 5: Commit**

```bash
git add src/components/compat/compat-share-card.tsx src/components/compat/compat-share-card.test.tsx
git commit -m "feat(compat): element-colored, evenly-spaced mini-saju on share card"
```

---

## Task 4: Birth-time helper copy (BirthForm)

**Files:**
- Modify: `src/components/kst/birth-form.tsx`

- [ ] **Step 1: Update the copy**

In `src/components/kst/birth-form.tsx`, replace the birth-time `FormDescription` text:
```tsx
              <FormDescription className="text-xs">
                Optional — add your birth time for a more accurate hour pillar and reading.
              </FormDescription>
```
(Replaces `Needed for your full saju (12지지 hour pillar).` — removes the Korean jargon and the "Needed" wording that contradicted the "(optional)" label.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/kst/birth-form.tsx
git commit -m "copy(form): friendlier optional birth-time helper text"
```

---

## Task 5: Verification + docs

**Files:** Modify `task-log.md`, `CLAUDE.md`

- [ ] **Step 1: Full suite + type-check + lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all tests green (158 prior + 1 `ELEMENT_TEXT` + 2 idol-card + 1 compat-card = **162**), tsc clean, lint only the two pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds; `/`, `/inyeon`, `/about`, `/faq`, `/privacy`, `/terms` all static `○`. (Transient Google-font fetch error → re-run once.)

- [ ] **Step 3: Manual visual check (dev)**

Run: `npm run dev`. On `/`: enter a birthday, confirm the pillars-grid hanja have even spacing and element colors, and the birth-time helper reads the new copy. On `/inyeon`: open the idol picker — confirm each avatar is tinted by element (not all pink→gold), the screen-reader label is name+group; open a compatibility result and confirm the share-card mini-saju hanja are element-colored and evenly spaced. Check dark mode + mobile width. Report results.

- [ ] **Step 4: Update roadmap docs + commit**

Add a cycle-19 completion entry to `task-log.md` (new sub-section under `## 2026-06-08 (월)`, newest-at-top) and add a cycle-19 line to the `CLAUDE.md` roadmap (after item 18). Then:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 19 (visual polish) complete"
```

- [ ] **Step 5: Finish the branch**

Announce and use **superpowers:finishing-a-development-branch** to verify tests and present merge/PR options (expect: fast-forward merge `feat/visual-polish` → `main` + push, per the project workflow).

---

## Self-Review Notes (author)

- **Spec coverage:** ① element avatar → Task 2 ✓; ② hanja spacing + color (mini-saju **and** pillars grid, user-confirmed mini-saju colored) → Task 1 (grid) + Task 3 (mini-saju), shared `ELEMENT_TEXT` → Task 1 ✓; ③ name+group a11y label → Task 2 ✓; ④ birth-time copy → Task 4 ✓; tests (idol-card avatar+aria, compat-card color, ELEMENT_TEXT) → Tasks 1-3 ✓; verification gate + docs → Task 5 ✓. Non-goals (photos/logos, new palette, new components beyond the shared map, search changes, animation) — untouched ✓.
- **Placeholder scan:** none — every step shows literal code or an exact command.
- **Type consistency:** `ELEMENT_TEXT: Record<WuXing, string>` defined in Task 1 and imported in Tasks 1 (pillars-grid) & 3 (compat-share-card). `AVATAR: Record<WuXing, string>` is local to IdolCard (Task 2). `elementOf(char: string): WuXing` (existing) consumed in Tasks 2 & 3. `SajuPillars` (existing `{ year, month, day }`) used by `HanjaPillars`. Avatar uses `idol.saju.dayMaster` (existing `Idol` field, single stem hanja). Test fixtures reuse the existing `RM` (idol-card) and `ME/OTHER/RESULT` (compat-card) constants already in those files.
