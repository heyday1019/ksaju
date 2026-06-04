# '인연' 페이지 (사이클 12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/inyeon`을 실제 '인연' 페이지로 채운다: K-pop 최애 궁합을 홈에서 `/inyeon`으로 이전 + 일반 상대 궁합(이름+생일) 추가, 사용자 본인 사주는 localStorage로 공유.

**Architecture:** `CompatibilityModal`을 아이돌 전용에서 범용(`other: {name,sub?,pillars}`)으로 일반화해 아이돌·상대 양쪽이 재사용. 신규 `saju-storage.ts`(localStorage)로 홈↔인연 사주 공유. `/inyeon`은 server page(metadata 유지) + client `InyeonView` 패턴. 홈은 인라인 궁합을 `/inyeon` CTA로 교체.

**Tech Stack:** Next.js 16 App Router, React 19, TS, Tailwind v4, shadcn(Dialog/Input/Card/Button), react-hook-form, vitest(happy-dom/RTL).

**Spec:** `docs/superpowers/specs/2026-06-04-inyeon-compatibility-design.md`

---

## 파일 구조

| 파일 | 책임 | 액션 |
|------|------|------|
| `src/lib/saju-storage.ts` (+test) | userSaju localStorage 영속 | Create |
| `src/components/kst/birth-form.tsx` | submitLabel/submittingLabel props | Modify |
| `src/components/compat/compatibility-modal.tsx` | 범용 `other` props로 일반화 | Modify |
| `src/components/compat/compatibility-modal.test.tsx` | 범용 props 테스트로 재작성 | Modify |
| `src/components/compat/compatibility-section.tsx` | 일반화 모달 props로 호출 갱신 | Modify |
| `src/components/compat/partner-compat-section.tsx` (+test) | 상대 이름+생일 궁합 | Create |
| `src/components/inyeon/inyeon-view.tsx` (+test) | client: me 로드/폴백 + 두 섹션 | Create |
| `src/app/inyeon/page.tsx` | server wrapper(metadata) → InyeonView | Modify |
| `src/app/inyeon/page.test.tsx` | placeholder 테스트 제거(InyeonView가 대체) | Delete |
| `src/app/page.tsx` | 제출 시 saveUserSaju | Modify |
| `src/components/saju/saju-result.tsx` | 인라인 궁합 제거 → /inyeon CTA | Modify |
| `src/components/saju/saju-result.test.tsx` | 궁합 테스트 → CTA 링크 테스트 | Modify |
| `task-log.md` / `CLAUDE.md` | 진척 기록 + step 12 ✅ | Modify |

> **Next.js 16 주의(AGENTS.md):** 구현 전 `node_modules/next/dist/docs`에서 server/client component·metadata·`next/link` 규약 확인. 본 계획은 표준 패턴(server page export metadata + client child, `next/link`) 전제.

---

## Task 1: `saju-storage.ts` (localStorage 영속) — TDD

**Files:** Create `src/lib/saju-storage.ts`, Test `src/lib/saju-storage.test.ts`

- [ ] **Step 1: 실패 테스트 작성** — `src/lib/saju-storage.test.ts`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { saveUserSaju, loadUserSaju } from "./saju-storage";
import type { UserSaju } from "./saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("saju-storage", () => {
  beforeEach(() => localStorage.clear());

  it("save → load 왕복 일치", () => {
    saveUserSaju(RM);
    expect(loadUserSaju()).toEqual(RM);
  });

  it("저장값 없으면 null", () => {
    expect(loadUserSaju()).toBeNull();
  });

  it("손상된 JSON이면 null", () => {
    localStorage.setItem("ksaju:userSaju:v1", "{not valid");
    expect(loadUserSaju()).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/saju-storage.test.ts` → FAIL (모듈 없음).

- [ ] **Step 3: 구현** — `src/lib/saju-storage.ts`:

```ts
// 사용자 사주(UserSaju)를 localStorage에 영속. 홈(/)↔인연(/inyeon) 간 공유.
// client-safe (manseryeok 미import). SSR 안전(window 가드).
import type { UserSaju } from "./saju-types";

const KEY = "ksaju:userSaju:v1";

export function saveUserSaju(saju: UserSaju): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(saju));
  } catch {
    // localStorage 비활성/용량초과 등 — 조용히 무시(공유는 best-effort)
  }
}

export function loadUserSaju(): UserSaju | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSaju;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/lib/saju-storage.test.ts` → PASS (3). `npx tsc --noEmit` → 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju-storage.ts src/lib/saju-storage.test.ts
git commit -m "feat(storage): persist userSaju to localStorage for home↔inyeon sharing

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `BirthForm` submit 라벨 일반화

**Files:** Modify `src/components/kst/birth-form.tsx`

> 기존 호출부(홈)는 기본값으로 무변경. 신규 단위 테스트 없음 — 기존 테스트 + tsc로 회귀 확인.

- [ ] **Step 1: props 타입 확장** — `BirthFormProps`에 추가:

```tsx
type BirthFormProps = {
  onSubmit: (data: BirthData) => void;
  defaultTimezone?: string;
  submitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
};
```

- [ ] **Step 2: 시그니처 + 버튼 텍스트 사용** — 함수 시그니처를:

```tsx
export function BirthForm({
  onSubmit,
  defaultTimezone,
  submitting,
  submitLabel = "Discover your saju",
  submittingLabel = "Reading your saju…",
}: BirthFormProps) {
```
그리고 제출 버튼을:

```tsx
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
```

- [ ] **Step 3: 회귀 확인** — `npx tsc --noEmit` → 0. `npx vitest run` → 기존 전부 PASS(홈 폼 기본 라벨 동일).

- [ ] **Step 4: Commit**

```bash
git add src/components/kst/birth-form.tsx
git commit -m "feat(birth-form): optional submit/submitting label props

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `CompatibilityModal` 범용화 + `CompatibilitySection` 적응

**Files:** Modify `src/components/compat/compatibility-modal.tsx`, `src/components/compat/compatibility-modal.test.tsx`, `src/components/compat/compatibility-section.tsx`

> 모달 props 변경은 섹션 호출부를 깨므로 한 태스크/커밋으로 함께.

- [ ] **Step 1: 모달 테스트 재작성(실패 유도)** — `src/components/compat/compatibility-modal.test.tsx` 전체를 다음으로 교체:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CompatibilityModal } from "./compatibility-modal";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

const ME: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const OTHER_PILLARS: SajuPillars = { year: "甲子", month: "丙寅", day: "戊辰" };

const RESULT: CompatibilityResult = {
  score: 72,
  label: "Steady & flowing 🏔️💧",
  breakdown: {
    dayMaster: { score: 28, type: "same", note: "Kindred spirits (비화)" },
    elementBalance: { score: 22 },
    branch: { score: 22, type: "same", note: "Same wavelength" },
  },
};

describe("CompatibilityModal (범용)", () => {
  it("아이돌 케이스: name·sub·점수를 노출", () => {
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
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText(/RM · BTS/)).toBeInTheDocument();
    expect(within(dialog).getByText("You")).toBeInTheDocument();
  });

  it("상대 케이스: sub 없이 name만 노출 + closeLabel 적용", () => {
    const onClose = vi.fn();
    render(
      <CompatibilityModal
        open
        onClose={onClose}
        mePillars={ME}
        other={{ name: "Alex", pillars: OTHER_PILLARS }}
        result={RESULT}
        closeLabel="← Check someone else"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/You × Alex/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /check someone else/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/components/compat/compatibility-modal.test.tsx` → FAIL (현재 모달은 `idol` props라 타입/렌더 불일치).

- [ ] **Step 3: 모달 일반화** — `src/components/compat/compatibility-modal.tsx` 전체 교체:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

/** 궁합 상대(아이돌 또는 일반 상대)의 표시 정보. */
export type CompatOther = { name: string; sub?: string; pillars: SajuPillars };

type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
};

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="hanja text-lg font-bold">
        {pillars.year} {pillars.month} {pillars.day}
      </p>
    </div>
  );
}

/** 궁합 결과 + SNS 공유용 요약 모달 (이미지 export는 다음 사이클). 범용: 아이돌·일반 상대 공용. */
export function CompatibilityModal({
  open,
  onClose,
  mePillars,
  other,
  result,
  closeLabel = "← Close",
}: CompatibilityModalProps) {
  const headerLabel = other.sub ? `${other.name} · ${other.sub}` : other.name;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-md overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Your saju compatibility with {other.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju compatibility score between you and {headerLabel}.
        </DialogDescription>

        <div
          className="changsal-band absolute left-0 right-0 top-0 z-10 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />

        <div className="space-y-4 px-6 pb-6 pt-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            You × {headerLabel}
          </p>

          {/* 점수 */}
          <div>
            <p className="font-display text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {result.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
            <p className="font-serif text-lg font-bold text-foreground">
              {result.label}
            </p>
          </div>

          {/* 양쪽 사주 미니 */}
          <div className="flex items-center justify-around rounded-xl border border-border bg-card/60 py-3">
            <MiniSaju label="You" pillars={mePillars} />
            <span className="font-calli text-2xl text-accent">×</span>
            <MiniSaju label={other.name} pillars={other.pillars} />
          </div>

          {/* breakdown */}
          <ul className="space-y-1 text-left text-xs text-muted-foreground">
            <li>
              <strong className="text-primary">Day Master:</strong>{" "}
              {result.breakdown.dayMaster.note} ({result.breakdown.dayMaster.score})
            </li>
            <li>
              <strong className="text-primary">Elements:</strong> balance{" "}
              {result.breakdown.elementBalance.score}
            </li>
            <li>
              <strong className="text-primary">Branch:</strong>{" "}
              {result.breakdown.branch.note} ({result.breakdown.branch.score})
            </li>
          </ul>

          {/* 워터마크 + 디스클레이머 */}
          <div className="pt-1">
            <p className="font-display text-sm font-semibold text-primary">
              ksaju.me
            </p>
            <p className="text-[10px] text-muted-foreground">
              For entertainment 🌙
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            {closeLabel}
          </Button>
        </div>

        <div
          className="changsal-band absolute bottom-0 left-0 right-0 z-10 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: `CompatibilitySection` 호출부 갱신** — `src/components/compat/compatibility-section.tsx`에서 import에 `normalizeIdolSaju` 추가하고(이미 `compatForIdol, type Idol`은 import 중) 모달 호출을 교체.

import 변경:
```tsx
import { compatForIdol, type Idol } from "@/lib/idols";
import { normalizeIdolSaju } from "@/lib/compatibility";
```
모달 JSX를:
```tsx
      {idol && result && (
        <CompatibilityModal
          open={open}
          onClose={() => setOpen(false)}
          mePillars={mePillars}
          other={{
            name: idol.name,
            sub: idol.group,
            pillars: normalizeIdolSaju(idol.saju),
          }}
          result={result}
          closeLabel="← Check another idol"
        />
      )}
```
(기존 `type SajuPillars` import는 mePillars용으로 유지.)

- [ ] **Step 5: 통과 확인** — `npx vitest run src/components/compat` → 모달 2 + 섹션 기존 테스트 PASS. `npx tsc --noEmit` → 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/compat/compatibility-modal.tsx src/components/compat/compatibility-modal.test.tsx src/components/compat/compatibility-section.tsx
git commit -m "refactor(compat): generalize CompatibilityModal to generic other (idol|partner)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `PartnerCompatSection` (일반 상대 궁합) — TDD

**Files:** Create `src/components/compat/partner-compat-section.tsx`, Test `src/components/compat/partner-compat-section.test.tsx`

- [ ] **Step 1: 실패 테스트 작성** — `src/components/compat/partner-compat-section.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserSaju } from "@/lib/saju-types";

// 상대 사주 계산(server action) 모킹 — 고정 UserSaju 반환
vi.mock("@/app/actions/saju", () => ({
  calcUserSaju: vi.fn(async () => ({
    pillars: { year: "甲子", month: "丙寅", day: "戊辰", hour: null },
    dayMaster: "戊",
    isTimeCorrected: false,
  })),
}));

import { PartnerCompatSection } from "./partner-compat-section";

const ME: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("PartnerCompatSection", () => {
  it("이름+생일 제출 시 궁합 결과 모달이 열린다", async () => {
    render(<PartnerCompatSection userSaju={ME} />);
    await userEvent.type(screen.getByLabelText(/their name/i), "Alex");
    // BirthForm의 date input 채우기 (name='year' 앵커, type=date)
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(dateInput, "1998-05-20");
    await userEvent.click(screen.getByRole("button", { name: /reveal compatibility/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText(/You × Alex/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/components/compat/partner-compat-section.test.tsx` → FAIL (모듈 없음).

- [ ] **Step 3: 구현** — `src/components/compat/partner-compat-section.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BirthForm } from "@/components/kst/birth-form";
import { CompatibilityModal } from "./compatibility-modal";
import { calcUserSaju } from "@/app/actions/saju";
import { calcCompatibility } from "@/lib/compatibility";
import type { SajuPillars, CompatibilityResult } from "@/lib/compatibility";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

/** 일반 상대 궁합: 상대 이름(optional)+생일 → calcUserSaju → calcCompatibility → 범용 모달. */
export function PartnerCompatSection({ userSaju }: { userSaju: UserSaju }) {
  const mePillars: SajuPillars = useMemo(
    () => ({
      year: userSaju.pillars.year,
      month: userSaju.pillars.month,
      day: userSaju.pillars.day,
    }),
    [userSaju],
  );

  const [partnerName, setPartnerName] = useState("");
  const [partnerPillars, setPartnerPillars] = useState<SajuPillars | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePartner = async (birth: BirthData) => {
    setError(null);
    setSubmitting(true);
    try {
      const partner = await calcUserSaju(birth);
      const pillars: SajuPillars = {
        year: partner.pillars.year,
        month: partner.pillars.month,
        day: partner.pillars.day,
      };
      setPartnerPillars(pillars);
      setResult(calcCompatibility(mePillars, pillars));
      setOpen(true);
    } catch (err) {
      console.error("Partner saju failed:", err);
      setError("Couldn't read that birth date. Please double-check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="text-center">
        <p className="font-display font-semibold">Or check someone else 💞</p>
        <p className="text-xs text-muted-foreground">
          Enter their birthday to reveal your saju match.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-1 text-left">
        <label htmlFor="partner-name" className="text-sm font-medium">
          Their name{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="partner-name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="e.g. Alex"
        />
      </div>

      <BirthForm
        onSubmit={handlePartner}
        submitting={submitting}
        submitLabel="Reveal compatibility ✨"
        submittingLabel="Reading…"
      />

      {result && partnerPillars && (
        <CompatibilityModal
          open={open}
          onClose={() => setOpen(false)}
          mePillars={mePillars}
          other={{ name: partnerName.trim() || "Them", pillars: partnerPillars }}
          result={result}
          closeLabel="← Check someone else"
        />
      )}
    </section>
  );
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/components/compat/partner-compat-section.test.tsx` → PASS (1). `npx tsc --noEmit` → 0.

> 참고: 테스트의 date input 채우기는 `input[type="date"]`에 직접 type. happy-dom에서 native date 입력은 `userEvent.type`으로 값 설정됨(birth-form의 `handleDateChange`가 분해). 만약 happy-dom date 처리 이슈로 실패하면 `fireEvent.change(dateInput, { target: { value: "1998-05-20" } })`로 대체(테스트 약화 아님, 동일 동작).

- [ ] **Step 5: Commit**

```bash
git add src/components/compat/partner-compat-section.tsx src/components/compat/partner-compat-section.test.tsx
git commit -m "feat(compat): PartnerCompatSection — general partner compatibility

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `InyeonView` (me 로드/폴백 + 두 섹션) — TDD

**Files:** Create `src/components/inyeon/inyeon-view.tsx`, Test `src/components/inyeon/inyeon-view.test.tsx`

- [ ] **Step 1: 실패 테스트 작성** — `src/components/inyeon/inyeon-view.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserSaju } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

const loadMock = vi.fn();
vi.mock("@/lib/saju-storage", () => ({
  loadUserSaju: () => loadMock(),
  saveUserSaju: vi.fn(),
}));
vi.mock("@/app/actions/saju", () => ({ calcUserSaju: vi.fn() }));

import { InyeonView } from "./inyeon-view";

describe("InyeonView", () => {
  it("저장된 사주가 있으면 아이돌·상대 두 섹션을 렌더한다", async () => {
    loadMock.mockReturnValue(RM);
    render(<InyeonView />);
    // 아이돌 섹션의 검색창
    expect(await screen.findByRole("searchbox")).toBeInTheDocument();
    // 상대 섹션의 이름 입력
    expect(screen.getByLabelText(/their name/i)).toBeInTheDocument();
  });

  it("저장된 사주가 없으면 본인 생일 폴백 폼을 렌더한다", async () => {
    loadMock.mockReturnValue(null);
    render(<InyeonView />);
    expect(
      await screen.findByRole("button", { name: /see my saju/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/components/inyeon/inyeon-view.test.tsx` → FAIL (모듈 없음).

- [ ] **Step 3: 구현** — `src/components/inyeon/inyeon-view.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BirthForm } from "@/components/kst/birth-form";
import { CompatibilitySection } from "@/components/compat/compatibility-section";
import { PartnerCompatSection } from "@/components/compat/partner-compat-section";
import { loadUserSaju, saveUserSaju } from "@/lib/saju-storage";
import { calcUserSaju } from "@/app/actions/saju";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

/** '인연' 페이지 본문(client). localStorage의 내 사주 로드 → 없으면 생일 폴백, 있으면 두 궁합 섹션. */
export function InyeonView() {
  const [me, setMe] = useState<UserSaju | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // localStorage는 클라이언트 전용 → mount 후 읽어 hydration mismatch 회피 (next-themes 표준 패턴).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMe(loadUserSaju());
    setHydrated(true);
  }, []);

  const handleSelfBirth = async (birth: BirthData) => {
    setError(null);
    setSubmitting(true);
    try {
      const saju = await calcUserSaju(birth);
      saveUserSaju(saju);
      setMe(saju);
    } catch (err) {
      console.error("Self saju failed:", err);
      setError("Couldn't read that birth date. Please double-check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            Inyeon
          </h1>
          <p className="hanja text-2xl font-bold tracking-[0.3em]">인 연</p>
        </header>

        {!hydrated ? null : !me ? (
          <Card className="relative overflow-hidden border-border py-2">
            <div
              className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
            <CardContent className="space-y-4 pt-8">
              <p className="text-center text-sm text-muted-foreground">
                First, tell us your birthday to check your 인연.
              </p>
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              <BirthForm
                onSubmit={handleSelfBirth}
                submitting={submitting}
                submitLabel="See my saju"
                submittingLabel="Reading…"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-border">
              <CardContent className="space-y-1 pt-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Your saju
                </p>
                <p className="hanja text-2xl font-bold">
                  {me.pillars.year} {me.pillars.month} {me.pillars.day}
                </p>
                <Link href="/" className="text-xs text-primary underline">
                  Edit on home
                </Link>
              </CardContent>
            </Card>

            <CompatibilitySection userSaju={me} />

            <div className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Or someone else
            </div>

            <PartnerCompatSection userSaju={me} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/components/inyeon/inyeon-view.test.tsx` → PASS (2). `npx tsc --noEmit` → 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/inyeon/inyeon-view.tsx src/components/inyeon/inyeon-view.test.tsx
git commit -m "feat(inyeon): InyeonView — load saju from storage + idol/partner sections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `/inyeon/page.tsx` server wrapper (placeholder → InyeonView)

**Files:** Modify `src/app/inyeon/page.tsx`, Delete `src/app/inyeon/page.test.tsx`

> placeholder 'coming soon' 테스트는 콘텐츠가 바뀌므로 제거(InyeonView 테스트가 동작을 커버). page는 metadata 유지 server wrapper.

- [ ] **Step 1: placeholder 테스트 삭제**

```bash
git rm src/app/inyeon/page.test.tsx
```

- [ ] **Step 2: page.tsx 교체** — `src/app/inyeon/page.tsx` 전체:

```tsx
import type { Metadata } from "next";
import { InyeonView } from "@/components/inyeon/inyeon-view";

export const metadata: Metadata = {
  title: "Inyeon · KSaju",
  description:
    "Check your saju compatibility with your K-pop bias or someone special.",
};

export default function InyeonPage() {
  return <InyeonView />;
}
```

- [ ] **Step 3: 회귀 확인** — `npx tsc --noEmit` → 0. `npx vitest run` → 전체 PASS(placeholder 테스트 삭제됨, InyeonView 테스트 포함). `npx next build` → `/inyeon` 라우트 생성(server page + client child; static prerender 가능).

- [ ] **Step 4: Commit**

```bash
git add src/app/inyeon/page.tsx
git commit -m "feat(inyeon): wire /inyeon page to InyeonView (keep metadata)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 홈 연결 — userSaju 저장 + SajuResult CTA

**Files:** Modify `src/app/page.tsx`, `src/components/saju/saju-result.tsx`, `src/components/saju/saju-result.test.tsx`

- [ ] **Step 1: `page.tsx` — 제출 시 saveUserSaju** — import 추가:

```tsx
import { saveUserSaju } from "@/lib/saju-storage";
```
`handleSubmit`의 `setUserSaju(saju);` 바로 다음 줄에 추가:

```tsx
      setUserSaju(saju);
      saveUserSaju(saju);
```
(나머지 `setKst`/`setCurrentLuck`/`setView` 순서는 유지.)

- [ ] **Step 2: `SajuResult` — 인라인 궁합 제거 → CTA 링크** — import 변경:
  - `import { CompatibilitySection } from "@/components/compat/compatibility-section";` **삭제**.
  - 상단에 `import Link from "next/link";` 추가.

  `{/* 궁합 부가 섹션 */}` 주석과 `<CompatibilitySection userSaju={userSaju} />`를 다음으로 교체:

```tsx
      {/* 인연(궁합) 페이지로 가는 CTA */}
      <Link
        href="/inyeon"
        className="block rounded-xl border border-dashed border-accent/50 bg-accent/5 px-4 py-3 text-center font-display font-semibold text-primary transition-colors hover:bg-accent/10"
      >
        Check your 인연 (compatibility) ✨ →
      </Link>
```

- [ ] **Step 3: `saju-result.test.tsx` — 궁합 테스트를 CTA 테스트로 교체** — 기존 테스트:

```tsx
  it("궁합 섹션(아이돌 검색)을 렌더한다", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    expect(screen.getByText(/check compatibility with your bias/i)).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
```
를 다음으로 교체:

```tsx
  it("인연 페이지로 가는 CTA 링크를 렌더한다", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    const cta = screen.getByRole("link", { name: /compatibility|인연/i });
    expect(cta).toHaveAttribute("href", "/inyeon");
  });
```

- [ ] **Step 4: 회귀 확인** — `npx tsc --noEmit` → 0. `npx vitest run` → 전체 PASS(saju-result 갱신 포함). `npx next build` → 성공.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/saju/saju-result.tsx src/components/saju/saju-result.test.tsx
git commit -m "feat(home): persist userSaju + replace inline compat with /inyeon CTA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 수동 시각 검증 + 문서

**Files:** Modify `task-log.md`, `CLAUDE.md`

- [ ] **Step 1: 수동 시각 검증 (사용자 협조)** — `npm run dev`, 시크릿 창:
  1. 홈에서 생일 제출 → 사주 결과 하단에 "Check your 인연 ✨ →" CTA(인라인 아이돌 궁합은 사라짐)
  2. CTA 클릭 → `/inyeon`: 상단 "Your saju" 요약(자동, localStorage) + 아이돌 검색 궁합 + "Or someone else" 상대(이름+생일) 궁합
  3. 아이돌 선택 → 모달(You × 이름·그룹, 점수). 상대 이름+생일 제출 → 모달(You × 이름, 점수)
  4. 새로고침 후 `/inyeon` 직접 접근 → 내 사주 유지
  5. localStorage 비운 새 시크릿 창에서 `/inyeon` 직접 → 본인 생일 폴백 폼 → 입력 후 두 섹션 노출
  6. 다크/모바일

- [ ] **Step 2: 검증 회귀** — `npx vitest run; npx tsc --noEmit; npx eslint .` → 전체 PASS, eslint 기존 경고(form.tsx ref / saju-data.ts YinYang)만.

- [ ] **Step 3: 문서 갱신**

`CLAUDE.md` 로드맵 step 12를 ✅로:
```
12. ✅ **'인연' 페이지** — (a) K-pop 궁합(CompatibilitySection)을 홈→`/inyeon` 이전, (b) 일반 상대 궁합(`PartnerCompatSection`: 이름+생일→`calcUserSaju`→`calcCompatibility`). `CompatibilityModal` 범용화(`other` props). 본인 사주는 `saju-storage.ts`(localStorage)로 홈↔인연 공유, 미존재 시 폴백 폼. `/inyeon` server page(metadata)+client `InyeonView`. 홈 SajuResult는 `/inyeon` CTA로 교체. spec/plan: `docs/superpowers/{specs,plans}/2026-06-04-inyeon-compatibility*`
```

`task-log.md` 상단에 사이클 12 완료 항목 추가(구현 결과·커밋 목록·결정 요약·다음 작업=사이클 13 이미지 export).

- [ ] **Step 4: Commit**

```bash
git add task-log.md CLAUDE.md
git commit -m "docs: mark inyeon page (cycle 12) complete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (작성자 체크 결과)

**Spec 커버리지:**
- saju-storage localStorage → Task 1 ✅
- 모달 일반화(other) → Task 3 ✅
- CompatibilitySection 적응 + /inyeon에서 사용 → Task 3(적응) + Task 5(사용) ✅
- PartnerCompatSection(이름+생일) → Task 4 ✅
- InyeonView(로드/폴백/두 섹션) → Task 5 ✅
- /inyeon server page + metadata 유지 → Task 6 ✅
- 홈 saveUserSaju + CTA 교체 → Task 7 ✅
- BirthForm 라벨 일반화 → Task 2 ✅
- 테스트(storage/modal/partner/inyeon/saju-result) → 각 태스크 ✅
- 비범위(이미지 export/상대 사주 영속) → Task 없음(의도) ✅

**Placeholder 스캔:** 모든 코드 블록 실제 구현. TBD 없음. (Task 4 date-input 대체안은 테스트 견고성 노트로, 동작 동일.)

**타입/이름 일관성:** `CompatOther`/`other` props(Task 3 정의 = Task 3 섹션·Task 4 PartnerSection 사용) 일치. `saveUserSaju`/`loadUserSaju`(Task 1 정의 = Task 5/7 사용) 일치. `submitLabel`/`submittingLabel`(Task 2 정의 = Task 4/5 사용) 일치. `InyeonView`(Task 5 정의 = Task 6 import) 일치. mePillars 추출 방식 CompatibilitySection·PartnerCompatSection 동일.

**위험 포인트:** Task 4의 happy-dom date input 입력(대체안 명시). Task 5 set-state-in-effect lint(프로젝트 관례대로 inline disable). next/link가 RTL에서 렌더됨(사이클 11 SiteHeader 테스트로 확인). Task 7로 홈 인라인 궁합 제거 후 compatibility-section.test는 standalone이라 계속 유효.
