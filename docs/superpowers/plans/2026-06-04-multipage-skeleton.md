# 멀티페이지 골격 + 내비 (사이클 11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 라우트(`/`)를 `/`(내 사주)와 `/inyeon`(인연, 플레이스홀더) 두 라우트로 분리하고, 공유 chrome + 상단 슬림 헤더 네비를 루트 레이아웃으로 추출한다.

**Architecture:** 한지 배경·창살·ㅎ 등 chrome를 `page.tsx`에서 루트 `layout.tsx`로 이동해 모든 라우트가 공유. 신규 `<SiteHeader>`(client, `usePathname` 활성표시)가 로고+네비(My Saju/Inyeon)+테마토글을 담는다. `/`는 콘텐츠(히어로+Card)만, `/inyeon`은 'Coming soon' 플레이스홀더. 궁합 이전·상대 궁합은 비범위(사이클 12).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, next-themes, vitest(happy-dom/RTL), next/link, next/navigation(usePathname).

**Spec:** `docs/superpowers/specs/2026-06-04-multipage-skeleton-design.md`

---

## 파일 구조

| 파일 | 책임 | 액션 |
|------|------|------|
| `src/components/layout/site-header.tsx` | 로고+네비+테마토글, usePathname 활성표시 | Create |
| `src/components/layout/site-header.test.tsx` | SiteHeader RTL 테스트 | Create |
| `src/app/inyeon/page.tsx` | 'Coming soon' 플레이스홀더 | Create |
| `src/app/inyeon/page.test.tsx` | 플레이스홀더 렌더 테스트 | Create |
| `src/app/layout.tsx` | 공유 chrome 셸 + SiteHeader + children | Modify |
| `src/app/page.tsx` | chrome 제거, 홈 콘텐츠(히어로+Card)만 | Modify |
| `task-log.md` / `CLAUDE.md` | 진척 기록 + step 11 ✅ + 번호 정리 | Modify |

> **Next.js 16 주의(AGENTS.md):** 구현 시작 전 `node_modules/next/dist/docs`에서 App Router 파일 라우팅·`next/link`·`usePathname`·layout/metadata 규약을 확인할 것. 본 계획은 표준 App Router(파일 기반 라우트, `next/navigation`의 `usePathname`, `next/link`의 `Link`)를 전제로 작성됨 — 차이가 있으면 적응하고 보고.

---

## Task 1: `SiteHeader` 컴포넌트 (TDD)

**Files:**
- Create: `src/components/layout/site-header.tsx`
- Test: `src/components/layout/site-header.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/layout/site-header.test.tsx` 생성:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// usePathname을 가변값으로 모킹 (vi.hoisted로 호이스팅 안전)
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
// next-themes 모킹 — ThemeToggle이 provider/matchMedia 없이 결정적으로 렌더되도록
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("로고와 두 네비 링크를 올바른 href로 렌더한다", () => {
    nav.pathname = "/";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /My Saju/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Inyeon/ })).toHaveAttribute("href", "/inyeon");
  });

  it("현재 경로(/inyeon) 링크에 aria-current='page'를 표시한다", () => {
    nav.pathname = "/inyeon";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /Inyeon/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /My Saju/ })).not.toHaveAttribute("aria-current");
  });

  it("홈(/) 경로에서는 My Saju가 활성이다", () => {
    nav.pathname = "/";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /My Saju/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Inyeon/ })).not.toHaveAttribute("aria-current");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/layout/site-header.test.tsx`
Expected: FAIL — `Cannot find module './site-header'`.

- [ ] **Step 3: 구현**

`src/components/layout/site-header.tsx` 생성:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV = [
  { href: "/", label: "My Saju" },
  { href: "/inyeon", label: "Inyeon" },
] as const;

/** 모든 페이지 공통 슬림 헤더: 로고(→/) + 네비 + 테마토글. usePathname으로 활성표시. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-6 pb-3 pt-9">
      <Link href="/" className="flex items-baseline gap-1.5">
        <span className="font-display text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </span>
        <span className="hanja text-sm font-bold text-muted-foreground">사주</span>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/layout/site-header.test.tsx`
Expected: PASS (3). 또한 `npx tsc --noEmit` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/site-header.tsx src/components/layout/site-header.test.tsx
git commit -m "feat(layout): SiteHeader with nav + active-route highlight

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `/inyeon` 플레이스홀더 페이지 (TDD)

**Files:**
- Create: `src/app/inyeon/page.tsx`
- Test: `src/app/inyeon/page.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/inyeon/page.test.tsx` 생성:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InyeonPage from "./page";

describe("InyeonPage", () => {
  it("'coming soon' 플레이스홀더를 렌더한다", () => {
    render(<InyeonPage />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/compatibility/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/app/inyeon/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`.

- [ ] **Step 3: 구현**

`src/app/inyeon/page.tsx` 생성:

```tsx
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inyeon · KSaju",
  description: "K-pop bias & partner compatibility — coming soon.",
};

/** '인연' 라우트. 이번 사이클은 플레이스홀더(궁합 이전은 사이클 12). */
export default function InyeonPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Inyeon
        </h1>
        <p className="hanja text-4xl font-bold tracking-[0.3em]">인 연</p>

        <Card className="relative overflow-hidden border-border mt-2 py-10">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
          <CardContent className="space-y-3 pt-6">
            <p className="text-lg font-semibold">
              K-pop bias &amp; partner compatibility
            </p>
            <p className="text-muted-foreground">Coming soon ✨</p>
            <p className="text-xs text-muted-foreground">For entertainment 🌙</p>
          </CardContent>
          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/app/inyeon/page.test.tsx`
Expected: PASS (1). `npx tsc --noEmit` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/inyeon/page.tsx src/app/inyeon/page.test.tsx
git commit -m "feat(inyeon): coming-soon placeholder route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 공유 chrome를 레이아웃으로 이동 (layout.tsx + page.tsx 리팩터)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

> chrome 이동은 원자적이어야 한다(레이아웃이 chrome를 얻는 동시에 page가 내려놓아야 이중/누락이 없음). 두 파일을 한 커밋으로. 단위 테스트 없음 — 기존 전체 테스트 + `next build` + 수동 검증으로 확인.

- [ ] **Step 1: `layout.tsx` 수정 — 공유 chrome 셸 + SiteHeader**

`src/app/layout.tsx`의 import에 SiteHeader 추가(ThemeProvider import 아래):

```tsx
import { SiteHeader } from "@/components/layout/site-header";
```

`RootLayout`의 `return`에서 `<ThemeProvider ...>{children}</ThemeProvider>` 부분을 다음으로 교체(ThemeProvider props는 그대로):

```tsx
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="hanji-paper min-h-screen relative overflow-hidden">
            {/* 페이지 상단 창살 */}
            <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

            {/* 거대 ㅎ — pointer-events-none이라 클릭 통과. (page.tsx에서 이동, className 보존) */}
            <span
              className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-30 sm:z-0"
              aria-hidden="true"
            >
              ㅎ
            </span>

            {/* 콘텐츠 컬럼: 공통 헤더 + 페이지 콘텐츠 */}
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
            </div>

            {/* 페이지 하단 창살 */}
            <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
          </main>
        </ThemeProvider>
```

> 주의: ㅎ의 className은 page.tsx 원본 그대로(`z-30 sm:z-0` 포함) — 모바일에서 ㅎ가 콘텐츠 위로 오는 기존 디자인 의도 보존(task-log 2026-05-22 `7519da9`). 헤더(top)와 ㅎ(bottom-right)는 화면 영역이 달라 충돌하지 않음.

- [ ] **Step 2: `page.tsx` 수정 — chrome 제거, 홈 콘텐츠만**

`src/app/page.tsx`에서:
- import 줄 `import { ThemeToggle } from "@/components/ui/theme-toggle";` **삭제**(헤더로 이동했으므로 홈에서 불필요).
- `return (...)` 전체를 다음으로 교체(상단 state/handleSubmit/subscribeTz 등은 **그대로 유지**):

```tsx
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </h1>
        <p className="hanja text-5xl font-bold tracking-[0.4em]">사 주</p>
        <p className="font-serif italic text-xl text-primary">
          Saju, but make it K.
        </p>

        <Card className="relative overflow-hidden border-border mt-8 py-6">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
          {view === "form" || !userSaju || !kst || !currentLuck ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">When were you born?</CardTitle>
                <CardDescription>
                  Korea uses KST · we&apos;ll convert for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-left text-sm text-destructive"
                  >
                    {errorMessage}
                  </div>
                )}
                <BirthForm
                  onSubmit={handleSubmit}
                  defaultTimezone={defaultTz}
                  submitting={submitting}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-8 pb-2 text-left">
              <SajuResult
                userSaju={userSaju}
                kst={kst}
                currentLuck={currentLuck}
                onEdit={() => setView("form")}
              />
            </CardContent>
          )}
          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>
      </div>
    </div>
  );
```

> 변경 요점: 최상위 `<main hanji-paper>` + 상/하단 창살 + ㅎ + 테마토글 절대배치 **제거**(레이아웃 담당). 콘텐츠 루트를 `flex flex-1 flex-col items-center justify-center`로 바꿔 레이아웃 컬럼의 남은 높이에서 중앙정렬(기존 `min-h-screen` 제거 — 레이아웃 컬럼이 min-h-screen 담당). Card 내부 창살(h-[18px])은 그대로 유지.

- [ ] **Step 3: 타입체크 + 전체 테스트 회귀**

Run: `npx tsc --noEmit; npx vitest run`
Expected: tsc 0 errors. 전체 테스트 PASS(기존 124 + SiteHeader 3 + Inyeon 1 = 128 내외). `ThemeToggle` import 제거로 인한 unused 경고 없음 확인.

- [ ] **Step 4: 빌드 회귀**

Run: `npx next build`
Expected: 빌드 성공. 라우트 목록에 `/`와 `/inyeon` 둘 다 생성(가능하면 static `○`/prerendered). 에러 없음.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "refactor(layout): hoist shared chrome + SiteHeader to root layout

Move hanji bg, changsal bands, ㅎ, and theme toggle out of page.tsx into
the root layout so / and /inyeon share them. Home page now renders only
its hero + card content.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 수동 시각 검증 + 문서 갱신

**Files:**
- Modify: `task-log.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 수동 시각 검증 (사용자 협조)**

`npm run dev` 후 시크릿 창에서:
1. `/` — 슬림 헤더(KSaju 사주 로고 + My Saju/Inyeon 네비 + 테마토글) 상단 노출, 큰 히어로 + 생일 폼 유지, 한지/창살/ㅎ 정상
2. 네비 "Inyeon" 클릭 → `/inyeon` 'Coming soon' 카드, 헤더에서 Inyeon 활성표시
3. 네비 "My Saju"로 복귀 → 홈, My Saju 활성표시
4. 생일 제출 → 사주 결과(운세·궁합 인라인) 여전히 정상
5. 다크 모드 토글(헤더에서) → 두 페이지 모두 cosmic 톤
6. 모바일 viewport — 헤더 한 줄 유지, ㅎ 위치, 카드 정상

- [ ] **Step 2: 검증 회귀**

Run: `npx vitest run; npx tsc --noEmit; npx eslint .`
Expected: 전체 PASS, tsc 0, eslint 기존 경고(form.tsx ref / saju-data.ts YinYang)만.

- [ ] **Step 3: 문서 갱신**

`CLAUDE.md` 로드맵 step 11(`⏳ 멀티페이지 골격 + 내비`)을 ✅로 갱신:
```
11. ✅ **멀티페이지 골격 + 내비** — 라우트 분리(`/` 내 사주, `/inyeon` 인연 플레이스홀더). 공유 chrome(한지·창살·ㅎ·테마토글) + 슬림 헤더(`src/components/layout/site-header.tsx`, usePathname 활성표시)를 루트 `layout.tsx`로 추출. 궁합 이전·상대 궁합은 사이클 12. spec/plan: `docs/superpowers/{specs,plans}/2026-06-04-multipage-skeleton*`
```

`task-log.md` 상단에 `## 2026-06-04` 항목 추가: 사이클 11 완료 요약(라우트 분리, SiteHeader, chrome 이동), 커밋 목록, **번호 정리 메모**(CLAUDE.md step 11 = 본 사이클 "멀티페이지 골격"; task-log 과거 decompose의 "사이클 10/11"과 어긋났던 번호를 step 번호 기준으로 통일), 다음 작업(사이클 12 인연: 궁합 이전 + 일반 상대 궁합, 크로스 페이지 상태 결정).

- [ ] **Step 4: Commit**

```bash
git add task-log.md CLAUDE.md
git commit -m "docs: mark multipage skeleton (cycle 11) complete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (작성자 체크 결과)

**Spec 커버리지:**
- 라우트 분리 `/` + `/inyeon` → Task 2(/inyeon) + Task 3(/ 정리) ✅
- 공유 chrome 루트 레이아웃 추출 → Task 3 ✅
- `<SiteHeader>` 로고+네비+테마토글+usePathname 활성표시 → Task 1 ✅
- `/inyeon` 플레이스홀더 → Task 2 ✅
- 궁합 인라인 유지(이전 안 함) → Task 3에서 page.tsx의 SajuResult/CompatibilitySection 그대로 ✅
- 테스트(SiteHeader RTL + inyeon 렌더) → Task 1/2 ✅
- 비범위(궁합 이전·상대 궁합·크로스페이지 상태·이미지 export) → Task에 없음(의도) ✅

**Placeholder 스캔:** 모든 코드 블록 실제 구현 포함. TBD/TODO 없음.

**타입/이름 일관성:** `SiteHeader`(Task 1 정의 = Task 3 import) 일치. `InyeonPage` default export(Task 2 정의 = Task 2 test import) 일치. NAV href `/`·`/inyeon`가 라우트 파일과 일치. ㅎ className은 page.tsx 원본과 동일 문자열 사용(Task 3) → 시각 회귀 방지.

**위험 포인트:** Task 3의 레이아웃 높이(레이아웃 컬럼 `min-h-screen flex-col` + 페이지 `flex-1` 중앙정렬) — 헤더가 차지하는 높이만큼 콘텐츠가 줄지만 overflow 없음. 헤더 `pt-9`(36px)로 상단 창살(28px) 클리어. 빌드+수동 검증으로 확인.
