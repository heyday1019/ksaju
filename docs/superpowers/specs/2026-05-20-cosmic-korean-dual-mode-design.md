# Cosmic Korean — 듀얼 모드 (Light/Dark) 디자인 시스템 설계서

- **작성일:** 2026-05-20
- **상태:** 설계 승인 대기
- **선행 명세:** `2026-05-20-cosmic-korean-font-system-design.md` (폰트 시스템 — 완료)
- **TDD:** 미적용 (시각적 변경, 자동 테스트 가치 낮음)

---

## 1. 컨텍스트

폰트 시스템 수정 완료 후 사용자가 시각적 검증 단계에서 **"전체 디자인이 어두워 메인 중앙 문구가 잘 안 보인다"**고 보고. 원인 분석:

- 현재 팔레트는 단일 다크(Cosmic Korean)로, 라이트 옵션 없음.
- 배경 그라데이션 `#0F0828 → #1F0F40 → #2D1454`이 매우 어두워 일부 텍스트(특히 핑크 italic 문구)의 명도 대비가 WCAG AA 임계점에 근접.
- 사용자의 작업 환경(밝은 실내, 외부광 등)에 따라 가독성 격차 큼.

원래 Phase 1 명세에서 "다크 모드 우선, light 불필요"였으나, 이번 보고로 **그 제약이 폐기되고 듀얼 모드로 확장**됨.

### 1.1 설계 결정 (브레인스토밍 결과)

| 항목 | 결정 |
|------|------|
| 모드 | Light + Dark 듀얼 |
| 다크 팔레트 | 기존 Cosmic Korean 그대로 |
| 라이트 팔레트 | Hanji Cream 기반 (브랜드 일관성) |
| 전환 메커니즘 | 수동 토글 버튼 + localStorage |
| 기본 모드 (첫 방문) | Light |
| 구현 라이브러리 | `next-themes` (SSR hydration 안전) |
| Hero 그라데이션 | `from-primary to-accent` (두 모드 공통) |

---

## 2. 목표

1. 사용자가 명시적으로 토글 버튼을 클릭하여 Light ↔ Dark 모드를 전환할 수 있다.
2. 선택은 localStorage에 보존되어 새로고침·재방문 시 유지된다.
3. 첫 방문 시 기본은 Light 모드.
4. 모든 컴포넌트(shadcn Button·Card 등)와 페이지가 양쪽 모드에서 일관된 브랜드 정체성을 유지한다 — Saju Pink·Korean Gold 액센트는 양 모드 공통, 배경·전경만 반전.
5. **모드 전환 시 페이지 깜빡임(FOUC) 없음.**
6. 양 모드 모두에서 본문 텍스트의 WCAG AA 대비비(4.5:1) 충족.

### 2.1 비목표 (Out of Scope)

- OS `prefers-color-scheme` 자동 감지 (수동 토글만)
- 모드별 다른 폰트 또는 폰트 가중치 변경
- 애니메이션·트랜지션 정교화 (단순 색상 전환만)
- 추가 테마 (sepia, high-contrast 등)
- 토글 버튼의 키보드 단축키 또는 시스템 트레이 통합
- 기존 색상 토큰의 이름 변경 (`--background`, `--foreground` 등 기존 명명 유지)

---

## 3. 설계

### 3.1 팔레트 매핑

shadcn 컨벤션을 따라 `:root`가 Light, `.dark`가 Dark.

#### 3.1.1 Dark 팔레트 (기존 Cosmic Korean, 변경 없음)

```css
.dark {
  --background: #0F0828;
  --foreground: #FFF6E5;
  --card: #1A0B3A;
  --card-foreground: #FFF6E5;
  --popover: #1F0F40;
  --popover-foreground: #FFF6E5;
  --primary: #FF4D8D;
  --primary-foreground: #FFF6E5;
  --secondary: #1F0F40;
  --secondary-foreground: #FFF6E5;
  --muted: #2D1454;
  --muted-foreground: rgba(255, 246, 229, 0.65);
  --accent: #F4C95D;
  --accent-foreground: #0F0828;
  --destructive: #C84B30;
  --destructive-foreground: #FFF6E5;
  --border: rgba(255, 246, 229, 0.12);
  --input: rgba(255, 246, 229, 0.08);
  --ring: #FF4D8D;
}
```

#### 3.1.2 Light 팔레트 (신규, Hanji Cream 기반)

```css
:root {
  --background: #FFF6E5;          /* Hanji Cream */
  --foreground: #0F0828;          /* Cosmic Navy */
  --card: #FFFFFF;
  --card-foreground: #0F0828;
  --popover: #FFFFFF;
  --popover-foreground: #0F0828;
  --primary: #FF4D8D;             /* Saju Pink — 공통 */
  --primary-foreground: #FFF6E5;  /* 핑크 위 크림 (대비 강함) */
  --secondary: #FBE9CC;           /* 따뜻한 크림 */
  --secondary-foreground: #0F0828;
  --muted: #F5E3C0;
  --muted-foreground: rgba(15, 8, 40, 0.65);
  --accent: #F4C95D;              /* Korean Gold — 공통 */
  --accent-foreground: #0F0828;
  --destructive: #C84B30;
  --destructive-foreground: #FFF6E5;
  --border: rgba(15, 8, 40, 0.12);
  --input: rgba(15, 8, 40, 0.08);
  --ring: #FF4D8D;
}
```

**브랜드 일관성:** `--primary`(Saju Pink)와 `--accent`(Korean Gold)는 두 모드에서 동일. 배경·전경만 반전되어 한지의 따뜻함이 Light, 코스믹 밤이 Dark.

### 3.2 배경 그라데이션 (`cosmic-bg`) 모드 적응

현재 `.cosmic-bg`는 다크 전용 하드코딩. 모드별 자동 적응을 위해 CSS 변수로 추출:

```css
:root {
  --bg-gradient-from: #FFF6E5;
  --bg-gradient-via: #FBE9CC;
  --bg-gradient-to: #F5E3C0;
}

.dark {
  --bg-gradient-from: #0F0828;
  --bg-gradient-via: #1F0F40;
  --bg-gradient-to: #2D1454;
}

.cosmic-bg {
  background: linear-gradient(135deg,
    var(--bg-gradient-from) 0%,
    var(--bg-gradient-via) 55%,
    var(--bg-gradient-to) 100%);
}
```

`.cosmic-card-bg`도 같은 패턴:

```css
:root {
  --card-gradient-from: #FFFFFF;
  --card-gradient-via: #FBE9CC;
  --card-gradient-to: #FFF6E5;
}

.dark {
  --card-gradient-from: #0F0828;
  --card-gradient-via: #2D1454;
  --card-gradient-to: #1A0B3A;
}

.cosmic-card-bg {
  background: linear-gradient(165deg,
    var(--card-gradient-from) 0%,
    var(--card-gradient-via) 50%,
    var(--card-gradient-to) 100%);
}
```

`.cosmic-stars`는 Section 3.5에서 별도 처리.

### 3.3 테마 전환 아키텍처 — `next-themes`

#### 3.3.1 라이브러리

`npm install next-themes` (~5kb, peer-dependency 없음).

#### 3.3.2 `src/app/layout.tsx` 수정

```tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${inter.variable} antialiased bg-background text-foreground font-sans`}>
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

핵심 변경 vs 현재:
- `<html className="dark">` → `<html>` (다크 강제 제거)
- `<body>`는 기존 className 그대로 유지 — `bg-background text-foreground`는 CSS 변수 참조이므로 자동으로 모드 따라 전환
- `<ThemeProvider>`로 children 감싸기

핵심 props:
- `attribute="class"` — `<html>`에 `.dark` 클래스 토글 (shadcn 컨벤션)
- `defaultTheme="light"` — 첫 방문 라이트
- `enableSystem={false}` — OS 설정 무시 (수동 전용)
- `disableTransitionOnChange` — 전환 시 모든 CSS transition 일시 중지하여 깜빡임 방지

`suppressHydrationWarning`은 그대로 — `next-themes`가 클라이언트 hydration 전에 클래스를 적용하기 때문에 React가 경고할 수 있음. 이 prop으로 해소.

#### 3.3.3 ThemeToggle 컴포넌트 (신규)

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
    // SSR 동안 빈 자리만 차지 — 깜빡임·hydration 미스매치 방지
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

**책임:** 현재 테마 표시·전환만. localStorage 처리는 `next-themes`가 알아서.

**`mounted` 가드:** SSR에서는 서버가 테마를 모르므로 disabled placeholder를 렌더링. 클라이언트 hydration 후 실제 아이콘으로 교체. 이게 깜빡임의 마지막 한 톨까지 제거.

#### 3.3.4 토글 배치 — `src/app/page.tsx` 우상단

```tsx
<main className="cosmic-bg min-h-screen flex flex-col items-center justify-center p-8 relative">
  <div className="absolute top-4 right-4">
    <ThemeToggle />
  </div>
  {/* 기존 콘텐츠 */}
</main>
```

향후 헤더 레이아웃 도입 시 헤더 우측으로 이동. 지금은 절대 위치로 충분.

### 3.4 `page.tsx`의 하드코딩 hex 시맨틱화

현재 코드는 모드 전환을 무력화하는 하드코딩 hex를 보유. 시맨틱 토큰으로 교체:

| 현재 | 변경 후 | 이유 |
|------|---------|------|
| `from-[#FFF6E5] to-[#F4C95D]` | `from-primary to-accent` | Hero 그라데이션 — 두 모드 공통 |
| `text-[#FF4D8D]` (italic) | `text-primary` | 핑크 시맨틱 |
| `border-white/10` | `border-border` | 모드 적응 보더 |

`hanja` 클래스는 globals.css에서 `color: var(--color-korean-gold);`로 정의되어 있어 두 모드 공통. 변경 불필요.

`cosmic-card-bg`는 Section 3.2처럼 CSS 변수화. 라이트 모드에서는 카드 배경이 흰색~연한 크림 그라데이션.

### 3.5 별 패턴 (`cosmic-stars`) — Light에서 처리

`.cosmic-stars::before`는 어두운 배경 위 별빛이 보이는 효과. Light 모드에서는 거의 안 보이므로:

```css
.cosmic-stars::before {
  content: "";
  /* ... */
  opacity: var(--stars-opacity, 1);
}

:root { --stars-opacity: 0; }
.dark { --stars-opacity: 1; }
```

Light에서는 별 자체가 숨겨짐. 이게 의도된 동작 — Light는 한지·낮의 분위기, 별은 부적합.

---

## 4. 검증

### 4.1 기능 검증 (수동)

`npm run dev` 후 `http://localhost:3001`에서:

1. **첫 방문 (localStorage 비어있음):** 페이지가 Light 모드로 로드. Hanji Cream 배경, Navy 텍스트.
2. **토글 클릭 1회:** Dark 모드로 전환. Cosmic Navy 배경. 페이지 깜빡임·colour flash 없음.
3. **새로고침 (F5):** Dark 유지. localStorage에 `theme=dark` 저장 확인 (DevTools Application 탭).
4. **다시 토글 클릭:** Light로 복귀.
5. **시크릿 창에서 새로 열기:** localStorage 없으므로 Light 기본.
6. **DevTools에서 `<html>` 검사:** Light 모드일 때 `<html>`에 `.dark` 클래스 없음. Dark 모드일 때 `<html class="dark">`.
7. **컴포넌트 일관성:** Button(`bg-primary`), Card(`bg-card`), muted text 모두 모드 따라 자동 전환.
8. **WCAG AA 대비비:** DevTools Lighthouse 접근성 검사. 본문 텍스트 ≥ 4.5:1.

### 4.2 회귀 확인

- `npm run build` 성공.
- Pretendard/Inter 적용 여부 영향 없음 (폰트 시스템과 독립).
- 모드 전환 시 `cosmic-bg`, `cosmic-card-bg`, hero 그라데이션 모두 자연스럽게 갱신.

### 4.3 FOUC 검증 (핵심)

- 새로고침 시 첫 페인트가 "다크 → 라이트" 또는 "라이트 → 다크"로 깜빡이지 않는다.
- 검증: DevTools Network 탭에서 Slow 3G로 throttle 후 새로고침. `next-themes`의 `<script>` 인젝션이 hydration 전 적용되는지 확인.

---

## 5. 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| Hydration mismatch 경고 | 콘솔 노이즈, 잠재적 깜빡임 | `suppressHydrationWarning` + `ThemeToggle`의 `mounted` 가드. `next-themes`가 대부분 처리. |
| `cosmic-stars`의 별 색상이 Light에서도 부분적으로 보임 | 시각적 잡음 | `--stars-opacity` 변수로 Light에서 0으로 설정 (Section 3.5). |
| `cosmic-card-bg`의 어두운 그라데이션이 Light 모드에 부적합 | 시각적 부조화 | Section 3.2와 동일하게 CSS 변수화. |
| 사용자가 토글 버튼을 못 찾음 | UX 마찰 | 우상단(국제 표준 위치) + `aria-label` 명시. 향후 헤더 도입 시 이동. |
| Light 모드의 `--muted` (#F5E3C0)와 `--secondary` (#FBE9CC) 구분이 미미 | 카드·secondary 버튼 식별 약화 | 출시 전 디자인 검증에서 조정 가능. 일단 출시. |
| `next-themes`가 React 19/Next.js 16과 비호환 | 빌드 실패 | 설치 후 `npm run build` 우선 검증. 비호환 시 직접 구현(접근법 B)로 전환. |

---

## 6. 마이그레이션·롤백

- **롤백:** 단순 `git revert` (또는 reset). `next-themes` 패키지 제거. `:root`를 다시 Dark 값으로 복원. 일관된 단일 다크 모드로 되돌아감.
- **마이그레이션:** 기존 사용자는 없음 (사이드 프로젝트, 출시 전). 신규 사용자만 영향.

---

## 7. 후속 작업 (이번 명세 범위 외)

- 헤더 컴포넌트 도입 시 ThemeToggle을 헤더로 이동
- OS `prefers-color-scheme` 자동 감지 옵션 추가 (`next-themes`의 `enableSystem={true}`)
- 모드 전환 시 부드러운 트랜지션 (현재는 `disableTransitionOnChange`로 의도적 차단)
- Light 모드 `--muted` / `--secondary` 미세 조정 (출시 전 디자인 리뷰)
- 모드별 OG 이미지·favicon (메타데이터 확장)
- Tailwind v4의 `@media (prefers-reduced-motion)` 대응
