# Idol DB Expansion — Design (Cycle 20)

**Date:** 2026-06-08
**Status:** Approved (brainstorming)

## Goal

Grow `data/ksaju-idol-db.json` with ~5 high-demand **boy groups** (≈5 members each,
~25 new idols) so more fans can check compatibility with their bias. The current DB
skews girl-group (10 girl groups vs 4 boy groups); this batch rebalances the catalog.
A reusable, dependency-free **seed script** computes each idol's saju from a curated
birthday list, so the DB stays correct and the process is repeatable.

## Why a script (not hand-editing)

`calculateSaju(year, month, day)` from `@fullstackfamily/manseryeok` (a pure-JS dep
already installed) reproduces the existing DB exactly — e.g. `calculateSaju(1992,9,12)`
returns RM's stored pillars (임신/壬申 · 기유/己酉 · 신묘/辛卯, dayMaster 辛). For a
Korea-born, date-only idol this is the same canonical path `saju.ts`'s `birthToSaju`
uses (KST no-op + `calculateSaju`). So the script imports manseryeok directly — no
`server-only` problem, no `tsx`, no new dependency. Both Korean (kr) and hanja readings
come straight from the manseryeok output.

## Proposed roster (USER: edit member list here before implementation)

5 boy groups × ~5 most globally-recognized members. **Member picks are a starting
point — swap freely.** Birthdays are intentionally NOT listed here; they are
WebSearch-verified during implementation and captured in `scripts/idol-seed.json`.

- **SEVENTEEN** — S.Coups, Jeonghan, Hoshi, Mingyu, Vernon
- **NCT** — Taeyong, Mark, Jaehyun, Haechan, Jeno
- **ATEEZ** — Hongjoong, Seonghwa, San, Wooyoung, Yeosang
- **ZEROBASEONE** — Sung Hanbin, Zhang Hao, Kim Jiwoong, Seok Matthew, Han Yujin
- **RIIZE** — Shotaro, Sungchan, Wonbin, Sohee, Anton

(Optional swap discussed: a girl group such as NMIXX could replace one boy group.)

## Birthday verification

Each member's birthday is **cross-verified via WebSearch against ≥2 reputable sources**
(e.g. Wikipedia + Namu Wiki / official profile) during implementation, before it goes
into `idol-seed.json`. Any birthday that can't be confidently confirmed by two sources
is dropped (or flagged for the user), not guessed. This is the one thing the script
cannot self-check: it guarantees birthday→saju correctness, never that the birthday
itself is right.

## Components

### `scripts/idol-seed.json` (new — curated input)
A flat array of `{ name, group, birthdate }` (birthdate ISO `YYYY-MM-DD`), one per new
member, filled from the WebSearch-verified roster. No saju here — the script derives it.

### `scripts/seed-idols.mjs` (new — generator)
Plain Node ESM. For each seed entry:
1. `const s = calculateSaju(y, m, d)` (parsed from `birthdate`).
2. Build the DB entry:
   ```js
   {
     id: `${slug(name)}-${slug(group)}`,   // mirrors existing "rm-bts"
     name, group, birthdate,
     saju: {
       year:  { kr: s.yearPillar,  hanja: s.yearPillarHanja },
       month: { kr: s.monthPillar, hanja: s.monthPillarHanja },
       day:   { kr: s.dayPillar,   hanja: s.dayPillarHanja },
       dayMaster: s.dayPillarHanja[0],
     },
   }
   ```
3. Append new entries to the existing `data/ksaju-idol-db.json` (preserve existing
   order; new groups appended after current ones) and write back pretty-printed (2-space,
   matching current formatting).
4. **Self-check before writing:** recompute every *existing* entry from its `birthdate`
   and assert the result deep-equals what's stored. If any existing entry mismatches,
   abort with a clear message (surfaces a bad stored birthday/pillar) — this satisfies
   the long-standing "re-verify idol birthdays" note and guarantees the new entries are
   produced by the identical path as the old ones.

`slug()` = lowercase, spaces→`-`, strip non-alphanumerics (so "Sung Hanbin" →
`sung-hanbin`, "(G)I-DLE"-style punctuation handled). Collisions get a numeric suffix.

### `package.json` (modify)
Add `"seed:idols": "node scripts/seed-idols.mjs"` so regeneration is one command.

### `src/lib/idols.test.ts` (modify — validation)
Add a DB-integrity `describe` that runs over the whole `idols` array:
- every `id` is unique;
- every entry has non-empty `name`, `group`, ISO `birthdate`, and full `saju`
  (year/month/day each with kr+hanja, plus dayMaster);
- `dayMaster === day.hanja[0]`;
- **regeneration check:** `calculateSaju(...birthdate)` deep-equals the stored pillars
  for every entry (kr + hanja). This locks the whole catalog — old and new — to
  manseryeok.
- the new group names appear in the exported `groups` list.

The existing `idols.ts` loader, search, and `compatForIdol` are **unchanged** — the DB
just has more rows, so search/selection/compat pick them up automatically.

## Testing

- New validation tests in `idols.test.ts` (above) — these are the real safety net and
  run in CI/`npm test`.
- `scripts/seed-idols.mjs` is a build-time tool; its correctness is proven by the
  validation tests on its output + the in-script self-check, so it needs no separate
  unit test.
- Full gate: `npm test` + `npx tsc --noEmit` + `npm run lint` + `npm run build` (routes
  still static; the JSON import grows but stays static).

## Non-Goals (YAGNI)

- Official photos or logos (CLAUDE.md forbids; monogram avatars only).
- Schema changes, hour pillar, or group metadata (debut year, etc.).
- Any change to `idols.ts`, search, or compatibility logic.
- i18n. New girl groups (this cycle is the boy-group rebalance batch).

## Risks

- **Birthday accuracy** is the sole real risk; mitigated by ≥2-source WebSearch
  verification + final user eyeball of `idol-seed.json`.
- A new member duplicating an existing idol's stage name across groups is disambiguated
  by the group-suffixed `id` and the existing name+group UI (cycle 19).
