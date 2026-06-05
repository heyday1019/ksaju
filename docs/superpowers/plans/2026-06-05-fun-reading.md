# Fun Reading on the Compat Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personalized 2-3 line fun reading to the compatibility share card, sourced from a curated offline-authored library (no runtime LLM), to drive sharing.

**Architecture:** A static `data/ksaju-readings.json` (25 ordered element-pair lines + 3 score-tier tails). A pure `src/lib/reading.ts` (`getReading`) derives both day-master elements and composes `pairLine + tierTail` deterministically — same pattern as `fortune.ts`. `CompatShareCard` calls it internally and renders the reading as the hero, replacing the breakdown bullets.

**Tech Stack:** TypeScript, JSON import (resolveJsonModule already on — see `idols.ts`), vitest, React.

**Spec:** `docs/superpowers/specs/2026-06-05-fun-reading-design.md`

---

## File Structure

- `data/ksaju-readings.json` (create) — curated copy library (`pairs` 5×5, `tiers` 3).
- `src/lib/reading.ts` (create) — `getReading(mePillars, otherPillars, score)` pure function.
- `src/lib/reading.test.ts` (create) — determinism, composition, tier boundaries, completeness.
- `src/components/compat/compat-share-card.tsx` (modify) — render reading hero, remove breakdown bullets.
- `src/components/compat/compat-share-card.test.tsx` (modify) — assert reading shown + breakdown gone.

---

## Task 1: Curated reading library (`data/ksaju-readings.json`)

**Files:** Create `data/ksaju-readings.json`

> Authored offline (this is the "LLM as writer" step). **User reviews this copy** before merge (Task 4). Element imagery: fire=spark/burn, water=flow/deep, wood=grow/root, metal=sharp/edge, earth=steady/ground. Lines name both elements, fun + light + teen-safe, "Your X meets their Y" (you first).

- [ ] **Step 1: Write the file**

Create `data/ksaju-readings.json`:
```json
{
  "pairs": {
    "wood": {
      "wood": "Two Wood spirits — you grow toward the same sun, roots quietly tangling.",
      "fire": "Your Wood feeds their Fire — you make them blaze, they make you feel alive.",
      "earth": "Your Wood reaches into their Earth — you push, they hold steady. Grounded growth.",
      "metal": "Your Wood meets their Metal — they trim your wild branches. Sparks, then shape.",
      "water": "Your Wood drinks their Water — they pour, you bloom. Easy, nourishing energy."
    },
    "fire": {
      "wood": "Your Fire is fed by their Wood — they hand you fuel, you light up the room together.",
      "fire": "Your Fire meets their Fire — twin sparks that just get each other.",
      "earth": "Your Fire warms their Earth — you bring the heat, they make it home.",
      "metal": "Your Fire meets their Metal — you melt their cool exterior. Intense, transformative.",
      "water": "Your Fire meets their Water — steam, tension, and undeniable pull."
    },
    "earth": {
      "wood": "Your Earth holds their Wood — you steady them, they keep you growing. Quiet teamwork.",
      "fire": "Your Earth soaks up their Fire — they spark you, you give them somewhere to land.",
      "earth": "Two Earth souls — solid, loyal, unshakeable. The kind that lasts.",
      "metal": "Your Earth births their Metal — you ground them, they sharpen you. A natural fit.",
      "water": "Your Earth meets their Water — you shape their flow, they soften your edges."
    },
    "metal": {
      "wood": "Your Metal meets their Wood — you cut through their tangle. Push-pull with purpose.",
      "fire": "Your Metal meets their Fire — they melt you down and remake you. Risky, electric.",
      "earth": "Your Metal is forged in their Earth — they ground you, you give them an edge.",
      "metal": "Two Metal hearts — sharp minds, high standards, real respect when you click.",
      "water": "Your Metal feeds their Water — you give them shape, they keep you flowing. Cool and clear."
    },
    "water": {
      "wood": "Your Water feeds their Wood — you pour, they bloom. You help each other grow.",
      "fire": "Your Water meets their Fire — opposites that sizzle. Cool meets heat, sparks fly.",
      "earth": "Your Water meets their Earth — they channel your flow. Steady banks for a restless current.",
      "metal": "Your Water is poured from their Metal — they shape you, you keep them shining. Smooth.",
      "water": "Two Water souls — deep, intuitive, flowing as one. You read each other without words."
    }
  },
  "tiers": {
    "high": "You'd shine brightest side by side. ✨",
    "mid": "Different energies, real spark — worth the dance. 💫",
    "low": "Opposites that test each other — handle with care. 🌙"
  }
}
```

- [ ] **Step 2: Validate JSON parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/ksaju-readings.json','utf8')); console.log('valid JSON')"`
Expected: prints `valid JSON`.

- [ ] **Step 3: Commit**

```bash
git add data/ksaju-readings.json
git commit -m "feat(reading): curated fun-reading copy library (25 pairs + 3 tiers)"
```

---

## Task 2: `reading.ts` pure function (TDD)

**Files:**
- Create: `src/lib/reading.ts`
- Test: `src/lib/reading.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/reading.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getReading } from "./reading";
import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { SajuPillars } from "./compatibility";

const lib = readings as {
  pairs: Record<string, Record<string, string>>;
  tiers: Record<string, string>;
};

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

/** Build pillars whose day-master stem maps to the given element. */
function pillarsFor(element: string): SajuPillars {
  const stem = HEAVENLY_STEMS.find((s) => s.element === element)!.char;
  return { year: `${stem}子`, month: `${stem}子`, day: `${stem}子` };
}

describe("getReading", () => {
  it("is deterministic — same inputs give the same reading", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("fire");
    expect(getReading(me, other, 80)).toBe(getReading(me, other, 80));
  });

  it("composes the pair line + score-tier tail", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("water");
    const out = getReading(me, other, 80);
    expect(out).toContain(lib.pairs.fire.water);
    expect(out).toContain(lib.tiers.high);
  });

  it("tier boundaries: 75=high, 74=mid, 50=mid, 49=low", () => {
    const me = pillarsFor("wood");
    const other = pillarsFor("wood");
    expect(getReading(me, other, 75)).toContain(lib.tiers.high);
    expect(getReading(me, other, 74)).toContain(lib.tiers.mid);
    expect(getReading(me, other, 50)).toContain(lib.tiers.mid);
    expect(getReading(me, other, 49)).toContain(lib.tiers.low);
  });

  it("every element pair resolves to a non-empty line (no missing cells)", () => {
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        expect(typeof lib.pairs[a][b]).toBe("string");
        expect(lib.pairs[a][b].length).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/reading.test.ts`
Expected: FAIL — `./reading` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/reading.ts`:
```ts
import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { WuXing } from "./saju-types";
import type { SajuPillars } from "./compatibility";

// 천간 한자 → 오행 (compatibility.ts의 STEM_ELEMENT는 private이라 동일 소스에서 재파생).
const STEM_ELEMENT: Record<string, WuXing> = Object.fromEntries(
  HEAVENLY_STEMS.map((s) => [s.char, s.element]),
);

type ScoreTier = "high" | "mid" | "low";

const lib = readings as {
  pairs: Record<WuXing, Record<WuXing, string>>;
  tiers: Record<ScoreTier, string>;
};

function tierOf(score: number): ScoreTier {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

/**
 * Deterministic 2-3 line fun reading for a compatibility pair.
 * Keyed on (my day-master element × their day-master element × score tier).
 */
export function getReading(
  mePillars: SajuPillars,
  otherPillars: SajuPillars,
  score: number,
): string {
  const myEl = STEM_ELEMENT[mePillars.day[0]];
  const theirEl = STEM_ELEMENT[otherPillars.day[0]];
  const pairLine = lib.pairs[myEl][theirEl];
  return `${pairLine} ${lib.tiers[tierOf(score)]}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/reading.test.ts`
Expected: PASS (4 cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reading.ts src/lib/reading.test.ts
git commit -m "feat(reading): deterministic getReading (element pair × score tier)"
```

---

## Task 3: Render the reading as the card hero (replace breakdown)

**Files:**
- Modify: `src/components/compat/compat-share-card.tsx`
- Modify: `src/components/compat/compat-share-card.test.tsx`

- [ ] **Step 1: Update the card test (TDD)**

In `src/components/compat/compat-share-card.test.tsx`, add an import at the top:
```tsx
import { getReading } from "@/lib/reading";
```
Inside the existing `it("renders score, label, both names and the watermark", ...)` test, before the closing `});`, add:
```tsx
    // reading hero is rendered; analytical breakdown is gone
    expect(
      screen.getByText(getReading(ME, OTHER, RESULT.score)),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Day Master:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Branch:/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/compat/compat-share-card.test.tsx`
Expected: FAIL — reading text not present yet (and `Day Master:` still present).

- [ ] **Step 3: Add the reading, remove the breakdown**

In `src/components/compat/compat-share-card.tsx`:

(a) Add the import after the existing imports:
```tsx
import { getReading } from "@/lib/reading";
```

(b) Inside the component body, after the `headerLabel` line, add:
```tsx
    const reading = getReading(mePillars, other.pillars, result.score);
```

(c) Replace the score/label `<div>` + breakdown `<ul>` region. Replace this block:
```tsx
          <div>
            <p className="font-display text-7xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {result.score}
              <span className="text-3xl text-muted-foreground">/100</span>
            </p>
            <p className="font-serif text-xl font-bold text-foreground">
              {result.label}
            </p>
          </div>

          <div className="flex w-full items-center justify-around rounded-xl border border-border bg-card/60 py-4">
            <MiniSaju label="You" pillars={mePillars} />
            <span className="font-calli text-3xl text-accent">×</span>
            <MiniSaju label={other.name} pillars={other.pillars} />
          </div>

          <ul className="space-y-1 text-left text-xs text-muted-foreground">
            <li>
              <strong className="text-primary">Day Master:</strong>{" "}
              {result.breakdown.dayMaster.note}
            </li>
            <li>
              <strong className="text-primary">Branch:</strong>{" "}
              {result.breakdown.branch.note}
            </li>
          </ul>
```
with:
```tsx
          <div>
            <p className="font-display text-7xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {result.score}
              <span className="text-3xl text-muted-foreground">/100</span>
            </p>
            <p className="font-serif text-xl font-bold text-foreground">
              {result.label}
            </p>
          </div>

          <p className="font-serif text-base leading-relaxed text-foreground">
            {reading}
          </p>

          <div className="flex w-full items-center justify-around rounded-xl border border-border bg-card/60 py-4">
            <MiniSaju label="You" pillars={mePillars} />
            <span className="font-calli text-3xl text-accent">×</span>
            <MiniSaju label={other.name} pillars={other.pillars} />
          </div>
```

- [ ] **Step 4: Run the card tests**

Run: `npx vitest run src/components/compat/compat-share-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full suite + type-check**

Run: `npm test && npx tsc --noEmit`
Expected: PASS — all green (the modal smoke test and compatibility-modal tests still pass; they don't assert breakdown text).

- [ ] **Step 6: Commit**

```bash
git add src/components/compat/compat-share-card.tsx src/components/compat/compat-share-card.test.tsx
git commit -m "feat(reading): reading is the card hero; drop breakdown bullets"
```

---

## Task 4: Copy review, verification + docs

**Files:** Modify `task-log.md`, `CLAUDE.md`

- [ ] **Step 1: Surface the copy for user review**

Present all 25 pair lines + 3 tier tails from `data/ksaju-readings.json` to the user for tone/safety review. Apply any edits they request directly to the JSON (re-run `npx vitest run src/lib/reading.test.ts` after edits — completeness test must stay green) and commit:
```bash
git add data/ksaju-readings.json
git commit -m "copy(reading): apply user review edits"
```
(If no edits, skip this commit.)

- [ ] **Step 2: Full verification**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: tests green (≈154), tsc clean, lint only the 2 pre-existing warnings.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds. (Transient Google-font fetch error → re-run once.)

- [ ] **Step 4: Manual visual check (dev)**

Run: `npm run dev`. In the browser: `/inyeon` → pick an idol → modal shows the reading under the score/label, breakdown bullets gone; Share PNG includes the reading. Try a partner birthday → reading also appears. Report results.

- [ ] **Step 5: Update roadmap docs + commit**

Add a cycle-16 completion entry to `task-log.md` (work, decisions, commits) and a one-line note in `CLAUDE.md` that the compat card now shows a curated fun reading (no runtime LLM). Then:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 16 (compat card fun reading) complete"
```

---

## Self-Review Notes (author)

- **Spec coverage:** curated library JSON (25 pairs + 3 tiers) → T1 ✓; `getReading` pure/deterministic, element-derive, tier composition → T2 ✓; card hero + breakdown removal → T3 ✓; idol+partner both (card calls getReading internally with `other.pillars`) → T3 ✓; determinism + completeness tests → T2 ✓; copy review by user → T4 ✓; tone/safety (all lines in reviewed JSON) → T1/T4 ✓. Out-of-scope (runtime LLM/KV/API key, fortune card, i18n) — no task touches them ✓.
- **Type consistency:** `getReading(mePillars, otherPillars, score)` signature matches the card call `getReading(mePillars, other.pillars, result.score)` and all test calls. JSON shape `{ pairs: Record<WuXing,Record<WuXing,string>>, tiers: Record<"high"|"mid"|"low",string> }` consistent between `reading.ts` and the test's `lib` cast. `WuXing` values (`wood|fire|earth|metal|water`) match the JSON keys and `saju-types`. `STEM_ELEMENT` derived from `HEAVENLY_STEMS` (`.char`/`.element`), same as compatibility.ts.
- **Placeholders:** none — JSON content, function, and edits are all complete.
