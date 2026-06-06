# Fortune Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export the '내 사주' fortune (4 cards) as a 9:16 share PNG by reusing the cycle-13 image-export engine and the compat preview-modal pattern.

**Architecture:** A dedicated 9:16 `FortuneShareCard` (mirrors `CompatShareCard`, self-contained styling) calls `calcFortune` internally and renders a day-master hero + 4 fortune lines with tier badges. A thin `FortuneShareModal` (mirrors `CompatibilityModal`) makes the card body its preview and captures it via the existing `useShareImage` hook. `FortuneSection`'s disabled Share teaser becomes an active button that opens the modal and fires the `card_shared` analytics event.

**Tech Stack:** TypeScript, React, Radix Dialog (shadcn), `html-to-image` (via existing `share-image.ts`), vitest + happy-dom.

**Spec:** `docs/superpowers/specs/2026-06-06-fortune-share-card-design.md`

---

## File Structure

- `src/components/fortune/fortune-share-card.tsx` (create) — 9:16 `FortuneShareCard`, `forwardRef`, calls `calcFortune` internally.
- `src/components/fortune/fortune-share-card.test.tsx` (create) — renders hero + 4 fortunes + watermark.
- `src/components/fortune/fortune-share-modal.tsx` (create) — `FortuneShareModal`, preview body + Share via `useShareImage`.
- `src/components/fortune/fortune-share-modal.test.tsx` (create) — smoke: open renders card + Share button; closed renders nothing.
- `src/components/fortune/fortune-section.tsx` (modify) — activate Share, modal state, `card_shared` analytics.
- `src/components/fortune/fortune-section.test.tsx` (modify) — Share button is enabled (was disabled).

**Reused unchanged:** `src/lib/share-image.ts`, `src/hooks/use-share-image.ts`, `src/lib/fortune.ts`, `src/lib/saju-display.ts` (`dayMasterInfo`, `WUXING_META`).

---

## Task 1: `FortuneShareCard` — 9:16 export layout (TDD)

**Files:**
- Create: `src/components/fortune/fortune-share-card.tsx`
- Test: `src/components/fortune/fortune-share-card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/fortune/fortune-share-card.test.tsx`:
```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneShareCard } from "./fortune-share-card";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneShareCard", () => {
  it("renders the day-master hero, four fortunes and the watermark", () => {
    render(<FortuneShareCard userSaju={RM} luck={LUCK} />);
    // 辛 day master → Metal element label in the hero
    expect(screen.getByText(/Metal/)).toBeInTheDocument();
    expect(screen.getByText(/Money/)).toBeInTheDocument();
    expect(screen.getByText(/Love/)).toBeInTheDocument();
    expect(screen.getByText(/Career/)).toBeInTheDocument();
    expect(screen.getByText(/This Year/)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/fortune/fortune-share-card.test.tsx`
Expected: FAIL — `./fortune-share-card` not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/fortune/fortune-share-card.tsx`:
```tsx
import { forwardRef } from "react";
import { calcFortune } from "@/lib/fortune";
import { dayMasterInfo, WUXING_META } from "@/lib/saju-display";
import type { UserSaju, CurrentLuck, WuXing } from "@/lib/saju-types";

// 정적 오행 색 클래스 (Tailwind v4 JIT 스캔용 리터럴) — fortune-card.tsx와 동일 패턴.
const ACCENT: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

type FortuneShareCardProps = { userSaju: UserSaju; luck: CurrentLuck };

/**
 * Dedicated 9:16 fortune share card (360×640 base). Captured by the export
 * engine at pixelRatio 3 → 1080×1920 PNG. Self-contained styling so it renders
 * identically off the modal's preview and in the exported image. Calls
 * calcFortune internally (mirrors CompatShareCard calling getReading).
 */
export const FortuneShareCard = forwardRef<HTMLDivElement, FortuneShareCardProps>(
  function FortuneShareCard({ userSaju, luck }, ref) {
    const cards = calcFortune(userSaju, luck);
    const dm = dayMasterInfo(userSaju.dayMaster);
    const meta = WUXING_META[dm.element];
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

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-7 pt-10">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            My Saju Fortune
          </p>

          <div>
            <p className="font-display text-5xl font-bold text-foreground">
              <span className="hanja">{dm.char}</span> {meta.label}
            </p>
            <p className="hanja text-lg text-muted-foreground">
              {userSaju.pillars.day}
            </p>
            <p className="font-serif text-sm text-foreground">{dm.keyword}</p>
          </div>

          <ul className="w-full space-y-2 text-left">
            {cards.map((card) => (
              <li
                key={card.key}
                className="rounded-xl border border-border bg-card/60 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {card.emoji} {card.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[card.element]}`}
                  >
                    {card.tierLabel}
                  </span>
                </div>
                <p className="text-sm leading-snug text-foreground">
                  {card.line}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full pb-9">
          <p className="font-display text-base font-semibold text-primary">
            ksaju.me
          </p>
          <p className="text-[11px] text-muted-foreground">
            For entertainment 🌙
          </p>
        </div>

        <div
          className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />
      </div>
    );
  },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/fortune/fortune-share-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/fortune-share-card.tsx src/components/fortune/fortune-share-card.test.tsx
git commit -m "feat(fortune): 9:16 FortuneShareCard (day-master hero + 4 fortunes)"
```

---

## Task 2: `FortuneShareModal` — preview body + Share (smoke test)

**Files:**
- Create: `src/components/fortune/fortune-share-modal.tsx`
- Test: `src/components/fortune/fortune-share-modal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/fortune/fortune-share-modal.test.tsx`:
```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneShareModal } from "./fortune-share-modal";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneShareModal", () => {
  it("renders the share card and a Share button when open", () => {
    render(
      <FortuneShareModal open onClose={() => {}} userSaju={RM} luck={LUCK} />,
    );
    expect(screen.getByText(/My Saju Fortune/i)).toBeInTheDocument();
    expect(screen.getByText(/Money/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
  });

  it("renders nothing when closed", () => {
    render(
      <FortuneShareModal
        open={false}
        onClose={() => {}}
        userSaju={RM}
        luck={LUCK}
      />,
    );
    expect(screen.queryByText(/My Saju Fortune/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/fortune/fortune-share-modal.test.tsx`
Expected: FAIL — `./fortune-share-modal` not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/fortune/fortune-share-modal.tsx`:
```tsx
"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";
import { FortuneShareCard } from "./fortune-share-card";
import { useShareImage } from "@/hooks/use-share-image";

type FortuneShareModalProps = {
  open: boolean;
  onClose: () => void;
  userSaju: UserSaju;
  luck: CurrentLuck;
  onShared?: (method: "web_share" | "download") => void;
};

/**
 * Fortune share modal. The body IS the 9:16 FortuneShareCard so the preview
 * equals the exported PNG. Share captures the full-resolution card via
 * useShareImage. Mirrors CompatibilityModal.
 */
export function FortuneShareModal({
  open,
  onClose,
  userSaju,
  luck,
  onShared,
}: FortuneShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-fortune.png",
    shareMeta: {
      title: "My KSaju fortune",
      text: "My saju fortune — ksaju.me",
    },
    onShared,
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your saju fortune</DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju fortune reading for you.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <FortuneShareCard ref={cardRef} userSaju={userSaju} luck={luck} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={share}
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/fortune/fortune-share-modal.test.tsx`
Expected: PASS (2 cases).

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/fortune-share-modal.tsx src/components/fortune/fortune-share-modal.test.tsx
git commit -m "feat(fortune): FortuneShareModal — preview body + Share button"
```

---

## Task 3: Activate Share in `FortuneSection` + analytics (TDD)

**Files:**
- Modify: `src/components/fortune/fortune-section.tsx`
- Modify: `src/components/fortune/fortune-section.test.tsx`

- [ ] **Step 1: Update the section test (TDD)**

In `src/components/fortune/fortune-section.test.tsx`, replace the existing
`it("Share 티저 버튼은 비활성(disabled)이다", ...)` block with:
```tsx
  it("Share 버튼이 활성화되어 있다", () => {
    render(<FortuneSection userSaju={RM} luck={LUCK} />);
    const share = screen.getByRole("button", { name: /share/i });
    expect(share).toBeEnabled();
  });
```
(Leave the first test — "운세 4카드 제목을 렌더한다" — unchanged; the modal is closed by default so the inline titles remain unambiguous.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/fortune/fortune-section.test.tsx`
Expected: FAIL — the Share button is still `disabled` (toBeEnabled fails).

- [ ] **Step 3: Wire up the modal + analytics**

Replace the entire contents of `src/components/fortune/fortune-section.tsx` with:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FortuneCard } from "./fortune-card";
import { FortuneShareModal } from "./fortune-share-modal";
import { calcFortune } from "@/lib/fortune";
import { track } from "@/lib/analytics";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

/**
 * '내 사주' 뷰 안의 운세 섹션. calcFortune → 4카드 그리드 + Share(공유 카드 모달).
 */
export function FortuneSection({
  userSaju,
  luck,
}: {
  userSaju: UserSaju;
  luck: CurrentLuck;
}) {
  const cards = calcFortune(userSaju, luck);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Your Fortune · 운세
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <FortuneCard key={card.key} card={card} />
        ))}
      </div>

      <div className="space-y-1 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShareOpen(true)}
          className="w-full"
        >
          Share ✨
        </Button>
        <p className="text-[10px] text-muted-foreground">For entertainment 🌙</p>
      </div>

      <FortuneShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        userSaju={userSaju}
        luck={luck}
        onShared={(method) => track("card_shared", { kind: "fortune", method })}
      />
    </section>
  );
}
```

- [ ] **Step 4: Run the section tests**

Run: `npx vitest run src/components/fortune/fortune-section.test.tsx`
Expected: PASS (2 cases — 4-card render + Share enabled).

- [ ] **Step 5: Run the full suite + type-check + lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all tests green (≈159), tsc clean, lint only the 2 pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang).

- [ ] **Step 6: Commit**

```bash
git add src/components/fortune/fortune-section.tsx src/components/fortune/fortune-section.test.tsx
git commit -m "feat(fortune): activate Share — open card modal + card_shared analytics"
```

---

## Task 4: Verification + docs

**Files:** Modify `task-log.md`, `CLAUDE.md`

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: succeeds; `/` and `/inyeon` static ○. (Transient Google-font fetch error → re-run once.)

- [ ] **Step 2: Manual visual check (dev)**

Run: `npm run dev`. In the browser: enter a birthday on `/` → the saju view shows the **Your Fortune** section → click **Share ✨** → modal shows the 9:16 card (day-master hero, 4 fortune lines with tier badges, `ksaju.me`, `For entertainment 🌙`). Share → `ksaju-fortune.png` downloads (~1080×1920) with Korean/Hanja glyphs intact. Toggle dark mode + a mobile viewport → card readable and fits. Report results. (Note: 4 lines + hero is dense at 640px — flag if any clipping; spacing can be tuned.)

- [ ] **Step 3: Update roadmap docs + commit**

Add a cycle-17 completion entry to `task-log.md` (work, decisions, commits) and update the CLAUDE.md roadmap (mark the fortune share card shipped; note the inline fortune Share is no longer a disabled teaser). Then:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 17 (fortune share card) complete"
```

- [ ] **Step 4: Finish the branch**

Announce and use **superpowers:finishing-a-development-branch** to verify tests and present merge/PR options.

---

## Self-Review Notes (author)

- **Spec coverage:** `FortuneShareCard` 9:16 + day-master hero + 4 lines + tier badges + ksaju.me/entertainment → T1 ✓; `calcFortune` internal call (no prop threading) → T1 ✓; `FortuneShareModal` preview-body + Share via `useShareImage` (fileName `ksaju-fortune.png`) → T2 ✓; `FortuneSection` activate Share + modal state + `card_shared {kind:"fortune"}` analytics → T3 ✓; tests (card render, modal smoke, section enabled) → T1/T2/T3 ✓; verification (suite/tsc/lint/build) → T3/T4 ✓; subLine omitted on card → T1 (only `card.line` rendered) ✓. Non-goals (engine change, compat change, new copy/data, i18n, runtime LLM) — no task touches them ✓.
- **Placeholder scan:** none — all code blocks complete (card JSX, modal JSX, full section replacement, both test files).
- **Type consistency:** `FortuneShareCard` props `{ userSaju: UserSaju; luck: CurrentLuck }` match the modal's `<FortuneShareCard userSaju luck />` and `FortuneSection`'s pass-through. `FortuneShareModal` props `{ open, onClose, userSaju, luck, onShared? }` match the section's usage. `useShareImage(ref, { fileName, shareMeta, onShared })` matches the hook signature (`src/hooks/use-share-image.ts`). `dayMasterInfo(dm)` → `{ char, element, keyword }` and `WUXING_META[element].label` match `saju-display.ts`. `ACCENT` keys are `WuXing` (`wood|fire|earth|metal|water`), same literals as `fortune-card.tsx`. `track("card_shared", { kind, method })` matches `analytics.ts` (`track(event, props?)`, arbitrary props — no type change). Test fixtures `RM`/`LUCK` reuse the exact shapes already in `fortune-section.test.tsx`.
