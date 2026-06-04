# 멀티페이지 골격 + 내비 (사이클 11) — 설계 문서

> 작성일: 2026-06-04 · 상태: 승인됨 (브레인스토밍 통과)
> 로드맵: CLAUDE.md step 11 (= task-log 사이클 번호로는 "사이클 10". 두 문서 번호 어긋남 → 본 사이클을 **"사이클 11(멀티페이지 골격)"**으로 통일 표기하고, 구현 완료 시 task-log/CLAUDE.md 번호를 맞춘다.)

## 한 줄 요약

단일 라우트(`/`)를 **`/`(내 사주)와 `/inyeon`(인연)** 두 라우트로 분리한다. 공유 chrome(한지 배경·창살·ㅎ·테마토글)과 **상단 슬림 헤더 + 네비**를 루트 레이아웃으로 추출해 두 페이지가 공유한다. `/inyeon`은 이번엔 **'Coming soon' 플레이스홀더**. 궁합 콘텐츠 이전·일반 상대 궁합은 다음 사이클.

## 원칙

- **순수 골격.** 라우팅 분리 + 공유 chrome 추출 + 네비까지만. 기능 이전 없음.
- DRY: chrome는 단일 출처(루트 레이아웃). 페이지는 콘텐츠만 책임.
- 기존 한지 디자인 토큰·동작 보존(시각 회귀 없음).

## 범위

### 포함
1. `src/app/layout.tsx` (수정) — 공유 chrome 셸: `hanji-paper` main + 상/하단 창살 띠 + 거대 ㅎ + `<SiteHeader/>` + `{children}` 래퍼.
2. `src/components/layout/site-header.tsx` (신규, `"use client"`) — 로고(→`/`) + 네비(My Saju `/`, Inyeon `/inyeon`) + ThemeToggle. `usePathname()` 활성 표시.
3. `src/app/page.tsx` (수정) — chrome 제거(레이아웃이 담당), 홈 콘텐츠(히어로 + Card 폼↔결과)만 유지. `"use client"` 유지.
4. `src/app/inyeon/page.tsx` (신규) — 한지 Card 'Coming soon' 플레이스홀더.
5. 테스트: `site-header.test.tsx`(RTL/happy-dom), `/inyeon` 플레이스홀더 렌더 테스트.

### 비포함 (이번 제외)
- 궁합(CompatibilitySection)의 `/inyeon` 이전 — **사이클 12**. 이번엔 `/`에 인라인 유지.
- 일반 상대 궁합(상대 생일 입력) — 사이클 12.
- 크로스 페이지 상태 공유(/inyeon이 사용자 사주 재사용) — 사이클 12 결정. 본 골격은 미구현(아래 "향후 고려").
- 이미지 export — 사이클 13.

## 라우트 구조

```
src/app/
  layout.tsx          (수정) 공유 chrome + SiteHeader + children
  page.tsx            (수정) 홈: 히어로 + Card (폼↔결과, Fortune·Compat 인라인 그대로)
  inyeon/
    page.tsx          (신규) 'Coming soon' 플레이스홀더
```

라우트 그룹(접근법 C)은 도입하지 않는다. 향후 chrome 없는 라우트(예: 사이클 13 export 캔버스)가 필요해지면 그때 `(site)` 그룹으로 분리.

## 컴포넌트 설계

### `src/components/layout/site-header.tsx` (`"use client"`)
- props 없음.
- 구조: `<header>` (sticky/상단, 한지 톤, 하단 경계선) 안에
  - 좌: `<Link href="/">` 로고 — "KSaju" (font-display) + "사주"(hanja, 작게). 홈 이동.
  - 우: `<nav>` — `<Link href="/">My Saju</Link>`, `<Link href="/inyeon">Inyeon</Link>` + `<ThemeToggle/>`.
- 활성 표시: `const pathname = usePathname();` → 현재 경로와 일치하는 링크에 `text-primary font-semibold`(+ 언더라인), 비활성은 `text-muted-foreground`. `/`는 정확히 `pathname === "/"`, `/inyeon`은 `pathname === "/inyeon"`(또는 `startsWith`).
- 디자인 토큰: `border-border`, `text-primary`, `text-muted-foreground`, `font-display`. 모바일에서도 한 줄 슬림 유지(로고 축약 없이 텍스트 작게).
- 접근성: `<nav aria-label="Main">`, 활성 링크 `aria-current="page"`.

### `src/app/layout.tsx` (수정)
- 기존 폰트/메타데이터/ThemeProvider 유지.
- `<body>` → `<ThemeProvider>` 내부를 다음 셸로 구성(현재 `{children}` 자리):
  ```
  <main className="hanji-paper min-h-screen relative overflow-hidden">
    <div className="changsal-band absolute top-0 left-0 right-0 z-40" />
    <span className="font-calli ink-bleed absolute ... ㅎ ... pointer-events-none z-0" aria-hidden>ㅎ</span>
    <SiteHeader />
    <div className="relative z-10">{children}</div>
    <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
  </main>
  ```
- 창살 띠·ㅎ는 `page.tsx`에서 이 위치로 이동(정적이라 서버 렌더 가능). 기존 top-right 절대배치 테마토글은 제거(헤더로 이동).
- ㅎ의 z-index/위치는 기존값 보존(모바일 `z-30 sm:z-0` 등). 헤더가 ㅎ 위에 오도록 z 정리.

### `src/app/page.tsx` (수정)
- chrome(`<main hanji-paper>`, 창살, ㅎ, 절대배치 토글) 제거 → 레이아웃 담당.
- 남기는 것: 페이지 콘텐츠 컨테이너(`relative z-10 flex ... min-h-screen py-14 px-8` 중 레이아웃과 중복되는 min-h/배경은 조정) + 히어로(`KSaju`/`사 주`/`Saju, but make it K.`) + `<Card>` 폼↔결과 상태머신(기존 `view`/`userSaju`/`kst`/`currentLuck`/`submitting`/`errorMessage`, FortuneSection·CompatibilitySection 인라인 그대로).
- `"use client"` 유지(useState/useSyncExternalStore 사용).

### `src/app/inyeon/page.tsx` (신규)
- 정적(서버 컴포넌트 가능). 한지 `<Card>` 안에:
  - 제목 "Inyeon · 인연"
  - 본문 "K-pop bias & partner compatibility — coming soon ✨"
  - "For entertainment 🌙" 톤 라인
- 홈과 동일한 콘텐츠 컨테이너 폭/패딩 사용.

## 테스트

`src/components/layout/site-header.test.tsx` (RTL/happy-dom):
- `next/navigation`의 `usePathname` 모킹(`vi.mock("next/navigation", () => ({ usePathname: () => "/" }))` 등).
- 로고 + "My Saju" + "Inyeon" 링크 렌더 확인(href 검증).
- pathname="/inyeon" 케이스에서 Inyeon 링크가 `aria-current="page"`인지 확인.

`src/app/inyeon/page.test.tsx` (RTL/happy-dom) 또는 간단 렌더:
- 플레이스홀더 텍스트("coming soon") 렌더 확인.

홈: 기존 동작 보존 — page는 `next build` + 수동 시각 검증. 기존 `saju-result.test.tsx` 등 전체 그린 유지.

## 검증

- `npm test`(전체 그린), `tsc`/`eslint`(기존 경고만), `next build`(두 라우트 생성: `/`, `/inyeon`. 가능하면 정적).
- 수동 시각: `/`와 `/inyeon` 간 네비 이동, 활성 표시, 테마토글, 한지/창살/ㅎ 두 페이지 모두 표시, 모바일.

## 향후 고려 (이번 미구현, 사이클 12에 영향)

- **크로스 페이지 상태:** `/inyeon`(사이클 12)에서 궁합 계산 시 사용자 사주가 필요. 라우트 전환 시 `/`의 React 상태는 소실됨. 대안(사이클 12에서 결정): (a) `localStorage`에 birth/saju 영속, (b) 레이아웃에 client Context Provider로 공유, (c) `/inyeon`에서 생일 재입력. 본 골격은 (b)를 채택할 경우의 자리(레이아웃)만 인지하고 미구현.

## 구현 시 확인

- **Next.js 16 라우팅 규약**: 구현 전 `node_modules/next/dist/docs`에서 App Router 파일 라우팅·`next/link`·`usePathname`·layout/metadata 변경점 확인(AGENTS.md "This is NOT the Next.js you know").
- 레이아웃이 client 컴포넌트(SiteHeader)를 포함해도 루트 layout 자체는 서버 컴포넌트 유지(정적 배경 서버 렌더). page들의 static 생성 가능 여부 빌드로 확인.

## 재사용 자산

- `ThemeToggle`(`src/components/ui/theme-toggle.tsx`) — 헤더로 이동.
- 한지 유틸 클래스(`hanji-paper`/`changsal-band`/`font-calli`/`ink-bleed`) — globals.css 기존.
- Card/디자인 토큰 — 플레이스홀더·홈 공통.
