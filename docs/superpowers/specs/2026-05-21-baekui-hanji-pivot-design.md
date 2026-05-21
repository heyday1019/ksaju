# 백의민족 한지 피벗 — KSaju 디자인 시스템 설계서

- **작성일:** 2026-05-21
- **상태:** 설계 승인 대기
- **대체:** `2026-05-20-cosmic-korean-dual-mode-design.md` (어제 듀얼 모드 spec) — 본 문서가 사실상 그것을 대체. 어제 결정 중 `next-themes` 아키텍처·FOUC 처리·모드 토글 UI 등 그대로 유효한 부분은 본 문서에 인용 또는 재정의.
- **선행 명세:** `2026-05-20-cosmic-korean-font-system-design.md` (폰트 시스템 — 완료. Pretendard Variable CDN 로드 + next/font 변수 ↔ Tailwind theme 연결 완료)
- **TDD:** 미적용 (시각적 변경, 자동 테스트 가치 낮음)

---

## 1. 컨텍스트 및 동기

### 1.1 어제까지의 상태

폰트 시스템 수정 완료 후 시각 검증 단계에서 사용자가 "전체 디자인이 어두워 가독성이 떨어진다"고 보고. 어제 듀얼 모드 spec(Hanji Cream 기반 Light + Cosmic Korean Dark)이 작성되었으나 구현은 미진행.

### 1.2 오늘의 피벗

어제 spec보다 야심찬 방향으로 확장. 단순히 Light 팔레트를 추가하는 것이 아니라 **"백의민족 + 한지 + 창살" 라이트 톤을 기본 정체성으로 격상**:

- 한지 텍스처 배경 (종이 섬유 노이즈 포함)
- 우물 정(井)자 창살 띠를 페이지·카드 프레임으로
- 거대한 ㅎ 자음을 한국적 정체성 비주얼 자산으로
- 조선 명조체 + 캘리그래피 폰트 추가
- 디자인 토큰을 한국어 이름(한지/묵/진달래/단청황/백자/청자)으로 명명

Cosmic Korean은 Dark 모드 토글로 유지 — 야간/취향용. 첫 방문 기본은 Light.

### 1.3 어제 spec 대비 주요 변경

| 항목 | 어제 spec | 오늘 피벗 |
|------|----------|----------|
| Light 배경 | #FFF6E5 (Hanji Cream) | #FBF6E8 (한지) + 종이 노이즈 텍스처 |
| Light primary | #FF4D8D (두 모드 공통) | #C8385A (진달래) — Dark는 #FF4D8D 유지 (의도된 divergence) |
| Light accent | #F4C95D (두 모드 공통) | #C49A3F (단청황) — Dark는 #F4C95D 유지 |
| 토큰 명명 | 영문 (`--color-saju-pink`) | 한국어 (`--color-jindallae`) — 완전 교체 |
| 폰트 | Geist, Inter, Pretendard | + Gowun Batang (serif), Yeon Sung (calli) |
| 시각 자산 | 없음 | 거대 ㅎ + 한지 텍스처 + 井 창살 띠 |
| `enableSystem` | false | false (동일) |

---

## 2. 목표

1. 사용자가 토글 버튼으로 Light ↔ Dark 모드를 명시적 전환할 수 있다.
2. 선택은 localStorage에 보존, 새로고침·재방문 시 유지.
3. 첫 방문 시 기본은 Light (한지의 따뜻함이 즉시 느껴짐).
4. 한지 텍스처·거대 ㅎ·창살 띠로 "한국적 정체성"이 외국인에게도 즉시 인지된다.
5. 모드 전환 시 FOUC 없음 (`disableTransitionOnChange`).
6. 본문 텍스트 WCAG AA 대비비(≥4.5:1) 두 모드 모두 충족.
7. 모든 shadcn 컴포넌트(`<Button>`, `<Card>` 등)가 새 토큰 자동 적용.

### 2.1 비목표 (Out of Scope)

- 결과 카드 v2 (창호지 + 창살 프레임의 사주 결과 카드) — **별도 spec**
- 14자음 그리드 또는 사이드 자음 스크롤 변형
- 모바일 viewport 반응형 최적화 (이번 spec은 데스크탑 기준)
- OS `prefers-color-scheme` 자동 감지
- 모드별 OG 이미지 / favicon
- 사주 결과 페이지 (생년월일 입력 → 결과 흐름)

---

## 3. 아키텍처 — 4계층

```
① 디자인 토큰 (CSS 변수)        — globals.css :root, .dark
   ↓ 참조
② 폰트 + 유틸리티 클래스          — globals.css @theme, .hanji-paper, .changsal-band, .ink-bleed
   ↓ 사용
③ 테마 인프라 (next-themes)      — layout.tsx ThemeProvider, components/ui/theme-toggle.tsx
   ↓ 적용
④ 랜딩 페이지                    — page.tsx (재작성)
```

각 계층은 한 가지 책임만:

- **① 토큰** — 디자이너가 색만 바꾸려고 만지는 영역, 한 파일에 격리
- **② 유틸리티** — 한 번 정의하고 여러 페이지에서 재사용 (DRY)
- **③ 테마 인프라** — 한 번 세팅하고 다시는 안 만짐
- **④ 페이지** — 토큰/유틸리티/테마를 소비만. shadcn 컴포넌트 props 그대로

---

## 4. 디자인 토큰

### 4.1 한국어 브랜드 토큰 (Light)

```css
:root {
  /* 브랜드 색 — 한국어 이름 */
  --color-hanji:     #FBF6E8;  /* 한지 — 배경 */
  --color-baekja:    #FFFFFF;  /* 백자 — 카드 */
  --color-muk:       #1A1A2E;  /* 묵 — 본문 텍스트 */
  --color-jindallae: #C8385A;  /* 진달래 — primary */
  --color-dancheong: #C49A3F;  /* 단청황 — accent */
  --color-cheongja:  #88B0BC;  /* 청자 — 예약 (정보 / secondary 배지) */
}
```

### 4.2 다크 모드 토큰 유지 (영문 — Cosmic Korean 브랜딩)

```css
.dark {
  --color-cosmic-navy:  #0F0828;
  --color-cosmic-deep:  #1A0B3A;
  --color-cosmic-mid:   #1F0F40;
  --color-cosmic-light: #2D1454;
  --color-saju-pink:    #FF4D8D;
  --color-korean-gold:  #F4C95D;
  --color-hanji-cream:  #FFF6E5;
}
```

### 4.3 shadcn 시맨틱 매핑

```css
:root {
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
}

.dark {
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
}
```

**브랜드 divergence — 의도된 결정:** Light는 짙은 진달래·단청황으로 한지 위 대비 확보, Dark는 네온 Saju Pink·Korean Gold로 코스믹 위 빛남. 두 모드는 같은 시맨틱(`--primary`)을 통해 자동 적응하므로 컴포넌트 코드 변경 없음.

---

## 5. 폰트 스택 — 5개 패밀리

`@theme inline` 블록에 5개 변수 등록:

```css
@theme inline {
  --font-display: var(--font-geist), system-ui, sans-serif;
  --font-sans:    var(--font-inter), system-ui, sans-serif;
  --font-hangul:  "Pretendard Variable", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-serif:   var(--font-gowun-batang), Georgia, serif;
  --font-calli:   var(--font-yeon-sung), cursive;
}
```

`src/app/layout.tsx`에서 next/font/google로 로드:

```tsx
import { Geist, Inter, Gowun_Batang, Yeon_Sung } from "next/font/google";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],   // 한글은 자동 fallback 처리
});
const yeonSung = Yeon_Sung({
  variable: "--font-yeon-sung",
  weight: "400",
  subsets: ["latin"],
});
```

Pretendard Variable은 기존대로 jsDelivr CDN을 globals.css에서 `@import`.

### 5.1 역할 분담

| 변수 | 폰트 | 용도 |
|------|------|------|
| `--font-display` | Geist | 큰 영문 헤더, 브랜드 로고 ("KSaju") |
| `--font-sans` | Inter | 영문 본문, 버튼 라벨, UI 메타 |
| `--font-hangul` | Pretendard Variable | 한글 본문, UI 캡션 |
| `--font-serif` | Gowun Batang | 시적 인용문, 한자 (己卯 丁卯), 결과 카드 인용 |
| `--font-calli` | Yeon Sung | 우측하단 거대 ㅎ, 캘리그래피 강조 |

### 5.2 로드 비용

추가 ~80KB (Gowun Batang 400+700 weight, Yeon Sung 400 weight, 한글 subset 자동 포함). next/font/google이 self-host 변환하므로 외부 의존성 없음.

---

## 6. 유틸리티 클래스

### 6.1 `.hanji-paper` — 한지 텍스처

JK 스윗 스폿 강도 (stripe alpha 0.035, noise alpha 0.07, baseFrequency 0.75):

```css
.hanji-paper {
  background-color: var(--color-hanji);
  background-image:
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 2px,
      rgba(196, 154, 63, 0.035) 2px, rgba(196, 154, 63, 0.035) 4px),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' /%3E%3CfeColorMatrix values='0 0 0 0 0.77 0 0 0 0 0.6 0 0 0 0 0.25 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

Dark 모드에서는 한지 텍스처 대신 cosmic-bg(다음 섹션) 사용 — `.hanji-paper`는 Light 전용.

### 6.2 `.changsal-band` — 井자 격자 띠

가로 2획 + 세로 2획의 정확한 우물 정자 패턴 (40×30 px 타일).

```css
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
```

**모드별 stroke:** Light는 단청황(#C49A3F), Dark는 한지 크림(#FFF6E5 — `--foreground` 토큰과 일치). SVG inline data URL에서 CSS 변수를 못 쓰므로 두 개의 데이터 URL을 클래스로 분기. CSS 길이 ~600자 추가는 수용.

### 6.3 `.ink-bleed` — 잉크 번짐

거대 ㅎ에 적용. 미세 blur + 두 겹 text-shadow로 한지 위 먹 번짐 흉내:

```css
.ink-bleed {
  filter: blur(0.6px);
  text-shadow:
    0 0 1px rgba(196, 154, 63, 0.4),
    2px 2px 0 rgba(196, 154, 63, 0.15);
}
```

### 6.4 `.cosmic-bg` — 모드 적응 리팩토링

CSS 변수로 모드별 자동 적응:

```css
:root {
  --bg-from: var(--color-hanji);
  --bg-via:  #F5EFE0;
  --bg-to:   var(--color-baekja);
}
.dark {
  --bg-from: var(--color-cosmic-navy);
  --bg-via:  var(--color-cosmic-mid);
  --bg-to:   var(--color-cosmic-light);
}
.cosmic-bg {
  background: linear-gradient(135deg,
    var(--bg-from) 0%, var(--bg-via) 55%, var(--bg-to) 100%);
}
```

Light는 그라데이션이 거의 안 보이는 따뜻한 베이지 톤 → 한지 위에 잘 어울림. Dark는 기존 Cosmic 그라데이션 유지.

### 6.5 기존 유틸리티 처리

| 클래스 | 처리 |
|--------|------|
| `.hanja` | `color: var(--accent)`로 시맨틱화. 두 모드 자동 적응 |
| `.hangul` | 변경 없음. `var(--font-hangul)` 그대로 |
| `.cosmic-card-bg` | 제거 (랜딩 카드는 단순 `bg-card` 사용, 그라데이션 카드 배경 없음) |
| `.cosmic-stars::before` | 제거 (한지 라이트와 부조화. 결과 카드 v2 spec에서 재도입 검토) |

---

## 7. 테마 인프라

### 7.1 `next-themes` 설치

```bash
npm install next-themes
```

~5kb, peer-dependency 없음. React 19 / Next.js 16 호환성은 설치 직후 `npm run build`로 즉시 검증.

### 7.2 `src/app/layout.tsx` 수정

```tsx
import { ThemeProvider } from "next-themes";
import { Geist, Inter, Gowun_Batang, Yeon_Sung } from "next/font/google";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const gowunBatang = Gowun_Batang({ variable: "--font-gowun-batang", weight: ["400", "700"], subsets: ["latin"] });
const yeonSung = Yeon_Sung({ variable: "--font-yeon-sung", weight: "400", subsets: ["latin"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} antialiased bg-background text-foreground font-sans`}>
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

핵심:
- `<html className="dark">` 강제 제거 → 빈 `<html>`
- 4개 폰트 변수가 body에 노출되어 globals.css `@theme inline`에서 참조 가능
- `enableSystem={false}` — 첫 방문 보장 Light, OS 무시
- `disableTransitionOnChange` — 모드 전환 시 FOUC 방지

### 7.3 `ThemeToggle` 컴포넌트

`src/components/ui/theme-toggle.tsx`:

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
    return <Button size="icon" variant="ghost" disabled aria-label="Loading theme toggle" />;
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

`mounted` 가드는 SSR/CSR 미스매치 깜빡임 방지 — `next-themes`의 표준 패턴.

---

## 8. 랜딩 페이지 재구성

`src/app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="hanji-paper cosmic-bg min-h-screen relative overflow-hidden">
      {/* 페이지 상단 창살 */}
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      {/* 우상단 테마 토글 (창살 아래) */}
      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 거대 ㅎ — 우측하단 배경 (Dark에서는 코스믹 위 잡음 줄이려 opacity 낮춤) */}
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

          {/* Hero 카드 — 상하 창살 */}
          <Card className="relative overflow-hidden border-border mt-8 py-6">
            {/* 카드 상단 창살 — 절대 위치, 콘텐츠 위에 띠 */}
            <div className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10" style={{ backgroundSize: "40px 18px" }} />
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
            <div className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10" style={{ backgroundSize: "40px 18px" }} />
          </Card>
        </div>
      </div>

      {/* 페이지 하단 창살 */}
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

### 8.1 시맨틱화 (하드코딩 hex 제거)

| 이전 | 이후 | 이유 |
|------|------|------|
| `from-[#FFF6E5] to-[#F4C95D]` | `from-primary to-accent` | 두 모드 자동 적응 |
| `text-[#FF4D8D]` | `text-primary` | 핑크 시맨틱 |
| `border-white/10` | `border-border` | 모드 적응 보더 |
| `cosmic-card-bg` | 제거 | 카드는 단순 `bg-card` (`<Card>` 기본) |

### 8.2 z-index 레이어

- z-0 : 거대 ㅎ (배경)
- z-10: hero 콘텐츠
- z-40: 페이지 상하 창살 (콘텐츠 위, 토글 아래)
- z-50: 토글

---

## 9. 검증

### 9.1 수동 검증 시나리오

`npm run dev` 후 `http://localhost:3001`:

1. **첫 방문 (localStorage 비어있음)** → Light 한지 모드. `<html>` 클래스 없음
2. **토글 클릭** → Dark, `<html class="dark">`. FOUC 없음
3. **F5 새로고침** → Dark 유지. `localStorage.theme === "dark"`
4. **시크릿 창** → Light 기본
5. **DevTools Computed style** — 각 요소의 font-family 확인:
   - 거대 ㅎ: Yeon Sung (`.font-calli`)
   - "사 주" (`.hanja`): Gowun Batang
   - "Saju, but make it K." (`.font-serif italic`): Gowun Batang
   - "KSaju" 브랜드 헤더 (그라데이션 텍스트, 그래도 폰트는 적용): Geist (`.font-display` 또는 `--font-display`)
   - 영문 본문/버튼: Inter (`font-sans`)
   - Pretendard는 이번 페이지에 사용처 없음 — 향후 한글 본문 컴포넌트에서 `.hangul` 또는 `font-hangul` 적용 시 검증
6. **Network 탭** — Google Fonts 4종(Geist, Inter, Gowun Batang, Yeon Sung) + Pretendard CDN 다운로드
7. **WCAG AA** — Lighthouse 접근성, 본문 대비비 ≥ 4.5:1
   - Light: 묵 #1A1A2E on 한지 #FBF6E8 ≈ 14:1 ✓
   - Dark: 한지 크림 on 코스믹 ≈ 16:1 ✓
8. **시각 확인** — 페이지 상하·hero card 상하 井 격자(가로 2획+세로 2획), 한지 결 미세 노이즈, 거대 ㅎ 우측하단

### 9.2 빌드/회귀

- `npm run build` 통과
- shadcn `<Button>`, `<Card>`가 새 토큰 자동 적용 (시맨틱 `--primary` 등 그대로)
- 기존 `.hanja` 클래스가 시맨틱화로 두 모드 자동 적응
- 기존 페이지의 그라데이션 텍스트(`from-primary to-accent`)가 모드별 색 자동 적응

### 9.3 FOUC 검증

- DevTools Network → Slow 3G throttle → F5
- `next-themes` 인라인 `<script>`가 hydration 전 `<html>`에 클래스 부여
- 첫 페인트에 "Light → Dark" 또는 "Dark → Light" 깜빡임 없음

---

## 10. 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| `next-themes` × Next.js 16 / React 19 비호환 | 빌드 실패 | 설치 후 즉시 `npm run build`. 비호환 시 직접 구현 (~5kb, Context + useEffect) |
| Yeon Sung 폰트 로드 전 fallback ㅎ 깜빡임 | 첫 페인트 cursive vs Pretendard | next/font/google `display: swap` + ㅎ는 opacity 0.55 — 시각적 영향 작음 |
| 한지 noise SVG data URL 인라인 길이 | globals.css 비대화 (~500자/패턴) | SVG inline은 변수 무력 → 그대로 수용. 코멘트로 가독성 보강 |
| `--font-serif: Gowun Batang`이 영어 본문에 적용되면 어색 | 영문 자체엔 Georgia fallback이 자연 | `--font-serif: var(--font-gowun-batang), Georgia, serif` fallback chain 명시 |
| Dark에서 ㅎ opacity 0.35로도 코스믹 위 식별 안 됨 | 핵심 비주얼 자산 약화 | 출시 후 실측 — 필요 시 0.45까지 상향. 명세에서는 0.35로 시작 |
| 거대 ㅎ `text-[32rem]`이 모바일에서 viewport 넘침 | 가로 스크롤 | `<main>`에 `overflow-hidden`. 모바일 반응형은 후속 spec |
| 창살 stroke-width 1px이 retina에서 흐림 | 디테일 손실 | mockup 검증 후 필요 시 1.5px로 조정 |
| Light secondary(#F5EFE0)와 muted 동일 — 시각 구분 약함 | 카드/secondary 버튼 식별 약화 | 출시 전 디자인 리뷰에서 조정 가능. 일단 출시 |
| 4개 신규 Google Fonts 로드로 LCP 영향 | 첫 페인트 지연 | next/font/google이 self-host로 변환·preload 자동. LCP 임팩트 작음. 실측 후 필요 시 weight 축소 |

---

## 11. 마이그레이션 / 롤백

- **마이그레이션:** 기존 사용자 없음 (사이드 프로젝트, 출시 전) — 신규 사용자만 영향
- **롤백:** `git revert` 한 번에 복원. `next-themes` 제거, globals.css 복원, layout.tsx와 page.tsx 이전 버전으로

---

## 12. 후속 작업 (이번 spec 범위 외)

- **결과 카드 v2** — 창호지 + 창살 프레임의 사주 결과 카드 (별도 spec, 사주 결과 페이지 흐름과 함께)
- **사주 결과 페이지** — 생년월일 입력 → 결과 표시 흐름
- **14자음 그리드** 또는 **사이드 자음 스크롤** — ㅎ 단일 비주얼의 변형
- **모바일 viewport 반응형** — ㅎ 크기 반응형, 창살 띠 모바일 조정
- **OS `prefers-color-scheme` 자동 감지** — `enableSystem={true}` 옵션
- **모드별 OG 이미지·favicon** — 메타데이터 확장
- **`.cosmic-stars` 재도입 검토** — Dark 모드 한정 별 패턴, 결과 카드에서 사용 가능
- **`--color-cheongja` 활용** — 정보 카드, secondary 배지, 링크 hover

---

## 13. 영향받는 파일

| 파일 | 변경 종류 |
|------|----------|
| `package.json` | `next-themes` 추가 |
| `src/app/globals.css` | 전면 재작성 — 토큰·@theme·유틸리티 모두 |
| `src/app/layout.tsx` | 폰트 4개 + ThemeProvider 통합 |
| `src/app/page.tsx` | 랜딩 페이지 재구성 (한지·창살·ㅎ·시맨틱 토큰) |
| `src/components/ui/theme-toggle.tsx` | 신규 |
