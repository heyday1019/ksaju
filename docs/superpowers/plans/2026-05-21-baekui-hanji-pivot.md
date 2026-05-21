# 백의민족 한지 피벗 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KSaju 랜딩 페이지를 백의민족 한지 톤(Light 기본) + Cosmic Korean(Dark 토글) 듀얼 모드로 전환하고, 디자인 토큰을 한국어로 교체한다.

**Architecture:** 4계층 — ① CSS 변수 토큰 (globals.css), ② @theme + 유틸리티 클래스 (hanji-paper · changsal-band · ink-bleed · cosmic-bg), ③ next-themes 인프라 (layout.tsx + ThemeToggle), ④ 랜딩 페이지 적용 (page.tsx). 시맨틱 토큰을 통해 shadcn 컴포넌트가 자동 모드 적응.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 (`@theme inline`) · shadcn/ui · next-themes · next/font/google (Geist · Inter · Gowun Batang · Yeon Sung) · Pretendard Variable (jsDelivr CDN)

**Spec:** `docs/superpowers/specs/2026-05-21-baekui-hanji-pivot-design.md` (커밋 `5f85aaa`)

**TDD:** 미적용 — 시각적 변경, 자동 테스트 가치 낮음. 각 task는 빌드 통과 + 명세 9.1 수동 시각 검증으로 검증.

---

## 영향받는 파일

| 파일 | 변경 종류 | Task |
|------|----------|------|
| `package.json` | 의존성 추가 (`next-themes`) | 1 |
| `src/app/globals.css` | 전면 재작성 | 2 |
| `src/app/layout.tsx` | 폰트 4개 + ThemeProvider 통합 | 3 |
| `src/components/ui/theme-toggle.tsx` | 신규 | 4 |
| `src/app/page.tsx` | 랜딩 재구성 | 5 |

각 task = 1 commit. 6번째 task는 수동 시각 검증 (no commit).

---

## Task 1: next-themes 설치 + React 19 호환성 확인

**Files:**
- Modify: `package.json` (next-themes 의존성)
- Modify: `package-lock.json` (자동)

**Goal:** 라이브러리 설치 후 React 19 / Next.js 16과 호환되는지 빌드로 확인. 비호환 시 즉시 발견하여 후속 task 막힘 방지.

- [ ] **Step 1: next-themes 설치**

Run:
```bash
npm install next-themes
```

Expected: `package.json`에 `"next-themes": "^0.x.x"` 추가, `package-lock.json` 업데이트.

- [ ] **Step 2: 빌드 호환성 검증**

Run:
```bash
npm run build
```

Expected: 성공. 경고/에러 없음. 비호환 에러 발생 시 (예: `Module not found` 또는 React 19 peerDep 충돌) → 사용자에게 보고하고 직접 구현(Context + useEffect, ~5kb) 대안 논의.

- [ ] **Step 3: 변경 확인 + 커밋**

Run:
```bash
git status
git diff package.json
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add next-themes for Light/Dark mode toggle

라이트(한지) / 다크(Cosmic Korean) 듀얼 모드 토글 인프라.
~5kb, peer-dependency 없음. React 19/Next.js 16 호환 확인.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: 새 커밋 생성 (`feat: add next-themes ...`).

---

## Task 2: globals.css 전면 재작성

**Files:**
- Modify (full rewrite): `src/app/globals.css`

**Goal:** Cosmic Korean 단일 다크 톤을 → 한국어 토큰 Light 기본 + Cosmic Korean Dark 듀얼로 교체. 한지/창살/잉크 유틸리티 추가.

- [ ] **Step 1: 기존 globals.css 백업 확인**

기존 백업 `src/app/globals_org.css`이 이미 untracked로 존재 (Phase 1 작업 시 생성됨). 신규 백업 불필요. 만약 사용자가 비교 필요 시 이 파일 참조.

Run:
```bash
ls src/app/globals_org.css
```

Expected: 파일 존재. 없으면 `cp src/app/globals.css src/app/globals_pre_pivot.css`로 임시 백업 (이후 삭제 또는 .gitignore).

- [ ] **Step 2: globals.css 전면 재작성**

`src/app/globals.css`를 다음 내용으로 완전히 교체:

```css
/* ============================================
   백의민족 한지 — KSaju Design System v2
   ============================================
   Light (기본): 한지 톤
   Dark (토글): Cosmic Korean
   ============================================ */

@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
@import "tailwindcss";

/* === LIGHT MODE (DEFAULT) — 백의민족 한지 === */
:root {
  /* 브랜드 색 — 한국어 이름 */
  --color-hanji:     #FBF6E8;  /* 한지 — 배경 */
  --color-baekja:    #FFFFFF;  /* 백자 — 카드 */
  --color-muk:       #1A1A2E;  /* 묵 — 본문 텍스트 */
  --color-jindallae: #C8385A;  /* 진달래 — primary */
  --color-dancheong: #C49A3F;  /* 단청황 — accent */
  --color-cheongja:  #88B0BC;  /* 청자 — 예약 (정보/secondary 배지) */

  /* shadcn 시맨틱 매핑 */
  --background: var(--color-hanji);
  --foreground: var(--color-muk);
  --card: var(--color-baekja);
  --card-foreground: var(--color-muk);
  --popover: var(--color-baekja);
  --popover-foreground: var(--color-muk);
  --primary: var(--color-jindallae);
  --primary-foreground: var(--color-baekja);
  --secondary: #F5EFE0;
  --secondary-foreground: var(--color-muk);
  --muted: #F5EFE0;
  --muted-foreground: rgba(26, 26, 46, 0.65);
  --accent: var(--color-dancheong);
  --accent-foreground: var(--color-baekja);
  --destructive: #C84B30;
  --destructive-foreground: var(--color-baekja);
  --border: rgba(26, 26, 46, 0.12);
  --input: rgba(26, 26, 46, 0.08);
  --ring: var(--color-jindallae);
  --radius: 0.75rem;

  /* cosmic-bg 그라데이션 변수 (Light = 한지 톤) */
  --bg-from: var(--color-hanji);
  --bg-via:  #F5EFE0;
  --bg-to:   var(--color-baekja);
}

/* === DARK MODE — Cosmic Korean === */
.dark {
  /* 브랜드 색 — Cosmic Korean (영문 유지) */
  --color-cosmic-navy:  #0F0828;
  --color-cosmic-deep:  #1A0B3A;
  --color-cosmic-mid:   #1F0F40;
  --color-cosmic-light: #2D1454;
  --color-saju-pink:    #FF4D8D;
  --color-korean-gold:  #F4C95D;
  --color-hanji-cream:  #FFF6E5;

  /* shadcn 시맨틱 매핑 */
  --background: var(--color-cosmic-navy);
  --foreground: var(--color-hanji-cream);
  --card: var(--color-cosmic-deep);
  --card-foreground: var(--color-hanji-cream);
  --popover: var(--color-cosmic-mid);
  --popover-foreground: var(--color-hanji-cream);
  --primary: var(--color-saju-pink);
  --primary-foreground: var(--color-hanji-cream);
  --secondary: var(--color-cosmic-mid);
  --secondary-foreground: var(--color-hanji-cream);
  --muted: var(--color-cosmic-light);
  --muted-foreground: rgba(255, 246, 229, 0.65);
  --accent: var(--color-korean-gold);
  --accent-foreground: var(--color-cosmic-navy);
  --destructive: #C84B30;
  --destructive-foreground: var(--color-hanji-cream);
  --border: rgba(255, 246, 229, 0.12);
  --input: rgba(255, 246, 229, 0.08);
  --ring: var(--color-saju-pink);

  /* cosmic-bg 그라데이션 변수 (Dark = Cosmic) */
  --bg-from: var(--color-cosmic-navy);
  --bg-via:  var(--color-cosmic-mid);
  --bg-to:   var(--color-cosmic-light);
}

/* === Tailwind v4 @theme inline — 폰트 변수 매핑 === */
@theme inline {
  --font-display: var(--font-geist), system-ui, -apple-system, sans-serif;
  --font-sans:    var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-hangul:  "Pretendard Variable", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-serif:   var(--font-gowun-batang), Georgia, serif;
  --font-calli:   var(--font-yeon-sung), cursive;
  --font-mono:    ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
}

/* === 한지 텍스처 유틸리티 — JK 스윗 스폿 (stripe 0.035, noise 0.07, freq 0.75) === */
.hanji-paper {
  background-color: var(--color-hanji);
  background-image:
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 2px,
      rgba(196, 154, 63, 0.035) 2px, rgba(196, 154, 63, 0.035) 4px),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' /%3E%3CfeColorMatrix values='0 0 0 0 0.77 0 0 0 0 0.6 0 0 0 0 0.25 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* === 우물 정(井) 창살 띠 — 가로 2획 + 세로 2획 === */
.changsal-band {
  height: 28px;
  background-repeat: repeat-x;
  background-size: 40px 28px;
  opacity: 0.65;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 40 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='g' x='0' y='0' width='40' height='30' patternUnits='userSpaceOnUse'%3E%3Cline x1='0' y1='10' x2='40' y2='10' stroke='%23C49A3F' stroke-width='1'/%3E%3Cline x1='0' y1='20' x2='40' y2='20' stroke='%23C49A3F' stroke-width='1'/%3E%3Cline x1='13' y1='0' x2='13' y2='30' stroke='%23C49A3F' stroke-width='1'/%3E%3Cline x1='27' y1='0' x2='27' y2='30' stroke='%23C49A3F' stroke-width='1'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E");
}

.dark .changsal-band {
  opacity: 0.45;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 40 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpattern id='g' x='0' y='0' width='40' height='30' patternUnits='userSpaceOnUse'%3E%3Cline x1='0' y1='10' x2='40' y2='10' stroke='%23FFF6E5' stroke-width='1'/%3E%3Cline x1='0' y1='20' x2='40' y2='20' stroke='%23FFF6E5' stroke-width='1'/%3E%3Cline x1='13' y1='0' x2='13' y2='30' stroke='%23FFF6E5' stroke-width='1'/%3E%3Cline x1='27' y1='0' x2='27' y2='30' stroke='%23FFF6E5' stroke-width='1'/%3E%3C/pattern%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E");
}

/* === 잉크 번짐 효과 (거대 ㅎ에 적용) === */
.ink-bleed {
  filter: blur(0.6px);
  text-shadow:
    0 0 1px rgba(196, 154, 63, 0.4),
    2px 2px 0 rgba(196, 154, 63, 0.15);
}

/* === 코스믹 배경 그라데이션 (모드 적응) === */
.cosmic-bg {
  background: linear-gradient(135deg,
    var(--bg-from) 0%,
    var(--bg-via) 55%,
    var(--bg-to) 100%);
}

/* === 한자/한글 텍스트 강조 유틸리티 === */
.hanja {
  font-family: var(--font-serif);
  color: var(--accent);
  letter-spacing: 0.05em;
}

.hangul {
  font-family: var(--font-hangul);
}
```

이전 버전과 비교:
- `:root, .dark` 동일 다크 값 → `:root` Light + `.dark` Dark 분리
- `--color-saju-pink` 등 영문 토큰 → `--color-jindallae` 등 한국어 토큰 (Dark는 영문 유지)
- `.cosmic-bg`/`.cosmic-card-bg` 하드코딩 → CSS 변수로 모드 적응
- `.cosmic-stars::before` 제거
- `.cosmic-card-bg` 제거
- `.hanja` 색을 `var(--color-korean-gold)` → `var(--accent)` 시맨틱화
- `.hanji-paper`, `.changsal-band`, `.ink-bleed` 신규
- `@theme inline`에 `--font-serif: var(--font-gowun-batang)`, `--font-calli: var(--font-yeon-sung)` 추가

- [ ] **Step 3: 빌드 통과 검증**

Run:
```bash
npm run build
```

Expected: 성공. Tailwind v4가 `@theme inline` 폰트 변수를 읽어 유틸리티 클래스(`font-display`, `font-sans`, `font-hangul`, `font-serif`, `font-calli`) 자동 생성.

주의: 이 시점에는 `--font-gowun-batang`과 `--font-yeon-sung`이 아직 layout.tsx에 정의되지 않았으므로 CSS 값이 비어있음. 빌드는 통과(undefined CSS 변수는 빌드 시점 에러 아님). 다음 task에서 해결.

- [ ] **Step 4: 커밋**

Run:
```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
feat: rewrite globals.css with Korean tokens and hanji utilities

- 한국어 브랜드 토큰: 한지/백자/묵/진달래/단청황/청자
- :root = Light(한지 기본), .dark = Cosmic Korean 유지
- 신규 유틸리티: .hanji-paper(JK noise), .changsal-band(井자 패턴), .ink-bleed
- .cosmic-bg는 CSS 변수로 모드 적응 리팩토링
- 제거: .cosmic-card-bg, .cosmic-stars
- .hanja는 var(--accent)로 시맨틱화

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: layout.tsx 폰트 + ThemeProvider 통합

**Files:**
- Modify (full rewrite): `src/app/layout.tsx`

**Goal:** 4개 next/font/google 폰트 추가 + `<html className="dark">` 강제 제거 + `<ThemeProvider>` 감싸기.

- [ ] **Step 1: layout.tsx 전면 재작성**

`src/app/layout.tsx`를 다음 내용으로 완전히 교체:

```tsx
import type { Metadata } from "next";
import { Geist, Inter, Gowun_Batang, Yeon_Sung } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const yeonSung = Yeon_Sung({
  variable: "--font-yeon-sung",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KSaju · Korean fortune, made cosmic",
  description: "Authentic Korean saju for the K-content generation. Discover your inyeon.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

변경 요약:
- `import { Gowun_Batang, Yeon_Sung }` 추가
- `import { ThemeProvider } from "next-themes"` 추가
- `gowunBatang`, `yeonSung` 인스턴스 추가 (CSS 변수 노출)
- `<html className="dark">` → `<html>` (다크 강제 제거)
- `<body>` className에 `${gowunBatang.variable} ${yeonSung.variable}` 추가
- `<ThemeProvider>`로 children 감싸기 (Light 기본 + OS 무시 + FOUC 방지)

`suppressHydrationWarning`은 그대로 — `next-themes`가 클라이언트 hydration 전에 클래스 적용하므로 필수.

- [ ] **Step 2: 빌드 통과 검증**

Run:
```bash
npm run build
```

Expected: 성공. Next.js가 4개 Google Fonts를 self-host로 변환 (`Compiled successfully`). 빌드 출력에 4개 font 다운로드 로그 확인 가능.

- [ ] **Step 3: 커밋**

Run:
```bash
git add src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat: load Korean fonts and wrap with ThemeProvider

- next/font/google: Gowun Batang(serif), Yeon Sung(calli) 추가
- 4개 폰트 CSS 변수가 body에 노출 → @theme inline에서 참조
- <html className="dark"> 강제 제거 → next-themes가 동적 토글
- ThemeProvider: defaultTheme="light", enableSystem=false,
  disableTransitionOnChange (FOUC 방지)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: ThemeToggle 컴포넌트 신규 작성

**Files:**
- Create: `src/components/ui/theme-toggle.tsx`

**Goal:** 우상단에 배치할 Sun/Moon 토글 버튼. `mounted` 가드로 SSR/CSR 미스매치 방지.

- [ ] **Step 1: 디렉토리 확인**

Run:
```bash
ls src/components/ui/
```

Expected: `button.tsx`, `card.tsx` 등 shadcn 컴포넌트들이 이미 존재. `theme-toggle.tsx`는 없음.

- [ ] **Step 2: theme-toggle.tsx 신규 작성**

`src/components/ui/theme-toggle.tsx` 파일 생성, 내용:

```tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        size="icon"
        variant="ghost"
        disabled
        aria-label="Loading theme toggle"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} />
    </Button>
  );
}
```

핵심 패턴:
- `"use client"` 지시어 — `useTheme`은 hook, 클라이언트 컴포넌트 필요
- `mounted` 가드 — SSR 동안 disabled placeholder 렌더, hydration 후 실제 아이콘 (깜빡임/미스매치 방지)
- `resolvedTheme === "dark"` 검사 → 아이콘과 클릭 시 토글 방향 결정
- `aria-label` 동적 — 접근성

`@hugeicons/react`와 `@hugeicons/core-free-icons`는 이미 `package.json`에 있음 (사전 확인 완료).

- [ ] **Step 3: 빌드 통과 검증**

Run:
```bash
npm run build
```

Expected: 성공. `theme-toggle.tsx`가 다른 곳에서 import되지 않으므로 빌드 출력에 직접 표시되지 않을 수 있음 (tree-shaking). 다음 task에서 page.tsx가 import하면 사용됨.

- [ ] **Step 4: 커밋**

Run:
```bash
git add src/components/ui/theme-toggle.tsx
git commit -m "$(cat <<'EOF'
feat: add ThemeToggle component with mounted guard

Sun/Moon 토글 버튼. localStorage 처리는 next-themes 자동.
mounted 가드로 SSR/CSR 미스매치 깜빡임 방지.
@hugeicons/react의 Sun03/Moon02 아이콘 사용.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: page.tsx 랜딩 재구성

**Files:**
- Modify (full rewrite): `src/app/page.tsx`

**Goal:** 한지 배경 + 페이지 상하 창살 + 우측하단 거대 ㅎ + hero card 상하 창살 + 우상단 토글 + 시맨틱 토큰화.

- [ ] **Step 1: page.tsx 전면 재작성**

`src/app/page.tsx`를 다음 내용으로 완전히 교체:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="hanji-paper cosmic-bg min-h-screen relative overflow-hidden">
      {/* 페이지 상단 창살 */}
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      {/* 우상단 테마 토글 (상단 창살 아래에 위치) */}
      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 거대 ㅎ — 우측하단 배경. Dark에서 opacity 낮춰 코스믹 위 잡음 줄임 */}
      <span
        className="font-calli ink-bleed absolute -right-[3%] -bottom-[10%] text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-0"
        aria-hidden="true"
      >
        ㅎ
      </span>

      {/* Hero 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-14 px-8">
        <div className="max-w-2xl w-full space-y-6 text-center">
          <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            KSaju
          </h1>
          <p className="hanja text-2xl tracking-[0.5em]">사 주</p>
          <p className="font-serif italic text-xl text-primary">
            Saju, but make it K.
          </p>

          <Card className="relative overflow-hidden border-border mt-8 py-6">
            {/* 카드 상단 창살 */}
            <div
              className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
            <CardHeader>
              <CardTitle className="text-2xl">Your Inyeon Awaits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Korean fortune for the K-content generation. Built on KASI manseryeok.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button size="lg">Discover your saju</Button>
                <Button size="lg" variant="outline">Learn more</Button>
              </div>
            </CardContent>
            {/* 카드 하단 창살 */}
            <div
              className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
          </Card>
        </div>
      </div>

      {/* 페이지 하단 창살 */}
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

변경 요약 (이전 page.tsx 대비):
- `<main>`에 `hanji-paper cosmic-bg overflow-hidden` 추가
- 페이지 상하 창살 띠 2개 (`changsal-band z-40`)
- `<ThemeToggle/>` 우상단 (`top-12 right-6 z-50` — 상단 창살 28px 아래)
- 거대 ㅎ 배경 (`font-calli ink-bleed`, `text-[32rem]`, `text-accent/55 dark:text-accent/35`)
- 브랜드 그라데이션 `from-[#FFF6E5] to-[#F4C95D]` → `from-primary to-accent` (모드 적응)
- italic 문구 `text-[#FF4D8D]` → `text-primary` (모드 적응)
- Card에 `relative overflow-hidden border-border py-6` + 상하 창살 자식 2개
- `cosmic-card-bg border-white/10` 제거 (Card 기본 `bg-card border-border` 사용)

z-index 레이어:
- z-0: 거대 ㅎ
- z-10: hero 콘텐츠 + 카드 내부 창살
- z-40: 페이지 상하 창살
- z-50: 토글

- [ ] **Step 2: 빌드 통과 검증**

Run:
```bash
npm run build
```

Expected: 성공. Tailwind가 새로 사용된 클래스(`hanji-paper`, `cosmic-bg`, `changsal-band`, `ink-bleed`, `font-calli`, `text-accent/55`, `dark:text-accent/35`, `from-primary`, `to-accent` 등) 모두 생성.

- [ ] **Step 3: 커밋**

Run:
```bash
git add src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat: rebuild landing page with hanji theme and theme toggle

- main에 hanji-paper + cosmic-bg (모드 적응)
- 페이지 상하 + hero card 상하 井자 창살 띠
- 우측하단 거대 ㅎ (Yeon Sung + ink-bleed, Dark에서 opacity 낮춤)
- 우상단 ThemeToggle (상단 창살 아래)
- 하드코딩 hex 제거 — from-primary to-accent, text-primary, border-border
- cosmic-card-bg / border-white/10 제거 → shadcn Card 기본 사용

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 수동 시각 검증 (no commit)

**Files:** 없음 — 브라우저 + DevTools 점검만.

**Goal:** spec 9.1의 검증 시나리오 8개를 모두 통과시키고 회귀 없음을 확인.

- [ ] **Step 1: 개발 서버 실행**

Run:
```bash
npm run dev
```

Expected: `▲ Next.js 16.x.x` 배너, `Local: http://localhost:3001` 또는 `:3000` 표시. 컴파일 에러 없음.

(브라우저에서 표시된 URL로 접속)

- [ ] **Step 2: 첫 방문 — Light 모드**

브라우저 시크릿 창에서 `http://localhost:3001` 열기.

Expected:
- 한지 베이지(#FBF6E8) 배경 + 미세한 종이 결 노이즈 보임
- 페이지 상하단에 옅은 단청황 井자 격자 띠
- 우상단에 ☀️ 아이콘 (Moon icon, "Dark로 전환" 의도)
- 우측하단에 거대 ㅎ (단청황, 살짝 흐릿한 잉크 번짐)
- 중앙 "KSaju" 브랜드 (진달래→단청황 그라데이션)
- "사 주" (단청황, Gowun Batang serif)
- "Saju, but make it K." (진달래 italic)
- 흰 카드, 상하 창살 띠, 진달래 핑크 버튼

DevTools Application → Local Storage 확인: `theme` 키 없음 (첫 방문).

- [ ] **Step 3: 토글 클릭 → Dark 모드**

우상단 토글 클릭.

Expected:
- 즉시 코스믹 네이비 배경으로 전환, FOUC 없음
- 창살은 한지 크림 stroke로 변경
- ㅎ 자음은 Korean Gold, opacity 더 낮아짐 (35%)
- 브랜드 그라데이션 Saju Pink → Korean Gold
- 토글 아이콘이 🌙 (Sun icon, "Light로 전환" 의도)로 교체
- DevTools Application → Local Storage: `theme: "dark"` 추가됨

- [ ] **Step 4: F5 새로고침 → Dark 유지**

F5 누름.

Expected: Dark 모드 그대로 유지. 깜빡임 없음. localStorage `theme: "dark"` 유지.

DevTools Elements 탭에서 `<html class="dark">` 확인.

- [ ] **Step 5: 다시 토글 → Light 복귀**

토글 클릭.

Expected: Light로 즉시 전환. localStorage `theme: "light"`로 변경.

- [ ] **Step 6: 폰트 적용 확인 (DevTools Computed)**

DevTools → Elements → 각 요소 클릭 → Computed → font-family 확인:

| 요소 | 기대 font-family |
|------|------------------|
| 거대 ㅎ (`.font-calli`) | `'__Yeon_Sung_xxx', cursive` (next/font 해시 포함) |
| "사 주" (`.hanja`) | `'__Gowun_Batang_xxx', Georgia, serif` |
| "Saju, but make it K." (`.font-serif italic`) | Gowun Batang chain |
| "KSaju" 브랜드 (`.font-display`) | Geist chain |
| 영문 본문/버튼 | Inter chain |

- [ ] **Step 7: Network 탭 폰트 다운로드 확인**

DevTools → Network → Font 필터.

Expected: Geist, Inter, Gowun Batang, Yeon Sung 4개 woff2 파일 + Pretendard Variable CDN 1개. 모두 200 OK.

- [ ] **Step 8: 접근성 — WCAG AA 대비비**

DevTools → Lighthouse → Accessibility 카테고리 실행.

Expected:
- 점수 ≥ 90
- "Contrast" 항목 통과
- Light: 묵 #1A1A2E on 한지 #FBF6E8 ≈ 14:1 ✓
- Dark: 한지 크림 on 코스믹 ≈ 16:1 ✓

- [ ] **Step 9: 시각 디테일 확인**

수동으로 다음을 확인:
- 井 패턴이 가로 2획 + 세로 2획 (이전의 가로 1획 아님)
- Dark 모드 창살이 흰색/크림 stroke
- 거대 ㅎ이 잉크 번짐으로 살짝 흐릿
- hero card 상하에도 작은 창살 띠
- 모바일 viewport (DevTools 토글) — 가로 스크롤 발생 시 보고 (이번 spec은 데스크탑 기준, 후속 spec에서 처리)

- [ ] **Step 10: 빌드 + lint 회귀**

Run:
```bash
npm run build
npm run lint
```

Expected: 둘 다 통과. lint 에러나 경고 없음.

- [ ] **Step 11: 검증 결과 보고**

검증 통과 시 사용자에게 보고:
> "Task 6 수동 검증 모두 통과. Light/Dark 토글 정상, localStorage 보존, FOUC 없음, 폰트 5종 적용 확인, WCAG AA ≥ 4.5:1, 빌드/lint 통과. push 또는 추가 작업 의견?"

검증 실패 항목 발견 시:
- 어떤 단계가 실패했는지 명시
- 스크린샷 또는 콘솔 에러 첨부
- 원인 추정 후 사용자와 수정 방향 논의

---

## Self-Review 결과

**Spec coverage:**
- 4계층 아키텍처 → Task 2(토큰·유틸리티), Task 3(테마 인프라), Task 5(페이지) ✓
- 한국어 토큰 6개 → Task 2 Step 2 ✓
- 시맨틱 매핑 → Task 2 Step 2 ✓
- 5개 폰트 패밀리 → Task 2 (@theme inline) + Task 3 (next/font 로드) ✓
- `.hanji-paper`, `.changsal-band`, `.ink-bleed`, `.cosmic-bg` 리팩토링 → Task 2 ✓
- `.hanja` 시맨틱화 → Task 2 ✓
- 제거: `.cosmic-card-bg`, `.cosmic-stars::before` → Task 2 (코드에 미포함으로 자연 제거) ✓
- next-themes → Task 1 ✓
- ThemeProvider 설정 → Task 3 ✓
- ThemeToggle 컴포넌트 → Task 4 ✓
- 랜딩 페이지 재구성 → Task 5 ✓
- 시맨틱화 (하드코딩 hex 제거) → Task 5 ✓
- z-index 레이어 → Task 5 ✓
- 검증 시나리오 8개 → Task 6 Step 2~9 ✓
- 빌드/회귀 → Task 6 Step 10 ✓

**Placeholder scan:** 없음. 모든 코드 블록은 완전한 파일 또는 명확한 부분 변경.

**Type consistency:** 모든 task에서 토큰 이름(`--color-jindallae` 등), 클래스 이름(`hanji-paper`, `changsal-band`, `ink-bleed`), 컴포넌트 이름(`ThemeToggle`), 폰트 변수(`--font-gowun-batang`, `--font-yeon-sung`) 일관 사용 ✓

**Risks가 plan에 반영되었는지:**
- spec 10번 위험 표 "next-themes × React 19 비호환" → Task 1 Step 2에서 즉시 빌드 검증
- "Yeon Sung 폰트 로드 깜빡임" → next/font/google의 `display: swap` 자동 적용 (next-font 기본값)
- spec의 다른 위험들은 모두 시각 검증 영역 (Task 6 Step 9) 또는 후속 작업

---

## 실행 옵션

Plan complete and saved to `docs/superpowers/plans/2026-05-21-baekui-hanji-pivot.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 각 task마다 fresh subagent 디스패치, task 간 review, 빠른 iteration

**2. Inline Execution** — 현재 세션에서 task 실행, checkpoint마다 review

Which approach?
