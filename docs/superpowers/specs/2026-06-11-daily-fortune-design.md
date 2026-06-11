# Daily Fortune (오늘의 운세) — Design Spec

**Date:** 2026-06-11  
**Cycle:** 23  
**Status:** Approved

---

## 1. Overview

Add a "오늘의 운세" (Daily Fortune) card to the top of the 내 사주 result view. Each user sees a personalized 1-sentence fortune based on their **일간(Day Master)** × **오늘의 일주(Today's Day Pillar)**. Text is generated via OpenRouter (Claude Haiku) and cached in Supabase — at most 10 LLM calls per day (10 possible 일간). Users can export the card as a 9:16 PNG and share it.

**Target placement:** `SajuResult` component, above `PillarsGrid`.

---

## 2. Architecture

```
SajuResult (client)
  └── DailyFortune (client, useEffect)
        └── GET /api/daily-fortune?dayMaster={己}
              ├── KST today date calculation
              ├── birthToSaju(today) → pillars.day = 오늘 일주
              ├── stemRelation(dayMaster, todayStem) → relation (export from fortune.ts)
              ├── Supabase SELECT (date + day_master) → hit → return
              └── miss
                    ├── OpenRouter fetch (claude-haiku-4-5-20251001)
                    ├── Supabase INSERT
                    └── return
```

**No new npm packages.** OpenRouter is called via native `fetch`. No client-side API call — all OpenRouter/Supabase logic is server-only in the API route.

---

## 3. New Environment Variable

```
OPENROUTER_API_KEY=   # OpenRouter API key for LLM generation
```

Add to `.env.example` and Vercel dashboard.

---

## 4. Supabase Table

Run in Supabase SQL Editor:

```sql
CREATE TABLE daily_fortunes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date         date NOT NULL,
  day_master   text NOT NULL,       -- e.g. '己' (one of 10 heavenly stems)
  today_pillar text NOT NULL,       -- e.g. '壬申' (today's day pillar hanja)
  relation     text NOT NULL,       -- stemRelation result: 'combo'|'same'|'generate-me'|'i-generate'|'control'|'neutral'
  message      text NOT NULL,       -- LLM-generated 30–40 word English sentence
  energy       integer NOT NULL CHECK (energy >= 1 AND energy <= 5),
  lucky_color  text NOT NULL,       -- e.g. 'Dusty Rose', 'Deep Navy'
  created_at   timestamptz DEFAULT now(),
  UNIQUE(date, day_master)
);
```

**RLS:** Not needed — reads are via service role key on the server only.

---

## 5. API Route: `src/app/api/daily-fortune/route.ts`

**Method:** `GET ?dayMaster=己`

**Response:**
```json
{
  "id": "...",
  "date": "2026-06-11",
  "day_master": "己",
  "today_pillar": "壬申",
  "relation": "control",
  "message": "The universe is throwing curveballs today, but your inner idol energy will help you dodge them all — debut era vibes incoming! ✨",
  "energy": 4,
  "lucky_color": "Coral Pink"
}
```

**Logic:**
1. Validate `dayMaster` — must be one of 10 heavenly stems. Return 400 if invalid.
2. Compute KST today as `YYYY-MM-DD`.
3. Call `birthToSaju({ year: kstYear, month: kstMonth, day: kstDay, timezone: 'Asia/Seoul' })` → extract `pillars.day` = 오늘 일주. (`saju.ts` is `server-only`; API route is server-side, so this is safe.)
4. Extract `todayStem` = first character of `pillars.day` (천간).
5. Call `stemRelation(dayMaster, todayStem)` (exported from `fortune.ts`).
6. Supabase SELECT — hit → return `200 + cached row`.
7. Miss → OpenRouter fetch:
   - URL: `https://openrouter.ai/api/v1/chat/completions`
   - Model: `anthropic/claude-haiku-4-5-20251001`
   - `max_tokens: 120`, `temperature: 0.8`
8. Parse JSON from LLM response (`{ message, energy, lucky_color }`).
9. Supabase INSERT (upsert on conflict to handle race conditions).
10. Return the inserted row.

**Error handling:**
- OpenRouter failure or JSON parse error → return a static rule-based fallback response (not saved to DB). The UI renders it as normal — no error state shown to user.
- Supabase failure → same static fallback.

**Static fallback map** (`relation` → pre-written message):
```typescript
const FALLBACK: Record<string, { message: string; energy: number; lucky_color: string }> = {
  combo:       { message: "Stars align perfectly today — your bias era starts now! ✨", energy: 5, lucky_color: "Hot Pink" },
  same:        { message: "You're fully in your element today — ride the wave! 🌊",     energy: 4, lucky_color: "Golden Yellow" },
  "generate-me": { message: "The universe has your back today — lean into it! 🍀",     energy: 4, lucky_color: "Sage Green" },
  "i-generate": { message: "Your energy lights up everyone around you today! 💫",       energy: 3, lucky_color: "Lavender" },
  control:     { message: "A little resistance makes you stronger — you've got this! 🔥", energy: 3, lucky_color: "Dusty Rose" },
  neutral:     { message: "A calm, steady day — perfect for planning your next era! 🌤️", energy: 3, lucky_color: "Sky Blue" },
};
```

**ISR / caching:** `export const revalidate = 86400`. Each unique `?dayMaster=X` URL is cached separately by Next.js.

**OpenRouter prompt:**
```
Today's day pillar is {todayPillar}. The user's day master is {dayMaster} ({elementLabel}).
Their cosmic relationship today is "{relation}".

Write exactly 1 uplifting sentence (30–40 words) for a K-pop fan's daily fortune.
Tone: playful, Gen Z, positive. You may reference K-pop/idol culture subtly.
Pick an energy level (1–5, where 5 is peak) and a lucky color name.

Respond ONLY with valid JSON — no markdown, no extra text:
{"message":"...","energy":4,"lucky_color":"Coral Pink"}
```

---

## 6. fortune.ts Export

Export `stemRelation` and `TimeRel` so the API route can import them:

```typescript
export type TimeRel = "combo" | "same" | "generate-me" | "i-generate" | "control" | "neutral";
export function stemRelation(dmStem: string, otherStem: string): TimeRel { ... }
```

---

## 7. UI Component: `src/components/DailyFortune.tsx`

**Props:** `{ dayMaster: HeavenlyStem }`  
**Type:** `"use client"`, `useEffect` fetch on mount.

**States:** `loading` → skeleton card / `data` → full card / `error` → same as `data` but with fallback content.

**Render (data state):**
```
┌─────────────────────────────────┐
│  ✦ Today's Fortune · 오늘의 운세  │  (label, 10px uppercase)
│  Thu Jun 11 · 壬申               │  (today date + today pillar hanja, ohaeng-colored)
│                                 │
│  "{message}"                    │  (1-2 lines, text-sm)
│                                 │
│  Energy  ★★★★☆  Lucky: Coral Pink │  (inline row)
│                                 │
│  [  Share ✨  ]                  │  (button, outline)
│  Come back tomorrow 🌙           │  (10px muted)
└─────────────────────────────────┘
```

- Card border uses day master's ohaeng color token (same as `ELEMENT_TEXT` pattern from saju-display.ts)
- Today's pillar hanja colored with today stem's ohaeng element
- Lucky color shown as a small rounded badge with inline color swatch dot

**Loading skeleton:** same card dimensions, shimmer placeholders for message + stars rows.

---

## 8. Share Card: `src/components/fortune/DailyFortuneShareCard.tsx`

9:16 (360×640 px, pixelRatio 3 → 1080×1920) — same dimensions as `FortuneShareCard`.

**Content:**
- Top: ksaju.me 로고 + "오늘의 운세" label
- Center hero: today pillar hanja (large, ohaeng-colored) + element label
- Message text (2-3 lines max)
- Energy stars + lucky color badge
- Bottom: `ShareCardFooter` (QR + "Make yours →" CTA, reused from cycle 22)

**Modal:** `src/components/fortune/DailyFortuneShareModal.tsx` — same pattern as `FortuneShareModal`. Body = card preview + Share ✨ button using `useShareImage`.

---

## 9. SajuResult Integration

In `src/components/saju/saju-result.tsx`, insert `<DailyFortune dayMaster={userSaju.dayMaster} />` as the first child inside the `<div className="space-y-6">`, before `<PillarsGrid>`.

---

## 10. Analytics

Reuse existing `share_clicked { kind: "daily_fortune" }` — no new event needed. The DailyFortune share modal calls PostHog the same way `FortuneSection` does.

---

## 11. File Checklist

| File | Action |
|------|--------|
| `src/lib/fortune.ts` | Export `TimeRel` + `stemRelation` |
| `src/app/api/daily-fortune/route.ts` | New API route |
| `src/components/DailyFortune.tsx` | New client component |
| `src/components/fortune/DailyFortuneShareCard.tsx` | New 9:16 share card |
| `src/components/fortune/DailyFortuneShareModal.tsx` | New share modal |
| `src/components/saju/saju-result.tsx` | Add `<DailyFortune>` at top |
| `.env.example` | Add `OPENROUTER_API_KEY` |
| `docs/supabase-migration.sql` | Append `daily_fortunes` DDL |

---

## 12. Out of Scope

- Admin dashboard tracking for daily fortune views (future)
- Rate limiting on `/api/daily-fortune` (Supabase cache makes abuse expensive but low-value)
- i18n / Korean language fortune text (English-first per project target audience)
- Scheduled pre-generation of fortunes (Supabase-on-demand is sufficient at current scale)
