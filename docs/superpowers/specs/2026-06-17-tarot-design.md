# Tarot — Card of the Day — Design Spec

**Date:** 2026-06-17
**Cycle:** 26 (tarot)
**Status:** Approved

---

## 1. Overview

A new `/tarot` page where a user draws their **Card of the Day** — one tarot card,
deterministically chosen from their saju + today's KST date, with a short fun
reading personalized by their **일간(Day Master)**, and a 9:16 PNG share card.

The card is **locked for the day** (same card all day, refreshes at KST midnight),
building a daily-return habit like Daily Fortune. The reading text is generated via
OpenRouter (Claude Haiku) and cached in Supabase, grounded by per-card `theme` +
`keywords` already committed to `docs/tarot-cards.csv`.

**Locked decisions (from brainstorming):**
1. **Single Card of the Day** — 1 card → 1 reading → 1 share. No spreads.
2. **One locked card per day** — deterministic from full saju 4-pillar string + KST date.
3. **Inline birthday gate** — draw immediately if saju is in localStorage; otherwise show
   a compact `BirthForm` → `calcUserSaju` → `saveUserSaju`, then draw.
4. **Upright only** — no reversed meanings.

**Reference assets (already committed, commit `7e45f4d`):**
- `public/tarot/*.png` — 78 Joseon-style card images.
- `docs/tarot-cards.csv` — 78 rows with `name_en`, `name_kr`, `card_prompt`, `theme`,
  `keywords`, `filename`, `suit`, `rank`.

---

## 2. Architecture

```
/[locale]/tarot  (server page → metadata)
  └── TarotView (client)
        ├── loadUserSaju() from localStorage  ── none ──▶ <BirthForm> → calcUserSaju → saveUserSaju ──┐
        │                                                                                              │
        └── saju present ◀───────────────────────────────────────────────────────────────────────────┘
              └── drawDailyCard(saju, kstToday)  → TarotCard (deterministic, client-side, no LLM)
                    └── TarotDraw (card image + flip reveal)
                          └── GET /api/tarot-reading?cardId=&dayMaster=&locale=
                                ├── KST today date
                                ├── Supabase SELECT (date, card_id, day_master, locale) → hit → return
                                └── miss
                                      ├── OpenRouter fetch (claude-haiku-4-5-20251001)
                                      ├── Supabase upsert
                                      └── return  (LLM/DB fail → static fallback, not saved)
```

**No new npm packages.** OpenRouter via native `fetch` (server-only in the route).
`src/lib/tarot.ts` is **client-safe** (pure string hashing + static JSON — no manseryeok),
so the draw runs in the browser using the localStorage saju.

Mirrors the Daily Fortune feature (`src/app/api/daily-fortune/route.ts`,
`src/components/DailyFortune.tsx`) almost exactly; reuses the cycle-13 image-export engine
(`useShareImage`) and the cycle-22 `ShareCardFooter` (QR).

---

## 3. Card Data: CSV → JSON seed

`scripts/seed-tarot.mjs` (`npm run seed:tarot`) reads `docs/tarot-cards.csv` and emits the
committed runtime file `data/ksaju-tarot.json` — a lean array the app imports:

```json
[
  {
    "id": 0,
    "suit": "major",
    "rank": "0",
    "name_en": "The Fool",
    "name_kr": "광대",
    "filename": "major-00-fool.png",
    "element": "fire",
    "theme": "a free spirit, unbound",
    "keywords": "pure heart; new beginnings; boundless possibility"
  }
]
```

- **`element`** derived from `suit`: `wands→fire`, `cups→water`, `swords→metal`,
  `pentacles→earth`. Major arcana: `element: null`. This is the card's *suit* wuxing
  (metadata). **Color accent throughout the UI uses the reader's day-master element**
  (`elementOf(saju.dayMaster)`, `ELEMENT_TEXT` tokens) — consistent with the rest of the
  app's personalization — not the card's suit element.
- `card_prompt` (the image-gen scene text) is **not** copied into the runtime JSON — `theme`
  + `keywords` are the tighter LLM grounding. Keeps the bundle small.
- A **regeneration-invariant test** (`src/lib/tarot.test.ts`) re-runs the seed transform and
  asserts it matches the committed JSON (same pattern as the idol-DB seed). This pins the
  78-card data and catches accidental CSV drift.

**Type** (`src/lib/tarot.ts`):
```typescript
export type TarotCard = {
  id: number;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  rank: string;
  name_en: string;
  name_kr: string;
  filename: string;
  element: WuXing | null;
  theme: string;
  keywords: string;
};
```

---

## 4. Card Draw: `src/lib/tarot.ts`

```typescript
import tarot from "../../data/ksaju-tarot.json";
import type { UserSaju } from "./saju-types";

export const TAROT_CARDS = tarot as TarotCard[]; // length 78

/** KST "YYYY-MM-DD" for today (client-safe; matches the API's date logic). */
export function kstDateString(now = new Date()): string { ... }

/**
 * Deterministic Card of the Day.
 * Seed = full pillar string + date → stable per (person, day), varied per person.
 */
export function drawDailyCard(saju: UserSaju, dateStr: string): TarotCard {
  const seed = `${saju.pillars.year}${saju.pillars.month}${saju.pillars.day}${saju.pillars.hour ?? ""}|${dateStr}`;
  const idx = fnv1a(seed) % TAROT_CARDS.length; // 0..77
  return TAROT_CARDS[idx];
}
```

- `fnv1a` = small deterministic 32-bit string hash (no crypto dependency).
- Uses the **full 4-pillar string** (not just day master) so the card feels personal
  (high entropy), while the *reading* only varies by `(card × day_master × locale × date)` —
  exactly the cache key, since `theme`/`keywords` + day-master element are all the LLM sees.
- `element` lookup helper: `elementOf(saju.dayMaster)` from `saju-display.ts`.

---

## 5. Supabase Table

Append to `docs/supabase-migration.sql`:

```sql
CREATE TABLE tarot_readings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date NOT NULL,
  card_id     integer NOT NULL CHECK (card_id >= 0 AND card_id <= 77),
  day_master  text NOT NULL,        -- one of 10 heavenly stems
  locale      text NOT NULL DEFAULT 'en',
  message     text NOT NULL,        -- LLM-generated 2-3 line reading
  created_at  timestamptz DEFAULT now(),
  UNIQUE(date, card_id, day_master, locale)
);
```

**RLS:** not needed — reads/writes are via the service-role key on the server only
(same as `daily_fortunes`). Max LLM calls/day bounded by 78 × 10 × 4 = 3,120 (realistically
far fewer; cache makes repeats free).

---

## 6. API Route: `src/app/api/tarot-reading/route.ts`

**Method:** `GET ?cardId=17&dayMaster=辛&locale=en`
**Config:** `export const dynamic = "force-dynamic";` (same fix as daily-fortune — route must
run every request so the Supabase date cache works; no CDN caching of the handler).

**Response:**
```json
{ "id": "...", "date": "2026-06-17", "card_id": 17, "day_master": "辛", "locale": "en",
  "message": "The Star says your glow-up era is loading — keep that pure heart and the universe will match your energy. ✨" }
```

**Logic:**
1. Validate `cardId` ∈ 0..77, `dayMaster` ∈ 10 stems, `locale` ∈ routing.locales (default `en`). 400 if card/stem invalid.
2. Compute KST today `YYYY-MM-DD`.
3. Supabase SELECT on `(date, card_id, day_master, locale)` → hit → return cached row.
4. Miss → OpenRouter fetch (`anthropic/claude-haiku-4-5-20251001`, `max_tokens: 160`, `temperature: 0.85`).
5. Validate the returned text is a non-empty string (≤ ~280 chars); upsert on conflict; return row.
6. **Fail (LLM/parse/DB)** → static fallback (not saved): a generic upbeat line built from the
   card's `theme`. UI renders it normally — no error state.

**OpenRouter prompt** (card data looked up server-side from `data/ksaju-tarot.json` by `cardId`):
```
The drawn tarot card is "{name_en}" ({name_kr}). Its upright theme: "{theme}".
Keywords: {keywords}. The reader's saju day master is {dayMaster} ({elementLabel}).

Write a 2-3 sentence (35-55 word) upright tarot reading for a K-pop fan, in {lang}.
Tone: warm, playful, Gen Z, encouraging and teen-safe (no romance-heavy or scary framing).
Lightly connect the card's meaning to their {elementLabel} energy. End on an uplifting note.

Respond ONLY with the reading text — no JSON, no card name header, no markdown.
```
- `lang` from `LANG_MAP` (en/ja/ko/zh-TW) — reused pattern from daily-fortune.
- `elementLabel` from `WUXING_META[elementOf(dayMaster)].label`.

**Env var:** reuses existing `OPENROUTER_API_KEY` (no new var).

---

## 7. UI Components (`src/components/tarot/`)

### `tarot-view.tsx` (client, orchestrator)
- On mount: `loadUserSaju()`.
  - **null** → render `<BirthForm>` (reused; `submitLabel`="Reveal my card ✨") → on submit call
    `calcUserSaju` → `saveUserSaju` → set saju state.
  - **present** → render `<TarotDraw saju={saju} />`.
- A small "Change birthday" affordance resets to the form (reuses existing state).

### `tarot-draw.tsx` (client)
- `card = drawDailyCard(saju, kstDateString())`.
- Initial state: face-down card back → tap **"Draw your card 🃏"** flips to reveal the image
  (`/tarot/{filename}`) with the card name + `theme`.
- After reveal: `useEffect` fetch `GET /api/tarot-reading?cardId=&dayMaster=&locale=` →
  render reading (skeleton while loading, fallback-safe).
- Buttons: **Share ✨** (opens modal) + "Come back tomorrow 🌙".
- Card image framed with the day-master ohaeng accent (reuse `ELEMENT_TEXT` tokens).
- Analytics: `card_generated` on reveal; `share_clicked { kind: "tarot" }` on share.

### `tarot-share-card.tsx` (client)
- 9:16, 360×640 @ `pixelRatio 3` → 1080×1920 (same dims as `FortuneShareCard`).
- Content: `ksaju.me` + "Card of the Day" label · the card image · card name (en + kr) ·
  `theme` · the reading text · `<ShareCardFooter>` (QR + "Make yours →", reused) ·
  `For entertainment 🌙`.

### `tarot-share-modal.tsx` (client)
- Same pattern as `FortuneShareModal`: body = card preview (preview == export), **Share ✨**
  button driven by `useShareImage` (cycle-13 engine — zero new export code).

---

## 8. Navigation & Routing

- `src/app/[locale]/tarot/page.tsx` — thin server wrapper with `metadata` (title/description) →
  renders client `<TarotView>`. Static shell (client fetches the reading).
- Add a **Tarot** link to `src/components/layout/site-header.tsx` nav (alongside 사주 / Inyeon),
  with `usePathname` active styling like the existing links.

---

## 9. i18n

Add a `Tarot` namespace to all four `messages/{en,ja,ko,zh-TW}.json`:
`title`, `subtitle`, `drawButton`, `revealHint`, `loading`, `shareButton`, `comeback`,
`birthdayPrompt`, `birthdaySubmit`, `changeBirthday`, `forEntertainment`.

The **reading text** itself is produced in the user's locale by the LLM (via `locale` param) —
no static reading translations needed (matches daily-fortune). Static EN fallback only.

---

## 10. Analytics

Reuse the cycle-24 multi-sink `track()`:
- `card_generated` (on reveal) — `{ feature: "tarot", card_id }`.
- `share_clicked { kind: "tarot" }` — fired by the share modal, same as fortune/daily-fortune.

No new event types; no schema change.

---

## 11. Testing

| Test | Coverage |
|------|----------|
| `src/lib/tarot.test.ts` — draw | `drawDailyCard` determinism (same saju+date → same card), index in 0..77, varies across different saju, `kstDateString` format |
| `src/lib/tarot.test.ts` — seed invariant | re-run CSV→JSON transform == committed `data/ksaju-tarot.json` (all 78, element mapping) |
| `tarot-view.test.tsx` | renders `BirthForm` when no saju; renders `TarotDraw` when saju present (RTL + happy-dom, mock `loadUserSaju`) |

`tsc` clean, `eslint` clean, `next build` static for `/[locale]/tarot`.

---

## 12. File Checklist

| File | Action |
|------|--------|
| `docs/tarot-cards.csv` | ✅ already has `theme` + `keywords` (committed) |
| `scripts/seed-tarot.mjs` | New — CSV → `data/ksaju-tarot.json` |
| `data/ksaju-tarot.json` | New — committed runtime card data (78) |
| `package.json` | Add `seed:tarot` script |
| `src/lib/tarot.ts` | New — `TarotCard`, `TAROT_CARDS`, `kstDateString`, `drawDailyCard` |
| `src/lib/tarot.test.ts` | New — draw + seed-invariant tests |
| `src/app/api/tarot-reading/route.ts` | New — cached LLM reading route |
| `src/components/tarot/tarot-view.tsx` | New — saju gate orchestrator |
| `src/components/tarot/tarot-draw.tsx` | New — draw + reveal + reading + share trigger |
| `src/components/tarot/tarot-share-card.tsx` | New — 9:16 share card |
| `src/components/tarot/tarot-share-modal.tsx` | New — share modal (`useShareImage`) |
| `src/components/tarot/tarot-view.test.tsx` | New — gate render test |
| `src/app/[locale]/tarot/page.tsx` | New — server wrapper + metadata |
| `src/components/layout/site-header.tsx` | Add Tarot nav link |
| `messages/{en,ja,ko,zh-TW}.json` | Add `Tarot` namespace |
| `docs/supabase-migration.sql` | Append `tarot_readings` DDL |

---

## 13. Out of Scope (later)

- Reversed (upside-down) meanings.
- Multi-card spreads (Past/Present/Future).
- Re-draws / "draw another" credits (future monetization hook).
- Themed-question variants (Love / Career / My bias).
- Home-page tarot teaser/entry card (nav link is the v1 entry point).
- Per-user reading history / saved cards.
- Hand-authored static readings (LLM + cache is sufficient; `theme`/`keywords` ground it).
