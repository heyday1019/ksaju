# Idol DB Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~25 members across 5 boy groups (SEVENTEEN, NCT, ATEEZ, ZEROBASEONE, RIIZE) to `data/ksaju-idol-db.json`, with saju computed by a repeatable seed script and locked by a regeneration test.

**Architecture:** A curated `scripts/idol-seed.json` (`{name, group, birthdate}`, birthdays WebSearch-verified) feeds a dependency-free Node generator (`scripts/seed-idols.mjs`) that calls `@fullstackfamily/manseryeok`'s `calculateSaju(y,m,d)` — the same engine `saju.ts` uses — to produce each entry's kr+hanja pillars and dayMaster, then appends to the DB. A new regeneration test in `idols.test.ts` asserts every entry (old and new) deep-equals `calculateSaju(birthdate)`, so the whole catalog stays manseryeok-correct. `idols.ts` and all UI are unchanged — the DB just grows.

**Tech Stack:** Node ESM script + `@fullstackfamily/manseryeok` (already installed), vitest. No new dependencies, no `tsx`.

**Spec:** `docs/superpowers/specs/2026-06-08-idol-db-expansion-design.md`

---

## File Structure

- `src/lib/idols.test.ts` (modify) — add regeneration invariant test (Task 1); update count + new-group assertions (Task 3).
- `scripts/idol-seed.json` (create) — curated `{name, group, birthdate}` list (Task 2).
- `scripts/seed-idols.mjs` (create) — generator: self-check existing + append new (Task 3).
- `data/ksaju-idol-db.json` (modify) — regenerated with ~25 new entries (Task 3, by the script).
- `package.json` (modify) — add `seed:idols` script (Task 3).
- `CLAUDE.md`, `task-log.md` (modify) — roadmap/log (Task 4).

**Verified pre-condition:** all 76 existing entries already regenerate cleanly from their birthdays via `calculateSaju` (0 mismatches), so the regeneration test passes on the current DB.

---

## Task 1: Regeneration invariant test (guards the whole catalog)

**Files:**
- Modify: `src/lib/idols.test.ts`

- [ ] **Step 1: Add the manseryeok import**

At the top of `src/lib/idols.test.ts`, add after the existing imports:
```ts
import { calculateSaju } from "@fullstackfamily/manseryeok";
```

- [ ] **Step 2: Add the regeneration test**

Inside the existing `describe("idols 데이터 로드", ...)` block (e.g. right after the `dayMaster` test), add:
```ts
  it("모든 엔트리의 사주가 생일로 재계산한 결과와 일치한다", () => {
    for (const i of idols) {
      const [y, m, d] = i.birthdate.split("-").map(Number);
      const s = calculateSaju(y, m, d);
      expect(i.saju.year.hanja).toBe(s.yearPillarHanja);
      expect(i.saju.year.kr).toBe(s.yearPillar);
      expect(i.saju.month.hanja).toBe(s.monthPillarHanja);
      expect(i.saju.month.kr).toBe(s.monthPillar);
      expect(i.saju.day.hanja).toBe(s.dayPillarHanja);
      expect(i.saju.day.kr).toBe(s.dayPillar);
      expect(i.saju.dayMaster).toBe(s.dayPillarHanja[0]);
    }
  });
```

- [ ] **Step 3: Run the test (passes on the current 76-entry DB)**

Run: `npx vitest run src/lib/idols.test.ts`
Expected: PASS — this is an invariant the existing DB already satisfies. It now guards every entry the seed script will add.

- [ ] **Step 4: Commit**

```bash
git add src/lib/idols.test.ts
git commit -m "test(idols): regeneration invariant — saju must match calculateSaju(birthdate)"
```

---

## Task 2: Curated seed list with WebSearch-verified birthdays

**Files:**
- Create: `scripts/idol-seed.json`

- [ ] **Step 1: WebSearch-verify each member's birthday**

For each of the 5 groups, run a WebSearch (e.g. `"SEVENTEEN members birthdays"`, then spot-check individuals) and cross-verify each birthday against **≥2 reputable sources** (Wikipedia + Namu Wiki / official profile). Roster (swap members only if the user asked):

- **SEVENTEEN** — S.Coups, Jeonghan, Hoshi, Mingyu, Vernon
- **NCT** — Taeyong, Mark, Jaehyun, Haechan, Jeno
- **ATEEZ** — Hongjoong, Seonghwa, San, Wooyoung, Yeosang
- **ZEROBASEONE** — Sung Hanbin, Zhang Hao, Kim Jiwoong, Seok Matthew, Han Yujin
- **RIIZE** — Shotaro, Sungchan, Wonbin, Sohee, Anton

If a birthday cannot be confirmed by two sources, **drop that member** (note it) rather than guessing.

- [ ] **Step 2: Write `scripts/idol-seed.json`**

A flat JSON array; one object per verified member, group `name` exactly as it should display, `birthdate` ISO `YYYY-MM-DD`. Shape (values filled from Step 1):
```json
[
  { "name": "S.Coups", "group": "SEVENTEEN", "birthdate": "1995-08-08" },
  { "name": "Mingyu", "group": "SEVENTEEN", "birthdate": "1997-04-06" }
]
```
(The two rows above are the format example — include every verified member.)

- [ ] **Step 3: Sanity-check the file parses and has the expected shape**

Run:
```bash
node -e "const s=require('./scripts/idol-seed.json'); console.log('seed entries:', s.length); for (const e of s) { if(!/^\d{4}-\d{2}-\d{2}$/.test(e.birthdate)||!e.name||!e.group) throw new Error('bad row '+JSON.stringify(e)); } console.log('all rows well-formed');"
```
Expected: prints the entry count and `all rows well-formed`.

- [ ] **Step 4: Commit**

```bash
git add scripts/idol-seed.json
git commit -m "data(idols): curated boy-group seed list (WebSearch-verified birthdays)"
```

---

## Task 3: Seed generator + expand the DB

**Files:**
- Create: `scripts/seed-idols.mjs`
- Modify: `package.json`
- Modify: `data/ksaju-idol-db.json` (written by the script)
- Modify: `src/lib/idols.test.ts`

- [ ] **Step 1: Write the generator**

Create `scripts/seed-idols.mjs`:
```js
// Regenerates data/ksaju-idol-db.json from scripts/idol-seed.json.
// Saju is computed with manseryeok's calculateSaju — the same engine saju.ts uses.
// Self-checks every EXISTING entry against its birthday before writing (catches drift),
// and is idempotent: members whose id already exists are skipped.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calculateSaju } from "@fullstackfamily/manseryeok";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = join(root, "data", "ksaju-idol-db.json");
const seedPath = join(root, "scripts", "idol-seed.json");

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const entryFor = ({ name, group, birthdate }) => {
  const [y, m, d] = birthdate.split("-").map(Number);
  const s = calculateSaju(y, m, d);
  return {
    id: `${slug(name)}-${slug(group)}`,
    name,
    group,
    birthdate,
    saju: {
      year: { kr: s.yearPillar, hanja: s.yearPillarHanja },
      month: { kr: s.monthPillar, hanja: s.monthPillarHanja },
      day: { kr: s.dayPillar, hanja: s.dayPillarHanja },
      dayMaster: s.dayPillarHanja[0],
    },
  };
};

const db = JSON.parse(readFileSync(dbPath, "utf8"));

// Self-check: every existing entry must regenerate from its birthdate.
for (const i of db) {
  const fresh = entryFor(i);
  const a = JSON.stringify(i.saju);
  const b = JSON.stringify(fresh.saju);
  if (a !== b) {
    throw new Error(`Existing entry ${i.id} no longer matches calculateSaju(${i.birthdate}). Stored ${a} vs ${b}.`);
  }
}

const existingIds = new Set(db.map((i) => i.id));
const seed = JSON.parse(readFileSync(seedPath, "utf8"));

let added = 0;
const collisions = [];
for (const row of seed) {
  const entry = entryFor(row);
  if (existingIds.has(entry.id)) {
    collisions.push(entry.id);
    continue;
  }
  existingIds.add(entry.id);
  db.push(entry);
  added++;
}

writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n");
console.log(`Self-check OK. Added ${added} new idol(s). Total now ${db.length}.`);
if (collisions.length) console.log(`Skipped existing ids: ${collisions.join(", ")}`);
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"`:
```json
    "seed:idols": "node scripts/seed-idols.mjs",
```

- [ ] **Step 3: Run the generator**

Run: `npm run seed:idols`
Expected: `Self-check OK. Added <N> new idol(s). Total now <76+N>.` (no thrown error). If it throws on an existing entry, stop — the stored DB drifted from manseryeok and must be investigated before continuing.

- [ ] **Step 4: Update the count + new-group assertions in `idols.test.ts`**

In `src/lib/idols.test.ts`, change the count test to the new total reported by Step 3 (76 + verified seed entries; if all 25 roster members verified, **101**):
```ts
  it("전체 아이돌을 로드한다", () => {
    expect(idols.length).toBe(101);
  });
```
(Use the actual `Total now` number from Step 3 if fewer than 25 verified.)

Then add a new-groups test inside the same `describe("idols 데이터 로드", ...)`:
```ts
  it("새 보이그룹들이 groups에 포함된다", () => {
    for (const g of ["SEVENTEEN", "NCT", "ATEEZ", "ZEROBASEONE", "RIIZE"]) {
      expect(groups).toContain(g);
    }
  });
```

- [ ] **Step 5: Run the idols test (now over the expanded DB)**

Run: `npx vitest run src/lib/idols.test.ts`
Expected: PASS — regeneration holds for all entries, count matches, new groups present.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-idols.mjs package.json data/ksaju-idol-db.json src/lib/idols.test.ts
git commit -m "feat(idols): expand DB with 5 boy groups via reusable seed script"
```

---

## Task 4: Verification + docs

**Files:** Modify `CLAUDE.md`, `task-log.md`

- [ ] **Step 1: Full suite + type-check + lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all green (162 prior + 1 regeneration + 1 new-groups = **164**), tsc clean, lint only the two pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds; all routes static `○`. (The larger JSON import is still bundled statically; transient Google-font fetch error → re-run once.)

- [ ] **Step 3: Manual spot-check (dev)**

Run: `npm run dev`. On `/inyeon`, open the idol picker and search a new member (e.g. "Mingyu", "Mark", "San"). Confirm: they appear with group + element-tinted avatar (cycle 19), selecting them yields a compatibility result and a share card with their mini-saju. Report results.

- [ ] **Step 4: Update roadmap docs + commit**

Update `CLAUDE.md`'s idol-DB section (76명/14그룹 → new totals, e.g. **101명/19그룹**, list the 5 added boy groups; note saju is regenerated by `scripts/seed-idols.mjs` and locked by the regeneration test). Add a cycle-20 line to the roadmap (after item 19). Add a cycle-20 completion entry to `task-log.md` (newest-at-top under `## 2026-06-08 (월)`). Then:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 20 (idol DB expansion) complete"
```

- [ ] **Step 5: Finish the branch**

Announce and use **superpowers:finishing-a-development-branch** to verify tests and present merge/PR options (expect: fast-forward merge `feat/idol-db-expansion` → `main` + push, per the project workflow).

---

## Self-Review Notes (author)

- **Spec coverage:** seed-script approach → Task 3 ✓; roster (5 boy groups × ~5) → Task 2 ✓; WebSearch ≥2-source birthday verification, drop-if-unconfirmed → Task 2 Step 1 ✓; `scripts/idol-seed.json` → Task 2 ✓; `scripts/seed-idols.mjs` (slug, calculateSaju mapping, append, existing self-check, idempotent) → Task 3 Step 1 ✓; `package.json` seed script → Task 3 Step 2 ✓; validation tests (uniqueness/schema/dayMaster already existed; regeneration + new-groups added) → Task 1 + Task 3 Step 4 ✓; `idols.ts`/UI unchanged → confirmed (no task touches them) ✓; full gate + dev spot-check → Task 4 ✓. Non-goals (photos, schema change, hour pillar, group metadata, i18n, girl groups) — untouched ✓.
- **Placeholder scan:** the only data-dependent values are the WebSearch-verified birthdays (Task 2, gathered at execution — the nature of the task) and the exact final count (Task 3 Step 4, taken from the script's printed total). No code placeholders.
- **Type/shape consistency:** `entryFor` emits the exact `Idol` shape from `idols.ts` (`{id, name, group, birthdate, saju:{year:{kr,hanja}, month:{kr,hanja}, day:{kr,hanja}, dayMaster}}`). The regeneration test (Task 1) reads the same fields the generator writes. `calculateSaju` return fields (`yearPillar`/`yearPillarHanja`/…/`dayPillarHanja`) verified against the live library output. `slug`/`id` mirror the existing `"rm-bts"` convention.
