# Localized Fallback Readings — Design Spec

**Date:** 2026-06-17
**Status:** Approved (pending spec review)

## Problem

On the deployed site, switching to Korean (or ja / zh-TW) shows the **tarot reading in English**. Root cause is two layers:

1. **Production LLM is down.** Live probes of `https://ksaju-green.vercel.app` show *both* `/api/tarot-reading?locale=ko` and `/api/daily-fortune?locale=ko` returning `"id":"fallback"` with English text. The LLM call is failing on Vercel (most likely the `OPENROUTER_API_KEY` env var is missing, invalid, or out of credits). This is an **operations fix the user owns** — not in scope for this change.
2. **The fallback text is English-only.** `tarotFallbackReading()` (`src/lib/tarot.ts`) and the inline `FALLBACK` map in `src/app/api/daily-fortune/route.ts` are hardcoded English. So whenever the LLM path is unavailable — on prod right now, or any transient failure later — non-English users see English.

The LLM happy path **already localizes correctly** (`LANG_MAP[locale]` → "Korean" etc. in both routes). This spec only fixes the fallback layer.

## Goal

Make both fallback readings respect the request `locale` (`en` / `ko` / `ja` / `zh-TW`), so Korean users get Korean fallback text even when the LLM is unavailable. Unknown/unsupported locale → English.

## Non-Goals

- Restoring the Vercel `OPENROUTER_API_KEY` (user's operational action; brings back the *rich* LLM readings for both features).
- Translating the 78 card `theme` strings (English-only in `data/ksaju-tarot.json`; omitted from non-English fallback templates).
- Any change to the LLM prompt / happy path (already localized).
- Localizing the `Share ✨` button (per existing convention it stays English for K-pop brand mood — see cycle 26a).

## Design

### 1. Element word — reuse existing data, no new translations

The fallback references the reader's day-master element. Use existing `WUXING_META` (`src/lib/saju-display.ts`):

- **en** → `WUXING_META[el].label` (e.g. `"Metal"`)
- **ko / ja / zh-TW** → `WUXING_META[el].hanja` (e.g. `"金"`)

The hanja reads naturally in all three CJK languages ("金 기운", "金のエネルギー", "金能量"), so no new element-label translation data is needed.

### 2. Tarot fallback — `src/lib/tarot.ts`

Change the signature:

```ts
// before
export function tarotFallbackReading(card: TarotCard, elementLabel: string): string

// after
export function tarotFallbackReading(card: TarotCard, element: WuXing, locale?: string): string
```

- `locale` defaults to `"en"`; any value not in `{en, ko, ja, zh-TW}` falls back to `"en"`.
- Internally derives the element word from `WUXING_META[element]` (`.label` for en, `.hanja` otherwise). `WUXING_META` is imported from `@/lib/saju-display` (client-safe; no import cycle — `saju-display` does not import `tarot`).

Per-locale templates:

| locale | template | card name | element word |
|---|---|---|---|
| en | `{name} is your card today — {theme}. Let your {elem} energy lead the way, and good things will follow. ✨` | `name_en` | `label` |
| ko | `오늘 당신의 카드는 '{name}'. {elem} 기운을 믿고 나아가면 좋은 일이 따라올 거예요. ✨` | `name_kr` | `hanja` |
| ja | `今日のあなたのカードは「{name}」。{elem}のエネルギーを信じて進めば、きっと良いことが訪れます。✨` | `name_en` | `hanja` |
| zh-TW | `你今天的牌是「{name}」。順著你的{elem}能量前行，好事自然會來。✨` | `name_en` | `hanja` |

Notes:
- The **en** template is byte-for-byte the current output (preserves existing behavior; `theme` retained only here).
- Non-en templates omit `theme` (English-only data) and use a generic encouraging line.
- ja/zh-TW use `name_en` because the data has no native card names; tarot English names are internationally recognized.

**Caller** — `src/app/api/tarot-reading/route.ts`:
```ts
// before
message: tarotFallbackReading(card, elementLabel),
// after
message: tarotFallbackReading(card, elementOf(dayMaster), locale),
```
(`elementOf` is already imported; `locale` is already in scope. `elementLabel` may remain for the LLM prompt.)

### 3. Daily-fortune fallback — `src/app/api/daily-fortune/route.ts`

Move the inline English-only `FALLBACK` map into a committed data file following the existing `data/*-i18n.json` convention.

**New file:** `data/ksaju-daily-fortune-fallback-i18n.json`
Shape (one entry per `TimeRel`: `combo`, `same`, `generate-me`, `i-generate`, `control`, `neutral`):

```json
{
  "combo": {
    "energy": 5,
    "message": { "en": "...", "ko": "...", "ja": "...", "zh-TW": "..." },
    "lucky_color": { "en": "Hot Pink", "ko": "...", "ja": "...", "zh-TW": "..." }
  }
}
```

- `energy` is locale-independent (number), preserving the current per-relation values (combo 5, same 4, generate-me 4, i-generate 3, control 3, neutral 3).
- `message` and `lucky_color` are localized; `en` values preserve the current English strings exactly.

**Route change:**
```ts
const fb = FALLBACK_I18N[relation];
return NextResponse.json({
  id: "fallback", date: todayStr, day_master: dayMaster, locale,
  today_pillar: todayPillar, relation,
  message: fb.message[locale] ?? fb.message.en,
  energy: fb.energy,
  lucky_color: fb.lucky_color[locale] ?? fb.lucky_color.en,
});
```
The inline `FALLBACK` const is removed; the import replaces it. A typed shape (`Record<TimeRel, { energy: number; message: Record<string,string>; lucky_color: Record<string,string> }>`) is applied to the imported JSON.

## Testing

- **`src/lib/tarot.test.ts`** — update the existing `tarotFallbackReading` call to the new signature (`getCardById(0)!, "metal", "en"`), keep the English assertion (contains `"The Fool"`), and **add a ko case**: `tarotFallbackReading(getCardById(0)!, "metal", "ko")` contains `광대` (the card's `name_kr`) and the `金` hanja, and does **not** contain `"is your card today"`.
- **New `src/lib/daily-fortune-fallback.test.ts`** — data-integrity test: the JSON has all 6 `TimeRel` keys; each has a numeric `energy` and `message`/`lucky_color` objects with all four locale keys (`en`, `ko`, `ja`, `zh-TW`) non-empty.

## Verification

- `npm test` (all pass, including the 2 new/updated assertions) and `npx tsc --noEmit` clean.
- Local: with no `OPENROUTER_API_KEY`, `GET /api/tarot-reading?cardId=0&dayMaster=辛&locale=ko` returns a **Korean** `message`; `locale=en` returns the unchanged English string. Same shape check for `/api/daily-fortune`.

## Acceptance Criteria

1. Both fallback endpoints return locale-appropriate text for `ko`/`ja`/`zh-TW`, English for `en` or unknown locales.
2. The `en` fallback output is unchanged from today (no regression for English users).
3. No change to the LLM happy path; no new runtime npm dependencies.

## Files

- Modify: `src/lib/tarot.ts`, `src/lib/tarot.test.ts`
- Modify: `src/app/api/tarot-reading/route.ts`, `src/app/api/daily-fortune/route.ts`
- Create: `data/ksaju-daily-fortune-fallback-i18n.json`, `src/lib/daily-fortune-fallback.test.ts`
