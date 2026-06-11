# Daily Fortune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "오늘의 운세 (Daily Fortune)" card to the top of the 내 사주 result — OpenRouter-generated 1-sentence fortune, cached in Supabase, shareable as 9:16 PNG.

**Architecture:** `DailyFortune` client component fetches `GET /api/daily-fortune?dayMaster=X` on mount. The route computes today's KST day pillar via `birthToSaju`, checks Supabase cache (date + day_master unique key), calls OpenRouter `anthropic/claude-haiku-4-5-20251001` on miss, then returns. UI: loading skeleton → full card → Share modal reusing existing `useShareImage` hook.

**Tech Stack:** Next.js 16 App Router, Supabase (service role, server-only), OpenRouter via native `fetch`, Tailwind v4, shadcn/ui, vitest + React Testing Library.

---

## File Map

| File | Status |
|------|--------|
| `src/lib/fortune.ts` | Modify — export `TimeRel` + `stemRelation` |
| `src/lib/fortune.test.ts` | Modify — add export tests |
| `docs/supabase-migration.sql` | Modify — append `daily_fortunes` DDL |
| `.env.example` | Modify — add `OPENROUTER_API_KEY` |
| `src/app/api/daily-fortune/route.ts` | **Create** |
| `src/components/fortune/DailyFortuneShareCard.tsx` | **Create** |
| `src/components/fortune/DailyFortuneShareCard.test.tsx` | **Create** |
| `src/components/fortune/DailyFortuneShareModal.tsx` | **Create** |
| `src/components/fortune/DailyFortuneShareModal.test.tsx` | **Create** |
| `src/components/DailyFortune.tsx` | **Create** (imports modal — created last) |
| `src/components/DailyFortune.test.tsx` | **Create** |
| `src/components/saju/saju-result.tsx` | Modify — add `<DailyFortune>` at top |

> **Task order matters:** ShareCard (Task 4) → ShareModal (Task 5) → DailyFortune component (Task 6). `DailyFortune.tsx` imports `DailyFortuneShareModal`, so the modal must exist before the component is created.

---

## Task 1: Export `TimeRel` + `stemRelation` from `fortune.ts`

**Files:**
- Modify: `src/lib/fortune.ts` (lines 85, 106)
- Modify: `src/lib/fortune.test.ts`

- [ ] **Step 1: Add failing tests to `fortune.test.ts`**

In `src/lib/fortune.test.ts`, change the first import line from:
```typescript
import { calcFortune } from "./fortune";
```
to:
```typescript
import { calcFortune, stemRelation, type TimeRel } from "./fortune";
```

Append this describe block at the end of the file:

```typescript
describe("stemRelation (exported)", () => {
  it("甲+己 = combo (천간합)", () => {
    const r: TimeRel = stemRelation("甲", "己");
    expect(r).toBe("combo");
  });

  it("甲+乙 = same (both wood)", () => {
    expect(stemRelation("甲", "乙")).toBe("same");
  });

  it("壬+甲 = i-generate (water→wood)", () => {
    // 壬=water dm, 甲=wood other. WUXING_PRODUCE[water]=wood → i-generate
    expect(stemRelation("壬", "甲")).toBe("i-generate");
  });

  it("甲+壬 = generate-me (water→wood, wood dm is generated)", () => {
    // 甲=wood dm, 壬=water other. WUXING_PRODUCE[water]=wood → generate-me
    expect(stemRelation("甲", "壬")).toBe("generate-me");
  });

  it("丙+壬 = control (fire vs water)", () => {
    expect(stemRelation("丙", "壬")).toBe("control");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run src/lib/fortune.test.ts
```

Expected: FAIL with "stemRelation is not a function" or import error.

- [ ] **Step 3: Export `TimeRel` and `stemRelation` in `fortune.ts`**

In `src/lib/fortune.ts`, change line 85 from:
```typescript
type TimeRel = "combo" | "same" | "generate-me" | "i-generate" | "control" | "neutral";
```
to:
```typescript
export type TimeRel = "combo" | "same" | "generate-me" | "i-generate" | "control" | "neutral";
```

Change line 106 from:
```typescript
function stemRelation(dmStem: string, otherStem: string): TimeRel {
```
to:
```typescript
export function stemRelation(dmStem: string, otherStem: string): TimeRel {
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run src/lib/fortune.test.ts
```

Expected: all existing + 5 new stemRelation tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fortune.ts src/lib/fortune.test.ts
git commit -m "feat(fortune): export stemRelation + TimeRel for API route"
```

---

## Task 2: Supabase Migration + Environment Variable

**Files:**
- Modify: `docs/supabase-migration.sql`
- Modify: `.env.example`

- [ ] **Step 1: Append `daily_fortunes` DDL to `docs/supabase-migration.sql`**

Append at the very end of the file:

```sql

-- Daily Fortune cache table (cycle 23)
create table if not exists daily_fortunes (
  id           uuid        primary key default gen_random_uuid(),
  date         date        not null,
  day_master   text        not null,
  today_pillar text        not null,
  relation     text        not null,
  message      text        not null,
  energy       integer     not null check (energy >= 1 and energy <= 5),
  lucky_color  text        not null,
  created_at   timestamptz not null default now(),
  unique(date, day_master)
);
```

- [ ] **Step 2: Add `OPENROUTER_API_KEY` to `.env.example`**

Append after the `ADMIN_PASSWORD=` line:

```
# OpenRouter API key for Daily Fortune LLM generation (cycle 23).
# Get from openrouter.ai/keys. Model: anthropic/claude-haiku-4-5-20251001
# At most 10 LLM calls/day (10 日干 types), Supabase caches the rest.
OPENROUTER_API_KEY=
```

- [ ] **Step 3: Run the DDL in Supabase SQL Editor**

Copy the `daily_fortunes` CREATE TABLE block and run it in your Supabase project's SQL Editor (supabase.com → project → SQL Editor). Verify the table appears in the Table Editor.

- [ ] **Step 4: Add `OPENROUTER_API_KEY` to `.env.local`**

In `.env.local`, add your actual key:
```
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

- [ ] **Step 5: Commit**

```bash
git add docs/supabase-migration.sql .env.example
git commit -m "feat(db): daily_fortunes table + OPENROUTER_API_KEY env"
```

---

## Task 3: API Route `src/app/api/daily-fortune/route.ts`

**Files:**
- Create: `src/app/api/daily-fortune/route.ts` (new directory tree)

- [ ] **Step 1: Create the file**

Create `src/app/api/daily-fortune/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { birthToSaju } from "@/lib/saju";
import { stemRelation, type TimeRel } from "@/lib/fortune";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { elementOf, WUXING_META } from "@/lib/saju-display";

export const revalidate = 86400;

const VALID_STEMS = new Set(HEAVENLY_STEMS.map((s) => s.char));

const FALLBACK: Record<TimeRel, { message: string; energy: number; lucky_color: string }> = {
  combo:         { message: "Stars align perfectly today — your bias era starts now! ✨",    energy: 5, lucky_color: "Hot Pink"      },
  same:          { message: "You're fully in your element today — ride the wave! 🌊",        energy: 4, lucky_color: "Golden Yellow" },
  "generate-me": { message: "The universe has your back today — lean into it! 🍀",           energy: 4, lucky_color: "Sage Green"    },
  "i-generate":  { message: "Your energy lights up everyone around you today! 💫",           energy: 3, lucky_color: "Lavender"      },
  control:       { message: "A little resistance makes you stronger — you've got this! 🔥",  energy: 3, lucky_color: "Dusty Rose"    },
  neutral:       { message: "A calm, steady day — perfect for planning your next era! 🌤️",  energy: 3, lucky_color: "Sky Blue"      },
};

export async function GET(request: NextRequest) {
  const dayMaster = request.nextUrl.searchParams.get("dayMaster");
  if (!dayMaster || !VALID_STEMS.has(dayMaster)) {
    return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });
  }

  // Today's date in KST
  const now = new Date();
  const kstStr = now.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(kstStr);
  const kstYear = kst.getFullYear();
  const kstMonth = kst.getMonth() + 1;
  const kstDay = kst.getDate();
  const todayStr = `${kstYear}-${String(kstMonth).padStart(2, "0")}-${String(kstDay).padStart(2, "0")}`;

  // Today's day pillar via birthToSaju (server-only — safe in route handler)
  const todaySaju = birthToSaju({
    year: kstYear,
    month: kstMonth,
    day: kstDay,
    timezone: "Asia/Seoul",
  });
  const todayPillar = todaySaju.pillars.day;
  const todayStem = todayPillar[0];
  const relation = stemRelation(dayMaster, todayStem);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Cache hit
  const { data: cached } = await supabase
    .from("daily_fortunes")
    .select("*")
    .eq("date", todayStr)
    .eq("day_master", dayMaster)
    .maybeSingle();

  if (cached) return NextResponse.json(cached);

  // OpenRouter generation
  const elementLabel = WUXING_META[elementOf(dayMaster)].label;
  const prompt = `Today's day pillar is ${todayPillar}. The user's day master is ${dayMaster} (${elementLabel}).
Their cosmic relationship today is "${relation}".

Write exactly 1 uplifting sentence (30–40 words) for a K-pop fan's daily fortune.
Tone: playful, Gen Z, positive. You may reference K-pop/idol culture subtly.
Pick an energy level (1–5, where 5 is peak) and a lucky color name.

Respond ONLY with valid JSON — no markdown, no extra text:
{"message":"...","energy":4,"lucky_color":"Coral Pink"}`;

  try {
    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ksaju.me",
        "X-Title": "KSaju Daily Fortune",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5-20251001",
        max_tokens: 120,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}`);

    const llmJson = await llmRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = llmJson.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as {
      message: string;
      energy: number;
      lucky_color: string;
    };

    if (
      typeof parsed.message !== "string" ||
      typeof parsed.energy !== "number" ||
      typeof parsed.lucky_color !== "string"
    ) {
      throw new Error("Invalid LLM response shape");
    }

    const energy = Math.max(1, Math.min(5, Math.round(parsed.energy)));

    const { data: inserted } = await supabase
      .from("daily_fortunes")
      .upsert(
        {
          date: todayStr,
          day_master: dayMaster,
          today_pillar: todayPillar,
          relation,
          message: parsed.message,
          energy,
          lucky_color: parsed.lucky_color,
        },
        { onConflict: "date,day_master" },
      )
      .select("*")
      .maybeSingle();

    return NextResponse.json(
      inserted ?? {
        id: "fresh",
        date: todayStr,
        day_master: dayMaster,
        today_pillar: todayPillar,
        relation,
        message: parsed.message,
        energy,
        lucky_color: parsed.lucky_color,
      },
    );
  } catch {
    // Fallback — static message, not saved to DB
    return NextResponse.json({
      id: "fallback",
      date: todayStr,
      day_master: dayMaster,
      today_pillar: todayPillar,
      relation,
      ...FALLBACK[relation],
    });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and smoke-test the route**

```
npm run dev
```

Open: `http://localhost:3000/api/daily-fortune?dayMaster=辛`

Expected response (shape):
```json
{
  "id": "...",
  "date": "2026-06-11",
  "day_master": "辛",
  "today_pillar": "壬子",
  "relation": "generate-me",
  "message": "...",
  "energy": 4,
  "lucky_color": "..."
}
```

Also test invalid input `?dayMaster=X` — expect `{"error":"Invalid dayMaster"}` with HTTP 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/daily-fortune/route.ts
git commit -m "feat(api): /api/daily-fortune — OpenRouter + Supabase cache"
```

---

## Task 4: `DailyFortuneShareCard` (9:16 PNG Card)

**Files:**
- Create: `src/components/fortune/DailyFortuneShareCard.tsx`
- Create: `src/components/fortune/DailyFortuneShareCard.test.tsx`

The `DailyFortuneData` type is defined here and exported so the modal and main component can import it.

- [ ] **Step 1: Write the failing tests**

Create `src/components/fortune/DailyFortuneShareCard.test.tsx`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortuneShareCard } from "./DailyFortuneShareCard";
import type { DailyFortuneData } from "./DailyFortuneShareCard";

const DATA: DailyFortuneData = {
  id: "test",
  date: "2026-06-11",
  day_master: "辛",
  today_pillar: "壬申",
  relation: "generate-me",
  message: "The universe has your back today — lean into it! 🍀",
  energy: 4,
  lucky_color: "Sage Green",
};

describe("DailyFortuneShareCard", () => {
  it("renders today's pillar hanja as the hero", () => {
    render(<DailyFortuneShareCard data={DATA} />);
    expect(screen.getByText("壬申")).toBeInTheDocument();
  });

  it("renders the fortune message", () => {
    render(<DailyFortuneShareCard data={DATA} />);
    expect(screen.getByText(/The universe has your back today/)).toBeInTheDocument();
  });

  it("renders the lucky color badge", () => {
    render(<DailyFortuneShareCard data={DATA} />);
    expect(screen.getByText("Sage Green")).toBeInTheDocument();
  });

  it("renders the ksaju.me watermark via ShareCardFooter", () => {
    render(<DailyFortuneShareCard data={DATA} />);
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run src/components/fortune/DailyFortuneShareCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/fortune/DailyFortuneShareCard.tsx`**

```typescript
import { forwardRef } from "react";
import { elementOf, WUXING_META, ELEMENT_TEXT } from "@/lib/saju-display";
import { ShareCardFooter } from "@/components/share/share-card-footer";
import type { WuXing } from "@/lib/saju-types";

export type DailyFortuneData = {
  id: string;
  date: string;
  day_master: string;
  today_pillar: string;
  relation: string;
  message: string;
  energy: number;
  lucky_color: string;
};

// Tailwind v4 JIT: must be static string literals — mirrors FortuneShareCard
const ACCENT_BG: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

export const DailyFortuneShareCard = forwardRef<
  HTMLDivElement,
  { data: DailyFortuneData }
>(function DailyFortuneShareCard({ data }, ref) {
  const todayStem = data.today_pillar[0];
  const todayEl = elementOf(todayStem);
  const meta = WUXING_META[todayEl];
  const pillarColor = ELEMENT_TEXT[todayEl];
  const stars = "★".repeat(data.energy) + "☆".repeat(5 - data.energy);

  return (
    <div
      ref={ref}
      className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
      style={{ width: 360, height: 640 }}
    >
      <div
        className="changsal-band absolute left-0 right-0 top-0 h-[14px]"
        style={{ backgroundSize: "40px 14px" }}
      />

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-7 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          오늘의 운세 · Daily Fortune
        </p>

        <div>
          <p className={`hanja font-display text-6xl font-bold ${pillarColor}`}>
            {data.today_pillar}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {meta.emoji} {meta.label}
          </p>
        </div>

        <p className="px-2 text-sm leading-relaxed text-foreground">
          &ldquo;{data.message}&rdquo;
        </p>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-base text-accent">{stars}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACCENT_BG[todayEl]}`}
          >
            {data.lucky_color}
          </span>
        </div>
      </div>

      <ShareCardFooter />

      <div
        className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]"
        style={{ backgroundSize: "40px 14px" }}
      />
    </div>
  );
});
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run src/components/fortune/DailyFortuneShareCard.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/DailyFortuneShareCard.tsx src/components/fortune/DailyFortuneShareCard.test.tsx
git commit -m "feat(ui): DailyFortuneShareCard — 9:16 PNG share card"
```

---

## Task 5: `DailyFortuneShareModal`

**Files:**
- Create: `src/components/fortune/DailyFortuneShareModal.tsx`
- Create: `src/components/fortune/DailyFortuneShareModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/fortune/DailyFortuneShareModal.test.tsx`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortuneShareModal } from "./DailyFortuneShareModal";
import type { DailyFortuneData } from "./DailyFortuneShareCard";

const DATA: DailyFortuneData = {
  id: "test",
  date: "2026-06-11",
  day_master: "辛",
  today_pillar: "壬申",
  relation: "generate-me",
  message: "The universe has your back today — lean into it! 🍀",
  energy: 4,
  lucky_color: "Sage Green",
};

describe("DailyFortuneShareModal", () => {
  it("renders the share card and Share button when open", () => {
    render(<DailyFortuneShareModal open onClose={() => {}} data={DATA} />);
    expect(screen.getByText(/오늘의 운세/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
  });

  it("renders nothing when closed", () => {
    render(
      <DailyFortuneShareModal open={false} onClose={() => {}} data={DATA} />,
    );
    expect(screen.queryByText(/오늘의 운세/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run src/components/fortune/DailyFortuneShareModal.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/fortune/DailyFortuneShareModal.tsx`**

```typescript
"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DailyFortuneShareCard } from "./DailyFortuneShareCard";
import type { DailyFortuneData } from "./DailyFortuneShareCard";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";

type Props = {
  open: boolean;
  onClose: () => void;
  data: DailyFortuneData;
};

export function DailyFortuneShareModal({ open, onClose, data }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-daily-fortune.png",
    shareMeta: {
      title: "My daily fortune on KSaju",
      text: "My daily saju fortune — make yours at ksaju.me",
    },
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-h-[90vh] max-w-[360px] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Your daily fortune</DialogTitle>
        <DialogDescription className="sr-only">
          Today&apos;s saju fortune reading.
        </DialogDescription>

        <DailyFortuneShareCard ref={cardRef} data={data} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => {
              track("share_clicked", { kind: "daily_fortune" });
              share();
            }}
            disabled={status === "rendering"}
            className="w-full"
          >
            {shareLabel}
          </Button>
          {status === "error" && (
            <p className="text-center text-xs text-destructive">
              Couldn&apos;t create image — try again
            </p>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            ← Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run src/components/fortune/DailyFortuneShareModal.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/DailyFortuneShareModal.tsx src/components/fortune/DailyFortuneShareModal.test.tsx
git commit -m "feat(ui): DailyFortuneShareModal — share dialog + PNG export"
```

---

## Task 6: `DailyFortune` Client Component

**Files:**
- Create: `src/components/DailyFortune.tsx`
- Create: `src/components/DailyFortune.test.tsx`

`DailyFortuneData` type is imported from `DailyFortuneShareCard` (the canonical definition).

- [ ] **Step 1: Write the failing tests**

Create `src/components/DailyFortune.test.tsx`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortune } from "./DailyFortune";
import type { DailyFortuneData } from "@/components/fortune/DailyFortuneShareCard";

const MOCK_DATA: DailyFortuneData = {
  id: "test-id",
  date: "2026-06-11",
  day_master: "辛",
  today_pillar: "壬申",
  relation: "generate-me",
  message: "The universe has your back today — lean into it! 🍀",
  energy: 4,
  lucky_color: "Sage Green",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DailyFortune", () => {
  it("shows loading skeleton (no Share button) while fetch is pending", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    render(<DailyFortune dayMaster="辛" />);
    expect(screen.queryByRole("button", { name: /share/i })).not.toBeInTheDocument();
  });

  it("renders fortune message and Share button after fetch resolves", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => MOCK_DATA,
    } as Response);

    render(<DailyFortune dayMaster="辛" />);

    await screen.findByText(/The universe has your back today/);
    expect(screen.getByText("Sage Green")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
    expect(screen.getByText(/Come back tomorrow/)).toBeInTheDocument();
  });

  it("renders today's pillar hanja in the date line", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => MOCK_DATA,
    } as Response);

    render(<DailyFortune dayMaster="辛" />);
    await screen.findByText(/壬申/);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
npx vitest run src/components/DailyFortune.test.tsx
```

Expected: FAIL — `DailyFortune` module not found.

- [ ] **Step 3: Create `src/components/DailyFortune.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import type { HeavenlyStem } from "@/lib/saju-types";
import { DailyFortuneShareModal } from "@/components/fortune/DailyFortuneShareModal";
import type { DailyFortuneData } from "@/components/fortune/DailyFortuneShareCard";

export function DailyFortune({ dayMaster }: { dayMaster: HeavenlyStem }) {
  const [data, setData] = useState<DailyFortuneData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/daily-fortune?dayMaster=${encodeURIComponent(dayMaster)}`)
      .then((r) => r.json() as Promise<DailyFortuneData>)
      .then(setData)
      .catch(() => {});
  }, [dayMaster]);

  if (!data) {
    return (
      <section
        aria-label="Loading today's fortune"
        className="animate-pulse space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
      >
        <div className="mx-auto h-3 w-32 rounded bg-muted" />
        <div className="mx-auto h-3 w-24 rounded bg-muted" />
        <div className="h-12 rounded bg-muted" />
        <div className="mx-auto h-3 w-40 rounded bg-muted" />
      </section>
    );
  }

  const todayStem = data.today_pillar[0];
  const todayEl = elementOf(todayStem);
  const pillarColor = ELEMENT_TEXT[todayEl];
  const stars = "★".repeat(data.energy) + "☆".repeat(5 - data.energy);
  const dateStr = new Date(`${data.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        ✦ Today&apos;s Fortune · 오늘의 운세
      </p>
      <p className="text-center text-xs text-muted-foreground">
        {dateStr} ·{" "}
        <span className={`hanja font-bold ${pillarColor}`}>{data.today_pillar}</span>
      </p>

      <p className="text-center text-sm leading-relaxed">
        &ldquo;{data.message}&rdquo;
      </p>

      <div className="flex items-center justify-center gap-3 text-xs">
        <span className="text-accent">{stars}</span>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary opacity-60" />
          {data.lucky_color}
        </span>
      </div>

      <div className="space-y-1 text-center">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShareOpen(true)}
        >
          Share ✨
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Come back tomorrow for a new reading 🌙
        </p>
      </div>

      <DailyFortuneShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        data={data}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```
npx vitest run src/components/DailyFortune.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/DailyFortune.tsx src/components/DailyFortune.test.tsx
git commit -m "feat(ui): DailyFortune client component with skeleton + share"
```

---

## Task 7: `SajuResult` Integration + Final Build

**Files:**
- Modify: `src/components/saju/saju-result.tsx`

- [ ] **Step 1: Add `DailyFortune` import**

In `src/components/saju/saju-result.tsx`, add after the existing imports:

```typescript
import { DailyFortune } from "@/components/DailyFortune";
```

- [ ] **Step 2: Insert `<DailyFortune>` as the first child of the results div**

In `saju-result.tsx`, the return block currently starts with:

```tsx
  return (
    <div className="space-y-6">
      <header className="text-center">
```

Replace that opening with:

```tsx
  return (
    <div className="space-y-6">
      {/* 오늘의 운세 */}
      <DailyFortune dayMaster={userSaju.dayMaster} />

      <header className="text-center">
```

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass. Count should be previous total + 14 new tests (5 stemRelation + 4 ShareCard + 2 ShareModal + 3 DailyFortune).

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: ESLint check**

```
npx next lint
```

Expected: no new errors (the 2 pre-existing warnings are acceptable).

- [ ] **Step 6: Production build**

```
npm run build
```

Expected: `/` and `/inyeon` both show `○` (static). No build errors.

- [ ] **Step 7: Manual smoke test**

```
npm run dev
```

1. Go to `http://localhost:3000`, enter a birth date, submit.
2. Verify Daily Fortune card appears at the **top** of results (before 4기둥).
3. Card shows: loading skeleton briefly → message text → energy stars → lucky color badge → Share ✨ button → "Come back tomorrow 🌙".
4. Click Share ✨ → modal opens showing 9:16 preview card with today's pillar hanja hero, message, stars, lucky color, and ksaju.me QR footer.
5. Close modal. Fortune card remains visible.

- [ ] **Step 8: Commit**

```bash
git add src/components/saju/saju-result.tsx
git commit -m "feat(saju): add DailyFortune card at top of SajuResult"
```

- [ ] **Step 9: Push to remote**

```bash
git push
```

---

## Post-Deploy Checklist

After Vercel deploys automatically from `git push`:

1. Add `OPENROUTER_API_KEY` to Vercel environment variables (Settings → Environment Variables → Production + Preview + Development).
2. Redeploy (or wait for next push) for the env var to take effect.
3. Visit `https://ksaju.me`, submit a birth date.
4. Confirm Daily Fortune card loads. First hit: OpenRouter call + Supabase INSERT. Second refresh: Supabase cache hit (fast).
5. Check Supabase Table Editor → `daily_fortunes` has a row for today.
