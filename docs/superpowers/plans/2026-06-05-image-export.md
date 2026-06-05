# Image Export Common Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable client-side image-export engine and wire it to the compatibility result modal so users can download/share a 9:16 PNG card of their saju compatibility.

**Architecture:** A dedicated 9:16 `CompatShareCard` (360×640 base) is rendered as the modal body (scaled-to-fit preview = export). A framework-agnostic engine (`share-image.ts`) captures the card node with `html-to-image` at `pixelRatio: 3` (→1080×1920) and delivers it via the Web Share API (files) with an `<a download>` fallback. A thin React hook (`use-share-image.ts`) owns the async button state. Fortune sharing is NOT wired this cycle (engine is reused next cycle).

**Tech Stack:** Next.js 16 (static export, client component), React 19, TypeScript, `html-to-image`, vitest + happy-dom + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-05-image-export-design.md`

---

## File Structure

- `src/lib/share-image.ts` (create) — pure engine: `nodeToPngBlob`, `canShareFiles`, `shareOrDownloadPng`, `ShareMeta` type.
- `src/lib/share-image.test.ts` (create) — engine tests (happy-dom, mocks `html-to-image` + `navigator`).
- `src/hooks/use-share-image.ts` (create) — `useShareImage(ref, opts)` → `{ share, status }`.
- `src/components/compat/compat-share-card.tsx` (create) — 9:16 presentational card + relocated `CompatOther` type.
- `src/components/compat/compat-share-card.test.tsx` (create) — render assertions.
- `src/components/compat/compatibility-modal.tsx` (modify) — body becomes scaled `CompatShareCard` + Share button; import `CompatOther` from the card.
- `package.json` (modify) — add `html-to-image`.

---

## Task 1: Add the html-to-image dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the library**

Run:
```bash
npm install html-to-image
```
Expected: `package.json` `dependencies` gains `"html-to-image": "^1.x"`, lockfile updates, no peer-dep errors.

- [ ] **Step 2: Verify install + existing tests still pass**

Run:
```bash
npm test
```
Expected: PASS (same count as before — no new tests yet; baseline ~ all current tests green).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add html-to-image for share-card PNG export"
```

---

## Task 2: Engine — `share-image.ts` (capture + share/download)

**Files:**
- Create: `src/lib/share-image.ts`
- Test: `src/lib/share-image.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/share-image.test.ts`:
```ts
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("html-to-image", () => ({ toBlob: vi.fn() }));
import { toBlob } from "html-to-image";
import { nodeToPngBlob, canShareFiles, shareOrDownloadPng } from "./share-image";

const PNG = new Blob(["x"], { type: "image/png" });

beforeEach(() => {
  vi.restoreAllMocks();
  // happy-dom lacks these — provide controllable stubs.
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  globalThis.URL.createObjectURL = vi.fn(() => "blob:fake");
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  // @ts-expect-error cleanup test-only globals
  delete (navigator as unknown as { share?: unknown }).share;
  // @ts-expect-error cleanup test-only globals
  delete (navigator as unknown as { canShare?: unknown }).canShare;
});

describe("nodeToPngBlob", () => {
  it("awaits fonts.ready and returns the toBlob result", async () => {
    (toBlob as ReturnType<typeof vi.fn>).mockResolvedValue(PNG);
    const node = document.createElement("div");
    const blob = await nodeToPngBlob(node, { pixelRatio: 3 });
    expect(blob).toBe(PNG);
    expect(toBlob).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ pixelRatio: 3 }),
    );
  });

  it("throws when toBlob yields null", async () => {
    (toBlob as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const node = document.createElement("div");
    await expect(nodeToPngBlob(node)).rejects.toThrow(/render/i);
  });
});

describe("canShareFiles", () => {
  it("false when navigator.canShare is absent", () => {
    expect(canShareFiles(new File([PNG], "a.png"))).toBe(false);
  });
  it("delegates to navigator.canShare when present", () => {
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    expect(canShareFiles(new File([PNG], "a.png"))).toBe(true);
  });
});

describe("shareOrDownloadPng", () => {
  it("calls navigator.share with the file when supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    (navigator as unknown as { share: unknown }).share = share;
    await shareOrDownloadPng(PNG, "ksaju.png", { title: "T" });
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0];
    expect(arg.files[0]).toBeInstanceOf(File);
    expect(arg.title).toBe("T");
  });

  it("treats AbortError (user cancel) as success — no download fallback", async () => {
    const err = new Error("cancel");
    err.name = "AbortError";
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    (navigator as unknown as { share: unknown }).share = vi.fn().mockRejectedValue(err);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await shareOrDownloadPng(PNG, "ksaju.png");
    expect(click).not.toHaveBeenCalled();
  });

  it("falls back to anchor download when share is unsupported", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await shareOrDownloadPng(PNG, "ksaju.png");
    expect(click).toHaveBeenCalledTimes(1);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(PNG);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/lib/share-image.test.ts
```
Expected: FAIL — `share-image.ts` does not exist / exports undefined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/share-image.ts`:
```ts
import { toBlob } from "html-to-image";

/** Metadata passed to the native share sheet. */
export type ShareMeta = { title?: string; text?: string };

/**
 * Capture a DOM node to a PNG Blob. Waits for web fonts (Korean serif / hanja)
 * to load first so glyphs don't render blank. Defaults to pixelRatio 3 so a
 * 360×640 card exports at 1080×1920 (IG Story / TikTok 9:16).
 */
export async function nodeToPngBlob(
  node: HTMLElement,
  opts: { pixelRatio?: number } = {},
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const blob = await toBlob(node, {
    pixelRatio: opts.pixelRatio ?? 3,
    cacheBust: true,
  });
  if (!blob) throw new Error("Failed to render image");
  return blob;
}

/** True when the browser can share this file via the Web Share API. */
export function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

/**
 * Share the PNG via the native share sheet when possible, otherwise download it.
 * A user-cancelled share sheet (AbortError) is treated as a normal completion.
 */
export async function shareOrDownloadPng(
  blob: Blob,
  fileName: string,
  shareMeta: ShareMeta = {},
): Promise<void> {
  const file = new File([blob], fileName, { type: "image/png" });

  if (canShareFiles(file) && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], ...shareMeta });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Any other share failure → fall through to download.
    }
  }
  downloadBlob(blob, fileName);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run src/lib/share-image.test.ts
```
Expected: PASS (all 7 cases green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/share-image.ts src/lib/share-image.test.ts
git commit -m "feat(share): share-image engine — capture + web-share/download"
```

---

## Task 3: React hook — `use-share-image.ts`

**Files:**
- Create: `src/hooks/use-share-image.ts`

> No standalone unit test: the hook is exercised through the modal smoke test in Task 5 (consistent with how this repo tests thin client wrappers).

- [ ] **Step 1: Write the implementation**

Create `src/hooks/use-share-image.ts`:
```ts
"use client";

import { useCallback, useState, type RefObject } from "react";
import {
  nodeToPngBlob,
  shareOrDownloadPng,
  type ShareMeta,
} from "@/lib/share-image";

export type ShareStatus = "idle" | "rendering" | "error";

/**
 * Capture the referenced node to PNG and share/download it, exposing a status
 * for button UX. Success and user-cancel both return to "idle"; only a real
 * failure sets "error". Reusable by any share card (compat now, fortune later).
 */
export function useShareImage(
  ref: RefObject<HTMLElement | null>,
  opts: { fileName: string; shareMeta?: ShareMeta; pixelRatio?: number },
) {
  const { fileName, shareMeta, pixelRatio } = opts;
  const [status, setStatus] = useState<ShareStatus>("idle");

  const share = useCallback(async () => {
    const node = ref.current;
    if (!node) return;
    setStatus("rendering");
    try {
      const blob = await nodeToPngBlob(node, { pixelRatio });
      await shareOrDownloadPng(blob, fileName, shareMeta);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [ref, fileName, shareMeta, pixelRatio]);

  return { share, status };
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-share-image.ts
git commit -m "feat(share): useShareImage hook — async share status wrapper"
```

---

## Task 4: Presentational card — `compat-share-card.tsx`

**Files:**
- Create: `src/components/compat/compat-share-card.tsx`
- Test: `src/components/compat/compat-share-card.test.tsx`

> This task also relocates the `CompatOther` type here (it currently lives in `compatibility-modal.tsx` and is used only there). The modal will import it from this file in Task 5.

- [ ] **Step 1: Write the failing test**

Create `src/components/compat/compat-share-card.test.tsx`:
```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompatShareCard } from "./compat-share-card";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

const ME: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const OTHER: SajuPillars = { year: "甲子", month: "丙寅", day: "戊辰" };
const RESULT: CompatibilityResult = {
  score: 87,
  label: "Steamy chemistry 🔥",
  breakdown: {
    dayMaster: { score: 30, type: "combine", note: "Magnetic pull (합)" },
    elementBalance: { score: 27 },
    branch: { score: 30, type: "combine", note: "In sync (삼합)" },
  },
};

describe("CompatShareCard", () => {
  it("renders score, label, both names and the watermark", () => {
    render(
      <CompatShareCard
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER }}
        result={RESULT}
      />,
    );
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
    expect(screen.getByText("Steamy chemistry 🔥")).toBeInTheDocument();
    expect(screen.getByText(/RM/)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run src/components/compat/compat-share-card.test.tsx
```
Expected: FAIL — `compat-share-card` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/components/compat/compat-share-card.tsx`:
```tsx
import { forwardRef } from "react";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

/** Compatibility counterpart (idol or general partner) shown on the card. */
export type CompatOther = { name: string; sub?: string; pillars: SajuPillars };

type CompatShareCardProps = {
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
};

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="hanja text-xl font-bold">
        {pillars.year} {pillars.month} {pillars.day}
      </p>
    </div>
  );
}

/**
 * Dedicated 9:16 share card (360×640 base). Captured by the export engine at
 * pixelRatio 3 → 1080×1920 PNG. Self-contained styling so it renders identically
 * off the modal's scaled preview and in the exported image.
 */
export const CompatShareCard = forwardRef<HTMLDivElement, CompatShareCardProps>(
  function CompatShareCard({ mePillars, other, result }, ref) {
    const headerLabel = other.sub ? `${other.name} · ${other.sub}` : other.name;
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

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 px-7 pt-10">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            You × {headerLabel}
          </p>

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

Run:
```bash
npx vitest run src/components/compat/compat-share-card.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/compat/compat-share-card.tsx src/components/compat/compat-share-card.test.tsx
git commit -m "feat(compat): CompatShareCard — dedicated 9:16 export layout"
```

---

## Task 5: Wire the card + Share button into the modal

**Files:**
- Modify: `src/components/compat/compatibility-modal.tsx`
- Test: `src/components/compat/compatibility-modal.test.tsx`

> The modal body becomes the scaled `CompatShareCard` (preview = export). `CompatOther` now comes from the card. Existing modal tests assert score / names / closeLabel — they must keep passing, so the card must surface the same text (it does: `/100`, `You`, `RM · BTS`). We add one smoke test for the Share button.

- [ ] **Step 1: Update the existing test + add a Share smoke test**

In `src/components/compat/compatibility-modal.test.tsx`, the existing two cases stay as-is (the card still renders `/100`, `You`, and `RM · BTS`). Append a new case at the end of the `describe` block:
```tsx
  it("renders a Share button that triggers capture (lib mocked)", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    render(
      <CompatibilityModal
        open
        onClose={() => {}}
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER_PILLARS }}
        result={RESULT}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const shareBtn = within(dialog).getByRole("button", { name: /share/i });
    expect(shareBtn).toBeEnabled();
    await userEvent.default.setup().click(shareBtn);
    // nodeToPngBlob is mocked to reject (no canvas in happy-dom); button must
    // not crash the modal and the close button stays available.
    expect(within(dialog).getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
```
Add this mock near the top of the file, after the imports (before `describe`):
```tsx
vi.mock("@/lib/share-image", () => ({
  nodeToPngBlob: vi.fn().mockRejectedValue(new Error("no canvas in test")),
  shareOrDownloadPng: vi.fn(),
  canShareFiles: vi.fn(() => false),
}));
```

- [ ] **Step 2: Run test to verify the new case fails**

Run:
```bash
npx vitest run src/components/compat/compatibility-modal.test.tsx
```
Expected: FAIL — no element with role `button` named `/share/i` yet (current modal has only Close).

- [ ] **Step 3: Rewrite the modal to render the card + Share button**

Replace the entire contents of `src/components/compat/compatibility-modal.tsx` with:
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
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";
import { CompatShareCard, type CompatOther } from "./compat-share-card";
import { useShareImage } from "@/hooks/use-share-image";

export type { CompatOther };

type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
};

/**
 * Compatibility result modal. The body IS the 9:16 CompatShareCard, scaled to
 * fit the dialog so the preview equals the exported PNG. Share captures the
 * full-resolution card via useShareImage. Generic: idol + general partner.
 */
export function CompatibilityModal({
  open,
  onClose,
  mePillars,
  other,
  result,
  closeLabel = "← Close",
}: CompatibilityModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-compat.png",
    shareMeta: {
      title: "My KSaju compatibility",
      text: `You × ${other.name}: ${result.score}/100 — ksaju.me`,
    },
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">
          Your saju compatibility with {other.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju compatibility score between you and {other.name}.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <CompatShareCard
          ref={cardRef}
          mePillars={mePillars}
          other={other}
          result={result}
        />

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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            {closeLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the modal tests**

Run:
```bash
npx vitest run src/components/compat/compatibility-modal.test.tsx
```
Expected: PASS (original two cases + new Share smoke test). If `@testing-library/user-event` import shape differs, adjust to the project's existing usage — check another `*.test.tsx` that clicks (e.g. `idol-picker.test.tsx`) and mirror its import.

- [ ] **Step 5: Run the full suite + type-check**

Run:
```bash
npm test && npx tsc --noEmit
```
Expected: PASS — all tests green, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/compat/compatibility-modal.tsx src/components/compat/compatibility-modal.test.tsx
git commit -m "feat(compat): modal body = 9:16 share card + Share button"
```

---

## Task 6: Final verification (lint + build + manual visual)

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run:
```bash
npm run lint
```
Expected: no NEW errors (pre-existing warnings in `form.tsx` ref / `saju-data.ts` YinYang are acceptable per task-log; the new files add none).

- [ ] **Step 2: Production build (static export must still succeed)**

Run:
```bash
npm run build
```
Expected: build succeeds; `/` and `/inyeon` still render. `html-to-image` is client-only so it must not break static generation. If the build complains about `html-to-image` during SSR/prerender, confirm `compatibility-modal.tsx` is `"use client"` (it is) and that nothing imports `share-image.ts` from a server component.

- [ ] **Step 3: Manual visual check (dev server)**

Run:
```bash
npm run dev
```
Then in the browser verify (report results — do not auto-mark complete without observing):
1. Open `/inyeon`, enter/restore your saju, pick an idol → modal opens showing the 9:16 card with score, label, both mini-saju (hanja not blank), `ksaju.me`, `For entertainment 🌙`.
2. Click **Share ✨** on desktop → a `ksaju-compat.png` downloads; open it and confirm hanja/Korean glyphs render (fonts embedded) and it's ~1080×1920.
3. Dark mode toggle → card still legible (cosmic tones).
4. Mobile viewport (DevTools iPhone) → card fits, Share works (download fallback in DevTools).
5. Trigger an error path if easy (offline/blocked) → inline "Couldn't create image — try again" appears, modal still closable.

- [ ] **Step 4: Update CLAUDE.md + task-log (mark step 13 done)**

Mark roadmap step 13 complete in `CLAUDE.md` (the ⏳ on the "이미지 export 공통 기반" line → ✅ with a one-line result) and add a cycle-13 completion entry to `task-log.md`. Then commit:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 13 (image export) complete"
```

---

## Self-Review Notes (author)

- **Spec coverage:** engine (`share-image.ts`, T2) ✓; hook (`use-share-image.ts`, T3) ✓; card (T4) ✓; modal integration / preview=export (T5) ✓; Web Share + download fallback + AbortError handling (T2 tests) ✓; font embedding via `document.fonts.ready` (T2) ✓; 360×640 @3x → 1080×1920 (T2/T4) ✓; dependency (T1) ✓; tests in vitest+happy-dom (T2/T4/T5) ✓; scope guard — fortune untouched ✓ (no task modifies `fortune-section.tsx`).
- **Type consistency:** `nodeToPngBlob` / `canShareFiles` / `shareOrDownloadPng` / `ShareMeta` used identically across engine, hook, and tests. `CompatOther` defined once in `compat-share-card.tsx` and re-exported from the modal (`export type { CompatOther }`) so existing `import { ... CompatOther } from "compatibility-modal"` consumers — none exist today, verified — would still work. `ShareStatus` ("idle"|"rendering"|"error") matches the spec.
- **Placeholders:** none — every code step is complete.
