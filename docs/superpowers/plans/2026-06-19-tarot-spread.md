# Tarot Spread (Past / Present / Future) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive `/tarot/spread` experience where a saju-gated user draws a 3-card past/present/future tarot spread with animated card backs, gets per-card + synthesis readings, and shares a 9:16 PNG.

**Architecture:** New route `src/app/[locale]/tarot/spread/page.tsx` → client `SpreadView` (saju gate, mirrors `TarotView`) → `SpreadDraw` (motion choreography: fan of card backs → sequential past/present/future buttons → zoom/flip → deck fades out → 3-column result). Cards are truly random (`drawSpread`, not deterministic). One LLM call returns JSON `{past, present, future, synthesis}`; no Supabase cache. Share reuses cycle-13 `useShareImage` + cycle-22 `ShareCardFooter`.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl (4 locales), `motion` (framer-motion — NEW dependency, approved for this paid feature), vitest + Testing Library + happy-dom, OpenRouter (`anthropic/claude-haiku-4.5`).

## Global Constraints

- **Next.js 16 is NOT the Next.js you know** — read `node_modules/next/dist/docs/` before writing route/page code (per AGENTS.md).
- **Cards are truly random** — `drawSpread` is NOT deterministic; never cache the reading (each draw = 1 LLM call; future credit gate sits at the route boundary).
- **Upright only** — no reversed cards (consistent with existing tarot).
- **4 locales must stay parallel** — every new message key exists in `messages/{en,ko,ja,zh-TW}.json`.
- **Reuse, don't recreate** — `useShareImage` (`src/hooks/use-share-image.ts`), `ShareCardFooter` (`src/components/share/share-card-footer.tsx`), `ELEMENT_TEXT`/`elementOf`/`dayMasterInfo`/`elementLabel`/`WUXING_META` (`src/lib/saju-display.ts`), `hanji-paper`/`changsal-band` CSS, `BirthForm` + `calcUserSaju` + `loadUserSaju`/`saveUserSaju` saju gate.
- **OpenRouter** — reuse `OPENROUTER_API_KEY`; model id is `anthropic/claude-haiku-4.5` (exactly, as fixed in commit `3f3f67f`). No new env vars.
- **Accessibility** — honor `prefers-reduced-motion` (use motion's `<MotionConfig reducedMotion="user">`).
- **Out of scope this cycle:** credit/paywall system, reversed cards, reading history/persistence, merging with `/tarot` daily card.
- **TDD + per-task commit.** Run `npm test` (vitest), `npx tsc --noEmit`, `npm run lint`, `npm run build` at the final task.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/lib/tarot.ts` (modify) | `drawSpread`, `SpreadReading` type, `tarotSpreadFallbackReading` | 1 |
| `src/lib/tarot.test.ts` (modify) | tests for the above | 1 |
| `src/app/api/tarot-spread-reading/route.ts` (create) | GET → OpenRouter → JSON spread reading, fallback | 2 |
| `src/app/api/tarot-spread-reading/route.test.ts` (create) | 400 + fallback shape tests | 2 |
| `src/components/tarot/spread/spread-card-back.tsx` (create) | dark-hanji + gold 창살 + ㅎ stamp SVG back | 3 |
| `src/components/tarot/spread/spread-card-back.test.tsx` (create) | smoke render | 3 |
| `messages/{en,ko,ja,zh-TW}.json` (modify) | `TarotSpread` namespace + `Tarot.spreadCta` | 4 |
| `src/lib/analytics.ts` (modify) | add `spread_started`/`spread_card_drawn`/`spread_revealed` | 4 |
| `src/components/tarot/spread/spread-share-card.tsx` (create) | 9:16 share card (3 faces + synthesis) | 5 |
| `src/components/tarot/spread/spread-share-modal.tsx` (create) | dialog + `useShareImage` | 5 |
| `src/components/tarot/spread/spread-share-card.test.tsx` (create) | 3 faces + element accent | 5 |
| `src/components/tarot/spread/spread-result.tsx` (create) | 3-column result + readings + share/replay | 6 |
| `src/components/tarot/spread/spread-draw.tsx` (create) | motion choreography + state machine | 6 |
| `src/components/tarot/spread/spread-draw.test.tsx` (create) | button gating + reveal | 6 |
| `src/app/[locale]/tarot/spread/page.tsx` (create) | server wrapper + metadata | 7 |
| `src/components/tarot/spread/spread-view.tsx` (create) | saju gate (mirrors TarotView) | 7 |
| `src/components/tarot/spread/spread-view.test.tsx` (create) | gate test | 7 |
| `src/components/tarot/tarot-view.tsx` (modify) | CTA link to `/tarot/spread` | 7 |

---

### Task 1: `drawSpread` + spread fallback reading (lib)

**Files:**
- Modify: `src/lib/tarot.ts`
- Test: `src/lib/tarot.test.ts`

**Interfaces:**
- Consumes: existing `TAROT_CARDS`, `TarotCard`, `FALLBACK_LOCALES`, `elementLabel` (already imported in `tarot.ts`), `WuXing`.
- Produces:
  - `type SpreadReading = { past: string; present: string; future: string; synthesis: string }`
  - `function drawSpread(rng?: () => number): [TarotCard, TarotCard, TarotCard]`
  - `function tarotSpreadFallbackReading(cards: [TarotCard, TarotCard, TarotCard], element: WuXing, locale?: string): SpreadReading`

- [ ] **Step 1: Write the failing tests** — append to `src/lib/tarot.test.ts`:

```ts
import { drawSpread, tarotSpreadFallbackReading } from "./tarot";

describe("drawSpread", () => {
  it("returns 3 distinct valid cards", () => {
    const trio = drawSpread();
    expect(trio).toHaveLength(3);
    const ids = new Set(trio.map((c) => c.id));
    expect(ids.size).toBe(3);
    for (const c of trio) expect(TAROT_CARDS).toContainEqual(c);
  });
  it("is deterministic for the same rng sequence", () => {
    const mk = () => { let i = 0; const seq = [0.1, 0.5, 0.9, 0.3]; return () => seq[i++ % seq.length]; };
    expect(drawSpread(mk()).map((c) => c.id)).toEqual(drawSpread(mk()).map((c) => c.id));
  });
  it("can differ across rng sequences", () => {
    const a = drawSpread(() => 0.01).map((c) => c.id).join();
    const b = drawSpread(() => 0.99).map((c) => c.id).join();
    expect(a).not.toBe(b);
  });
});

describe("tarotSpreadFallbackReading", () => {
  const trio = [getCardById(0)!, getCardById(1)!, getCardById(2)!] as [typeof TAROT_CARDS[0], typeof TAROT_CARDS[0], typeof TAROT_CARDS[0]];
  it("en: 4 non-empty string fields with card names", () => {
    const r = tarotSpreadFallbackReading(trio, "metal", "en");
    expect(r.past).toContain("The Fool");
    for (const v of [r.past, r.present, r.future, r.synthesis]) expect(v.length).toBeGreaterThan(10);
  });
  it("ko: uses Korean card name + hangul element, not English template", () => {
    const r = tarotSpreadFallbackReading(trio, "metal", "ko");
    expect(r.past).toContain("광대");
    expect(r.synthesis).toContain("금");
    expect(r.synthesis).not.toContain("Trust your");
  });
  it("unknown locale falls back to en", () => {
    expect(tarotSpreadFallbackReading(trio, "metal", "xx").synthesis).toContain("Trust your");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/lib/tarot.test.ts`
Expected: FAIL — `drawSpread`/`tarotSpreadFallbackReading` not exported.

- [ ] **Step 3: Implement** — append to `src/lib/tarot.ts` (after `tarotFallbackReading`):

```ts
export type SpreadReading = { past: string; present: string; future: string; synthesis: string };

/** Three distinct random cards (upright). NOT deterministic — different each draw. Pass `rng` for tests. */
export function drawSpread(rng: () => number = Math.random): [TarotCard, TarotCard, TarotCard] {
  const deck = [...TAROT_CARDS];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1], deck[2]];
}

/** Static 3-card reading used when the LLM is unavailable. Localized by `locale`. */
export function tarotSpreadFallbackReading(
  cards: [TarotCard, TarotCard, TarotCard],
  element: WuXing,
  locale: string = "en",
): SpreadReading {
  const loc = (FALLBACK_LOCALES as readonly string[]).includes(locale) ? locale : "en";
  const [p, c, f] = cards;
  const el = elementLabel(element, loc);
  const name = (card: TarotCard) => (loc === "ko" ? card.name_kr : card.name_en);
  switch (loc) {
    case "ko":
      return {
        past: `과거의 카드 '${name(p)}' — ${p.theme}`,
        present: `현재의 카드 '${name(c)}' — ${c.theme}`,
        future: `미래의 카드 '${name(f)}' — ${f.theme}`,
        synthesis: `${el} 기운을 믿고 흐름을 따라가면, 과거의 경험이 현재를 지나 좋은 미래로 이어질 거예요. ✨`,
      };
    case "ja":
      return {
        past: `過去のカード「${name(p)}」— ${p.theme}`,
        present: `現在のカード「${name(c)}」— ${c.theme}`,
        future: `未来のカード「${name(f)}」— ${f.theme}`,
        synthesis: `${el}のエネルギーを信じて流れに乗れば、過去の経験が現在を経て良い未来へつながります。✨`,
      };
    case "zh-TW":
      return {
        past: `過去之牌「${name(p)}」— ${p.theme}`,
        present: `現在之牌「${name(c)}」— ${c.theme}`,
        future: `未來之牌「${name(f)}」— ${f.theme}`,
        synthesis: `順著你的${el}能量前行，過去的經驗會穿越現在，引向美好的未來。✨`,
      };
    default:
      return {
        past: `Your past card, ${name(p)} — ${p.theme}.`,
        present: `Your present card, ${name(c)} — ${c.theme}.`,
        future: `Your future card, ${name(f)} — ${f.theme}.`,
        synthesis: `Trust your ${el} energy and let it flow — what you learned carries you through today into a brighter future. ✨`,
      };
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/lib/tarot.test.ts`
Expected: PASS (all existing + new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tarot.ts src/lib/tarot.test.ts
git commit -m "feat(tarot): drawSpread + spread fallback reading

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: API route `/api/tarot-spread-reading`

**Files:**
- Create: `src/app/api/tarot-spread-reading/route.ts`
- Test: `src/app/api/tarot-spread-reading/route.test.ts`

**Interfaces:**
- Consumes: `getCardById`, `tarotSpreadFallbackReading`, `SpreadReading`, `TarotCard` (Task 1); `elementOf`, `WUXING_META` (saju-display); `HEAVENLY_STEMS` (saju-data); `routing`, `Locale` (i18n/routing).
- Produces: GET handler returning `SpreadReading` JSON (or `{error}` 400). Client calls `GET /api/tarot-spread-reading?cardIds=a,b,c&dayMaster=辛&locale=en`.

- [ ] **Step 1: Write the failing test** — `src/app/api/tarot-spread-reading/route.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const url = (q: string) => new NextRequest(`http://localhost/api/tarot-spread-reading?${q}`);

afterEach(() => vi.restoreAllMocks());

describe("GET /api/tarot-spread-reading", () => {
  it("400 when cardIds is not 3 numbers", async () => {
    const res = await GET(url("cardIds=1,2&dayMaster=%E8%BE%9B&locale=en"));
    expect(res.status).toBe(400);
  });

  it("400 on invalid dayMaster", async () => {
    const res = await GET(url("cardIds=0,1,2&dayMaster=X&locale=en"));
    expect(res.status).toBe(400);
  });

  it("returns the localized fallback shape when the LLM call fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const res = await GET(url("cardIds=0,1,2&dayMaster=%E8%BE%9B&locale=en"));
    expect(res.status).toBe(200);
    const json = await res.json();
    for (const k of ["past", "present", "future", "synthesis"]) {
      expect(typeof json[k]).toBe("string");
      expect(json[k].length).toBeGreaterThan(0);
    }
  });
});
```

(`%E8%BE%9B` = `辛`, a valid heavenly stem.)

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/app/api/tarot-spread-reading/route.test.ts`
Expected: FAIL — module `./route` not found.

- [ ] **Step 3: Implement** — `src/app/api/tarot-spread-reading/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getCardById, tarotSpreadFallbackReading, type SpreadReading, type TarotCard } from "@/lib/tarot";
import { elementOf, WUXING_META } from "@/lib/saju-display";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const VALID_STEMS: Set<string> = new Set(HEAVENLY_STEMS.map((s) => s.char));
const LANG_MAP: Record<Locale, string> = {
  en: "English", ja: "Japanese", ko: "Korean", "zh-TW": "Traditional Chinese",
};

function parseSpread(raw: string): SpreadReading | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const o = JSON.parse(raw.slice(start, end + 1)) as Partial<SpreadReading>;
    const fields = [o.past, o.present, o.future, o.synthesis];
    if (fields.every((s) => typeof s === "string" && s.length > 0 && s.length < 400)) {
      return o as SpreadReading;
    }
  } catch { /* fall through to null */ }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = (searchParams.get("cardIds") ?? "").split(",").map(Number);
  const dayMaster = searchParams.get("dayMaster") ?? "";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale: Locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale) : "en";

  if (ids.length !== 3 || ids.some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "cardIds must be 3 numbers" }, { status: 400 });
  }
  const looked = ids.map(getCardById);
  if (looked.some((c) => c === null)) {
    return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  }
  if (!VALID_STEMS.has(dayMaster)) {
    return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });
  }
  const trio = looked as [TarotCard, TarotCard, TarotCard];
  const element = elementOf(dayMaster);
  const elementLabel = WUXING_META[element].label;
  const lang = LANG_MAP[locale];
  const [p, c, f] = trio;

  const prompt = `A 3-card past/present/future tarot spread for a K-pop fan. Day master: ${dayMaster} (${elementLabel}).
Past card: "${p.name_en}" — ${p.theme} (${p.keywords}).
Present card: "${c.name_en}" — ${c.theme} (${c.keywords}).
Future card: "${f.name_en}" — ${f.theme} (${f.keywords}).

Write upright readings in ${lang}, warm/playful/Gen Z and teen-safe (no romance-heavy or scary framing).
Lightly weave in their ${elementLabel} energy. Return ONLY minified JSON with keys past, present, future, synthesis.
- past, present, future: ONE sentence each (<=25 words) for that card in its position.
- synthesis: 2 sentences (<=45 words) tying the three into one uplifting story arc.
No markdown, no extra keys.`;

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ksaju.me",
        "X-Title": "KSaju Tarot Spread",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: 400, temperature: 0.85,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}`);
    const llmJson = await llmRes.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = parseSpread((llmJson.choices?.[0]?.message?.content ?? "").trim());
    if (!parsed) throw new Error("Invalid LLM JSON");
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[tarot-spread-reading] fallback:", err);
    return NextResponse.json(tarotSpreadFallbackReading(trio, element, locale));
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/app/api/tarot-spread-reading/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tarot-spread-reading/
git commit -m "feat(tarot): spread reading API route (LLM JSON + fallback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `SpreadCardBack` (dark-hanji + 창살 SVG)

**Files:**
- Create: `src/components/tarot/spread/spread-card-back.tsx`
- Test: `src/components/tarot/spread/spread-card-back.test.tsx`

**Interfaces:**
- Produces: `function SpreadCardBack(props: { className?: string }): JSX.Element` — self-contained 2:3 inline SVG card back (no external assets). Used by `SpreadDraw`.

- [ ] **Step 1: Write the failing test** — `spread-card-back.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SpreadCardBack } from "./spread-card-back";

describe("SpreadCardBack", () => {
  it("renders an svg with the ㅎ stamp", () => {
    const { container, getByText } = render(<SpreadCardBack className="w-10" />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByText("ㅎ")).toBeTruthy();
  });
  it("forwards className to the svg", () => {
    const { container } = render(<SpreadCardBack className="w-10" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("w-10");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/components/tarot/spread/spread-card-back.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `spread-card-back.tsx`:

```tsx
/** Tarot card back: dark hanji texture + gold corner 창살 + red ㅎ 낙관. Inline SVG, no assets. */
export function SpreadCardBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} role="img" aria-label="Tarot card back" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="spreadHanjiDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1A2E" />
          <stop offset="1" stopColor="#0F0828" />
        </linearGradient>
        <filter id="spreadHanjiNoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.07" /></feComponentTransfer>
        </filter>
      </defs>
      <rect width="120" height="180" rx="10" fill="url(#spreadHanjiDark)" />
      <rect width="120" height="180" rx="10" filter="url(#spreadHanjiNoise)" />
      <rect x="7" y="7" width="106" height="166" rx="6" fill="none" stroke="#C49A3F" strokeWidth="1.4" />
      <g stroke="#F4C95D" strokeWidth="1.1" fill="none" opacity="0.85">
        <path d="M20 16 V34 M11 25 H29 M20 16 H38 M29 16 V25" />
        <path d="M100 16 V34 M109 25 H91 M100 16 H82 M91 16 V25" />
        <path d="M20 164 V146 M11 155 H29 M20 164 H38 M29 164 V155" />
        <path d="M100 164 V146 M109 155 H91 M100 164 H82 M91 164 V155" />
      </g>
      <rect x="44" y="74" width="32" height="32" rx="5" fill="#B5304A" />
      <text x="60" y="97" fontFamily="serif" fontSize="18" fill="#FFF6E5" textAnchor="middle">ㅎ</text>
      <text x="60" y="132" fontFamily="serif" fontSize="7" fill="#88B0BC" textAnchor="middle" letterSpacing="2">KSAJU</text>
    </svg>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- src/components/tarot/spread/spread-card-back.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tarot/spread/spread-card-back.tsx src/components/tarot/spread/spread-card-back.test.tsx
git commit -m "feat(tarot): SpreadCardBack — dark-hanji + 창살 SVG card back

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: i18n `TarotSpread` namespace + analytics events

**Files:**
- Modify: `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh-TW.json`
- Modify: `src/lib/analytics.ts`

**Interfaces:**
- Produces: `TarotSpread` message namespace (keys: `title`, `subtitle`, `birthdayPrompt`, `birthdaySubmit`, `past`, `present`, `future`, `drawPosition` [ICU `{position}`], `loading`, `shareButton`, `replay`, `disclaimer`); `Tarot.spreadCta` key; analytics events `spread_started`, `spread_card_drawn`, `spread_revealed`.

- [ ] **Step 1: Add the `TarotSpread` namespace + `Tarot.spreadCta`.** In each `messages/*.json`, add `"spreadCta"` inside the existing `"Tarot"` object and add a new top-level `"TarotSpread"` sibling object. Watch JSON commas.

`messages/en.json` — add to `Tarot`: `"spreadCta": "Try the Past · Present · Future spread →"` and add:
```json
  "TarotSpread": {
    "title": "Past · Present · Future",
    "subtitle": "Draw your 3-card spread ✨",
    "birthdayPrompt": "Enter your birthday to draw your personalized spread.",
    "birthdaySubmit": "Start my spread ✨",
    "past": "Past",
    "present": "Present",
    "future": "Future",
    "drawPosition": "Draw your {position} card 🃏",
    "loading": "Reading the cards…",
    "shareButton": "Share ✨",
    "replay": "Draw again 🔄",
    "disclaimer": "For entertainment 🌙"
  },
```

`messages/ko.json` — `Tarot.spreadCta`: `"과거·현재·미래 스프레드 해보기 →"` and:
```json
  "TarotSpread": {
    "title": "과거 · 현재 · 미래",
    "subtitle": "3장 스프레드를 뽑아보세요 ✨",
    "birthdayPrompt": "생일을 입력하면 나만의 스프레드를 뽑아드려요.",
    "birthdaySubmit": "스프레드 시작 ✨",
    "past": "과거",
    "present": "현재",
    "future": "미래",
    "drawPosition": "{position} 카드 뽑기 🃏",
    "loading": "카드를 읽는 중…",
    "shareButton": "공유 ✨",
    "replay": "다시 뽑기 🔄",
    "disclaimer": "재미로 보는 거예요 🌙"
  },
```

`messages/ja.json` — `Tarot.spreadCta`: `"過去・現在・未来のスプレッドを試す →"` and:
```json
  "TarotSpread": {
    "title": "過去 · 現在 · 未来",
    "subtitle": "3枚のスプレッドを引きましょう ✨",
    "birthdayPrompt": "誕生日を入力すると、あなただけのスプレッドを引けます。",
    "birthdaySubmit": "スプレッドを始める ✨",
    "past": "過去",
    "present": "現在",
    "future": "未来",
    "drawPosition": "{position}のカードを引く 🃏",
    "loading": "カードを読んでいます…",
    "shareButton": "シェア ✨",
    "replay": "もう一度引く 🔄",
    "disclaimer": "エンタメ目的です 🌙"
  },
```

`messages/zh-TW.json` — `Tarot.spreadCta`: `"試試過去・現在・未來牌陣 →"` and:
```json
  "TarotSpread": {
    "title": "過去 · 現在 · 未來",
    "subtitle": "抽你的三張牌陣 ✨",
    "birthdayPrompt": "輸入生日，為你抽出專屬牌陣。",
    "birthdaySubmit": "開始牌陣 ✨",
    "past": "過去",
    "present": "現在",
    "future": "未來",
    "drawPosition": "抽你的{position}之牌 🃏",
    "loading": "正在解讀牌卡…",
    "shareButton": "分享 ✨",
    "replay": "再抽一次 🔄",
    "disclaimer": "僅供娛樂 🌙"
  },
```

- [ ] **Step 2: Add analytics events.** In `src/lib/analytics.ts`, extend the `AnalyticsEvent` union:

```ts
export type AnalyticsEvent =
  | "$pageview"
  | "birth_submitted"
  | "idol_selected"
  | "card_generated"
  | "share_clicked"
  | "another_idol_clicked"
  | "partner_submitted"
  | "compat_revealed"
  | "spread_started"
  | "spread_card_drawn"
  | "spread_revealed";
```

- [ ] **Step 3: Verify JSON + types compile**

Run: `npx tsc --noEmit && node -e "for(const l of ['en','ko','ja','zh-TW']){const m=require('./messages/'+l+'.json'); if(!m.TarotSpread||!m.Tarot.spreadCta) throw new Error(l)} console.log('ok')"`
Expected: prints `ok`, no tsc errors. (If a message-parity test exists, run `npm test` and confirm it passes.)

- [ ] **Step 4: Commit**

```bash
git add messages/ src/lib/analytics.ts
git commit -m "feat(tarot): TarotSpread i18n (4 locales) + spread analytics events

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Share card + modal (9:16)

**Files:**
- Create: `src/components/tarot/spread/spread-share-card.tsx`
- Create: `src/components/tarot/spread/spread-share-modal.tsx`
- Test: `src/components/tarot/spread/spread-share-card.test.tsx`

**Interfaces:**
- Consumes: `SpreadReading`/`TarotCard` (Task 1); `dayMasterInfo`, `elementLabel` (saju-display); `ShareCardFooter`; `useShareImage`; `track` (`share_clicked`); UI `Dialog`/`Button`.
- Produces:
  - `SpreadShareCard` = `forwardRef<HTMLDivElement, { saju: UserSaju; cards: [TarotCard,TarotCard,TarotCard]; synthesis: string; locale?: string }>`
  - `function SpreadShareModal(props: { open: boolean; onClose: () => void; saju: UserSaju; cards: [TarotCard,TarotCard,TarotCard]; synthesis: string }): JSX.Element`

- [ ] **Step 1: Write the failing test** — `spread-share-card.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/share/share-card-footer", () => ({ ShareCardFooter: () => <div data-testid="footer" /> }));

import { SpreadShareCard } from "./spread-share-card";
import { getCardById } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

const saju: UserSaju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };
const cards = [getCardById(0)!, getCardById(1)!, getCardById(2)!] as [ReturnType<typeof getCardById> & object, never, never];

describe("SpreadShareCard", () => {
  it("renders 3 card faces and the synthesis", () => {
    const { container, getByText } = render(
      <SpreadShareCard saju={saju} cards={cards as never} synthesis="A bright arc ahead." locale="en" />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(getByText(/A bright arc ahead\./)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/components/tarot/spread/spread-share-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `spread-share-card.tsx`:**

```tsx
"use client";

import { forwardRef } from "react";
import { dayMasterInfo, elementLabel } from "@/lib/saju-display";
import { ShareCardFooter } from "@/components/share/share-card-footer";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = { saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; synthesis: string; locale?: string };

const TITLE: Record<string, string> = {
  en: "Past · Present · Future", ko: "과거 · 현재 · 미래", ja: "過去 · 現在 · 未来", "zh-TW": "過去 · 現在 · 未來",
};

/** 9:16 spread share card (360×640 → pixelRatio 3 → 1080×1920). Self-contained. */
export const SpreadShareCard = forwardRef<HTMLDivElement, Props>(
  function SpreadShareCard({ saju, cards, synthesis, locale = "en" }, ref) {
    const dm = dayMasterInfo(saju.dayMaster);
    const isKo = locale === "ko";
    const title = TITLE[locale] ?? TITLE.en;
    return (
      <div
        ref={ref}
        className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
        style={{ width: 360, height: 640 }}
      >
        <div className="changsal-band absolute left-0 right-0 top-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 px-7 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {title} · {elementLabel(dm.element, locale)}
          </p>
          <div className="flex justify-center gap-2">
            {cards.map((c) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.id} src={`/tarot/${c.filename}`} alt={isKo ? c.name_kr : c.name_en} className="w-[92px] rounded-md shadow-md" />
            ))}
          </div>
          <p className="font-serif text-sm leading-snug text-foreground">&ldquo;{synthesis}&rdquo;</p>
        </div>

        <ShareCardFooter />

        <div className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />
      </div>
    );
  },
);
```

- [ ] **Step 4: Implement `spread-share-modal.tsx`:**

```tsx
"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpreadShareCard } from "./spread-share-card";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = {
  open: boolean; onClose: () => void;
  saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; synthesis: string;
};

export function SpreadShareModal({ open, onClose, saju, cards, synthesis }: Props) {
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-tarot-spread.png",
    shareMeta: { title: "My KSaju Past · Present · Future", text: "My tarot spread — make yours at ksaju.me" },
  });
  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your Past · Present · Future spread</DialogTitle>
        <DialogDescription className="sr-only">A fun 3-card tarot reading for you.</DialogDescription>

        <SpreadShareCard ref={cardRef} saju={saju} cards={cards} synthesis={synthesis} locale={locale} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => { track("share_clicked", { kind: "tarot_spread" }); share(); }}
            disabled={status === "rendering"}
            className="w-full"
          >
            {shareLabel}
          </Button>
          {status === "error" && (
            <p className="text-center text-xs text-destructive">Couldn&apos;t create image — try again</p>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">← Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- src/components/tarot/spread/spread-share-card.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/tarot/spread/spread-share-card.tsx src/components/tarot/spread/spread-share-modal.tsx src/components/tarot/spread/spread-share-card.test.tsx
git commit -m "feat(tarot): spread share card + modal (9:16 PNG)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `SpreadDraw` (motion choreography) + `SpreadResult`

**Files:**
- Create: `src/components/tarot/spread/spread-result.tsx`
- Create: `src/components/tarot/spread/spread-draw.tsx`
- Test: `src/components/tarot/spread/spread-draw.test.tsx`
- Modify: `package.json` (add `motion`)

**Interfaces:**
- Consumes: `drawSpread`, `SpreadReading`, `TarotCard` (Task 1); `SpreadCardBack` (Task 3); `SpreadShareModal` (Task 5); `elementOf`, `ELEMENT_TEXT` (saju-display); `track` (Task 4 events); `useTranslations`/`useLocale` (`TarotSpread`); `Button`; `motion`, `AnimatePresence`, `MotionConfig` from `motion/react`; the `/api/tarot-spread-reading` endpoint.
- Produces:
  - `function SpreadResult(props: { saju: UserSaju; cards: [TarotCard,TarotCard,TarotCard]; reading: SpreadReading; onReplay: () => void }): JSX.Element`
  - `function SpreadDraw(props: { saju: UserSaju }): JSX.Element`

- [ ] **Step 1: Install `motion`**

Run: `npm install motion`
Expected: `motion` added to `dependencies` in `package.json`.

- [ ] **Step 2: Implement `spread-result.tsx`:**

```tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { SpreadShareModal } from "./spread-share-modal";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import type { SpreadReading, TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

const POSITIONS = ["past", "present", "future"] as const;

export function SpreadResult({
  saju, cards, reading, onReplay,
}: { saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; reading: SpreadReading; onReplay: () => void }) {
  const t = useTranslations("TarotSpread");
  const locale = useLocale();
  const [shareOpen, setShareOpen] = useState(false);
  const accent = ELEMENT_TEXT[elementOf(saju.dayMaster)];
  const isKo = locale === "ko";
  const lines = [reading.past, reading.present, reading.future];

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-3">
        {cards.map((c, i) => (
          <div key={c.id} className="w-[96px] text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/tarot/${c.filename}`}
              alt={isKo ? c.name_kr : c.name_en}
              className={`w-full rounded-lg shadow-lg ${i === 1 ? "scale-105" : ""}`}
            />
            <p className={`mt-1 text-[11px] font-bold uppercase ${accent}`}>{t(POSITIONS[i])}</p>
            <p className="font-display text-xs font-semibold text-foreground">{isKo ? c.name_kr : c.name_en}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-left">
        {POSITIONS.map((pos, i) => (
          <p key={pos} className="text-sm leading-relaxed text-foreground">
            <span className={`font-bold ${accent}`}>{t(pos)} · </span>{lines[i]}
          </p>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-4">
        <p className="font-serif text-sm leading-relaxed text-foreground">&ldquo;{reading.synthesis}&rdquo;</p>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={() => setShareOpen(true)}>{t("shareButton")}</Button>
        <Button variant="ghost" className="w-full" onClick={onReplay}>{t("replay")}</Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">{t("disclaimer")}</p>

      <SpreadShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        saju={saju}
        cards={cards}
        synthesis={reading.synthesis}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write the failing test** — `spread-draw.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Render motion.* as plain elements, dropping animation-only props.
vi.mock("motion/react", () => {
  const DROP = new Set(["initial", "animate", "exit", "transition", "whileTap", "whileHover", "layout", "layoutId"]);
  const make = (tag: string) => ({ children, ...rest }: Record<string, unknown>) => {
    const safe: Record<string, unknown> = {};
    for (const k of Object.keys(rest)) if (!DROP.has(k)) safe[k] = rest[k];
    return React.createElement(tag, safe, children as React.ReactNode);
  };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
vi.mock("next-intl", () => ({
  useTranslations: () => (k: string, vars?: Record<string, string>) => (vars?.position ? `${k}:${vars.position}` : k),
  useLocale: () => "en",
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("./spread-result", () => ({
  SpreadResult: () => <div data-testid="spread-result" />,
}));

import { SpreadDraw } from "./spread-draw";
import type { UserSaju } from "@/lib/saju-types";

const saju: UserSaju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };

describe("SpreadDraw", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({ past: "p", present: "c", future: "f", synthesis: "s" }),
    } as Response);
  });

  it("draws all three positions in order, then shows the result", async () => {
    render(<SpreadDraw saju={saju} />);
    // The draw button is labelled for the next position.
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:past" }));
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:present" }));
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:future" }));
    expect(await screen.findByTestId("spread-result")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run to verify failure**

Run: `npm test -- src/components/tarot/spread/spread-draw.test.tsx`
Expected: FAIL — `spread-draw` not found.

- [ ] **Step 5: Implement `spread-draw.tsx`:**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { SpreadCardBack } from "./spread-card-back";
import { SpreadResult } from "./spread-result";
import { drawSpread, type SpreadReading, type TarotCard } from "@/lib/tarot";
import { track } from "@/lib/analytics";
import type { UserSaju } from "@/lib/saju-types";

const DECK_SIZE = 11;
const POSITIONS = ["past", "present", "future"] as const;

export function SpreadDraw({ saju }: { saju: UserSaju }) {
  const t = useTranslations("TarotSpread");
  const locale = useLocale();
  const [cards, setCards] = useState<[TarotCard, TarotCard, TarotCard]>(() => drawSpread());
  const [drawn, setDrawn] = useState(0);
  const [reading, setReading] = useState<SpreadReading | null>(null);
  const done = drawn >= 3;
  const isKo = locale === "ko";

  useEffect(() => { track("spread_started"); }, []);

  useEffect(() => {
    if (!done) return;
    track("spread_revealed");
    const ids = cards.map((c) => c.id).join(",");
    fetch(`/api/tarot-spread-reading?cardIds=${ids}&dayMaster=${encodeURIComponent(saju.dayMaster)}&locale=${locale}`)
      .then((r) => r.json() as Promise<SpreadReading>)
      .then(setReading)
      .catch(() => setReading(null));
  }, [done, cards, saju.dayMaster, locale]);

  const drawNext = () => {
    track("spread_card_drawn", { position: POSITIONS[drawn] });
    setDrawn((n) => n + 1);
  };

  const replay = () => {
    setCards(drawSpread());
    setDrawn(0);
    setReading(null);
    track("spread_started");
  };

  if (done && reading) {
    return <SpreadResult saju={saju} cards={cards} reading={reading} onReplay={replay} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Fan of card backs (disappears once all 3 are drawn) */}
        <div className="relative mx-auto h-56 w-full max-w-xs">
          <AnimatePresence>
            {!done &&
              Array.from({ length: DECK_SIZE }).map((_, i) => {
                const offset = i - (DECK_SIZE - 1) / 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: offset * 8 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 14 }}
                    className="absolute left-1/2 top-2 -ml-9 w-[72px]"
                    style={{ transformOrigin: "50% 220px" }}
                  >
                    <SpreadCardBack className="w-[72px] drop-shadow-lg" />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        {/* Drawn slots: past | present | future */}
        <div className="flex justify-center gap-3">
          {POSITIONS.map((pos, i) => (
            <div key={pos} className="w-[88px] text-center">
              <div className="flex h-32 items-center justify-center">
                <AnimatePresence>
                  {drawn > i && (
                    <motion.img
                      key={cards[i].id}
                      src={`/tarot/${cards[i].filename}`}
                      alt={isKo ? cards[i].name_kr : cards[i].name_en}
                      initial={{ scale: 0, rotateY: 90 }}
                      animate={{ scale: i === 1 ? 1.1 : 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 16 }}
                      className="w-[80px] rounded-lg shadow-lg"
                    />
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary">{t(pos)}</p>
            </div>
          ))}
        </div>

        {/* Draw button / loading */}
        {!done && (
          <Button size="lg" className="w-full" onClick={drawNext}>
            {t("drawPosition", { position: t(POSITIONS[drawn]) })}
          </Button>
        )}
        {done && reading === null && (
          <p className="animate-pulse text-center text-sm text-muted-foreground">{t("loading")}</p>
        )}
      </div>
    </MotionConfig>
  );
}
```

> Note: the test mock renders `t("drawPosition", {position})` as `drawPosition:past` etc. (the second `t(POSITIONS[drawn])` resolves to the raw key `past`), so the button name advances `past → present → future`.

- [ ] **Step 6: Run to verify pass**

Run: `npm test -- src/components/tarot/spread/spread-draw.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/tarot/spread/spread-draw.tsx src/components/tarot/spread/spread-result.tsx src/components/tarot/spread/spread-draw.test.tsx package.json package-lock.json
git commit -m "feat(tarot): SpreadDraw motion choreography + SpreadResult

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Route page + `SpreadView` gate + CTA + full verification

**Files:**
- Create: `src/app/[locale]/tarot/spread/page.tsx`
- Create: `src/components/tarot/spread/spread-view.tsx`
- Test: `src/components/tarot/spread/spread-view.test.tsx`
- Modify: `src/components/tarot/tarot-view.tsx` (add CTA link)

**Interfaces:**
- Consumes: `BirthForm`, `calcUserSaju`, `loadUserSaju`/`saveUserSaju`, `SpreadDraw` (Task 6), `useTranslations("TarotSpread")`, `BirthData`/`UserSaju` types.
- Produces: `function SpreadView(): JSX.Element`; default-export page component.

- [ ] **Step 1: Write the failing test** — `spread-view.test.tsx` (mirrors `tarot-view.test.tsx`):

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const store = vi.hoisted(() => ({ saju: null as unknown }));
vi.mock("@/lib/saju-storage", () => ({ loadUserSaju: () => store.saju, saveUserSaju: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "en" }));
vi.mock("@/components/kst/birth-form", () => ({ BirthForm: () => <div data-testid="birth-form" /> }));
vi.mock("@/components/tarot/spread/spread-draw", () => ({ SpreadDraw: () => <div data-testid="spread-draw" /> }));
vi.mock("@/app/actions/saju", () => ({ calcUserSaju: vi.fn() }));

import { SpreadView } from "./spread-view";

describe("SpreadView", () => {
  beforeEach(() => { store.saju = null; });

  it("shows the birth form when no saju is stored", async () => {
    store.saju = null;
    render(<SpreadView />);
    expect(await screen.findByTestId("birth-form")).toBeInTheDocument();
    expect(screen.queryByTestId("spread-draw")).toBeNull();
  });

  it("shows the spread draw when a saju is stored", async () => {
    store.saju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };
    render(<SpreadView />);
    expect(await screen.findByTestId("spread-draw")).toBeInTheDocument();
    expect(screen.queryByTestId("birth-form")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/components/tarot/spread/spread-view.test.tsx`
Expected: FAIL — `spread-view` not found.

- [ ] **Step 3: Implement `spread-view.tsx`** (mirror `tarot-view.tsx`, swap namespace + draw):

```tsx
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { BirthForm } from "@/components/kst/birth-form";
import { SpreadDraw } from "@/components/tarot/spread/spread-draw";
import { loadUserSaju, saveUserSaju } from "@/lib/saju-storage";
import { calcUserSaju } from "@/app/actions/saju";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServer = () => undefined;

export function SpreadView() {
  const t = useTranslations("TarotSpread");
  const [saju, setSaju] = useState<UserSaju | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const defaultTz = useSyncExternalStore(subscribeTz, getTz, getTzServer);

  useEffect(() => { setSaju(loadUserSaju()); setReady(true); }, []);

  const handleSubmit = async (data: BirthData) => {
    setSubmitting(true);
    try {
      const s = await calcUserSaju(data);
      saveUserSaju(s);
      setSaju(s);
    } catch (err) {
      console.error("Tarot spread saju calc failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="font-serif italic text-base text-primary mt-2">{t("subtitle")}</p>
        </div>

        {saju ? (
          <SpreadDraw saju={saju} />
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-card/60 p-5">
            <p className="text-sm text-muted-foreground">{t("birthdayPrompt")}</p>
            <BirthForm
              onSubmit={handleSubmit}
              defaultTimezone={defaultTz}
              submitting={submitting}
              submitLabel={t("birthdaySubmit")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement the route page `src/app/[locale]/tarot/spread/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { SpreadView } from "@/components/tarot/spread/spread-view";

export const metadata: Metadata = {
  title: "Past · Present · Future Tarot · KSaju",
  description: "Draw a 3-card past, present & future tarot spread, personalized by your saju.",
};

export default function TarotSpreadPage() {
  return <SpreadView />;
}
```

- [ ] **Step 5: Add the CTA link in `tarot-view.tsx`.** Add the import at the top:

```tsx
import Link from "next/link";
```

Then, inside the `<div className="w-full max-w-md space-y-6 text-center">`, immediately after the `{saju ? (...) : (...)}` block (before its closing `</div>`), add:

```tsx
        <Link
          href="/tarot/spread"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("spreadCta")}
        </Link>
```

(`t` here is the existing `useTranslations("Tarot")`; `spreadCta` was added in Task 4.)

- [ ] **Step 6: Run the spread-view test**

Run: `npm test -- src/components/tarot/spread/spread-view.test.tsx`
Expected: PASS.

- [ ] **Step 7: Full verification**

Run: `npm test`
Expected: ALL pass (existing + new).

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: clean (or only the 2 pre-existing warnings noted in cycle 21).

Run: `npm run build`
Expected: success; `/[locale]/tarot/spread` appears in the route list (static where the locale layout allows; `/api/tarot-spread-reading` is dynamic).

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/tarot/spread/ src/components/tarot/spread/spread-view.tsx src/components/tarot/spread/spread-view.test.tsx src/components/tarot/tarot-view.tsx
git commit -m "feat(tarot): /tarot/spread route, saju gate + CTA from /tarot

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Separate route `/tarot/spread` → Task 7. CTA from `/tarot` → Task 7. Credit gate later (route boundary, no code) → noted in constraints.
- True random `drawSpread` → Task 1.
- LLM 1 call, JSON `{past,present,future,synthesis}`, no cache, locale fallback → Tasks 1 + 2.
- `motion` animation (fan → sequential buttons → zoom/flip → deck fades → 3-column) → Task 6.
- Card back C (dark hanji + gold 창살 + ㅎ stamp) → Task 3.
- Fan arc + horizontal 3-column (present emphasized) → Tasks 6 (`scale 1.1`/`scale-105` on present).
- 9:16 share (3 faces + synthesis, reuse `useShareImage`/`ShareCardFooter`) → Task 5.
- i18n `TarotSpread` 4 locales → Task 4. Analytics `spread_started`/`spread_card_drawn`/`spread_revealed`/`share_clicked{kind:"tarot_spread"}` → Tasks 4 + 6 + 5.
- `prefers-reduced-motion` → Task 6 (`MotionConfig reducedMotion="user"`).
- Tests for drawSpread, route fallback, card back, share card, draw gating, view gate → all tasks.

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `SpreadReading` shape identical across tarot.ts / route / draw / result / modal. `drawSpread` returns `[TarotCard,TarotCard,TarotCard]` consumed as a 3-tuple everywhere. `SpreadResult` prop `onReplay` matches `SpreadDraw.replay`. `SpreadShareModal` props match `SpreadResult`'s call. Position label keys `past`/`present`/`future` consistent in i18n + components. Model id `anthropic/claude-haiku-4.5` matches existing route.
