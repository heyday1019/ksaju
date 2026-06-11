# KSaju Phase 2: 글로벌 멀티랭귀지 인프라 설계

**날짜:** 2026-06-12  
**상태:** 승인됨  
**범위:** Phase 2 (EN·JA·KO·ZH-TW 4개 locale) — 코어 플로우(`/`, `/inyeon`) + Fortune + Daily Fortune

---

## 1. 목표 및 포지셔닝

일본어 출시를 발판으로 글로벌 멀티랭귀지 인프라 구축. 타겟: 영어권(EN) + 일본(JA) + 한국(KO) + 대만(ZH-TW) K-pop 팬.

**비범위(Phase 3):** Trust 페이지 번역, readings.json locale 분리, hreflang SEO.

---

## 2. 확정된 결정 사항

| 항목 | 결정 |
|------|------|
| 언어 | EN(기본) · JA · KO · ZH-TW |
| URL 구조 | Sub-path, `localePrefix: 'as-needed'` — `/`=EN, `/ja/` `/ko/` `/zh-TW/` |
| 구현 방식 | next-intl v4 (이미 설치됨) |
| 언어 전환 | 헤더 수동 스위처 (자동 감지·리디렉션 없음) |
| Phase 2 번역 대상 | 코어 플로우 UI + Fortune + Daily Fortune LLM |
| Phase 3 번역 대상 | Trust 페이지, readings.json |
| fun 리딩(readings.json) | Phase 2 EN 유지 |

---

## 3. 파일 구조 (목표 상태)

### 3-1. App Router 레이아웃 분리

Trust 페이지는 Phase 3까지 root에 유지. Route group `(static)`으로 chrome을 제공.

```
src/app/
├── layout.tsx                    ← 슬림화: html/body + 폰트 + Analytics/SpeedInsights
│                                   getLocale()로 lang 속성 동적 설정
├── [locale]/
│   ├── layout.tsx                ← NextIntlClientProvider + <AppChrome>
│   ├── page.tsx                  ← MOVED (from app/page.tsx)
│   └── inyeon/
│       └── page.tsx              ← MOVED (from app/inyeon/page.tsx)
├── (static)/                     ← route group (URL 무영향)
│   ├── layout.tsx                ← ThemeProvider + <AppChrome> (intl 없음)
│   ├── about/page.tsx            ← 그대로
│   ├── faq/page.tsx              ← 그대로
│   ├── privacy/page.tsx          ← 그대로
│   └── terms/page.tsx            ← 그대로
├── admin/page.tsx                ← 그대로 (locale 미적용)
├── api/daily-fortune/route.ts    ← ?locale= 파라미터 추가
├── actions/saju.ts               ← 그대로
├── opengraph-image.tsx           ← 그대로
├── robots.ts                     ← 그대로
└── sitemap.ts                    ← 업데이트: 4 locale × 코어 URL
```

### 3-2. 신규 i18n 설정 파일

```
src/i18n/
├── routing.ts      ← locales, defaultLocale, localePrefix
├── request.ts      ← getRequestConfig (messages 로드)
└── navigation.ts   ← locale-aware Link/usePathname/useRouter export

src/messages/
├── en.json
├── ja.json
├── ko.json
└── zh-TW.json
```

### 3-3. AppChrome 공유 컴포넌트

두 layout(`[locale]/layout.tsx`, `(static)/layout.tsx`)이 공유하는 chrome 래퍼.

```
src/components/layout/
├── app-chrome.tsx       ← NEW: ThemeProvider + hanji-paper + 창살/ㅎ + flex 컬럼
├── site-header.tsx      ← 수정: labels prop 추가
├── site-footer.tsx      ← 수정: useTranslations (locale layout 안에서만)
└── locale-switcher.tsx  ← NEW: 글로브 드롭다운
```

---

## 4. i18n 설정 상세

### 4-1. routing.ts

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ja', 'ko', 'zh-TW'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});

export type Locale = (typeof routing.locales)[number];
```

### 4-2. request.ts

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### 4-3. navigation.ts

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### 4-4. next.config.ts 변경

```ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl(nextConfig);
```

### 4-5. Middleware 병합

기존 admin auth + next-intl을 하나의 middleware로 통합.

```ts
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intl = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminAuth(request);   // 기존 로직 함수로 추출
  }
  return intl(request);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/((?!api|_next|.*\\..*).*)']
};
```

---

## 5. Layout 상세

### 5-1. Root layout (슬림화)

- `getLocale()`로 `<html lang>` 동적 설정
- 폰트 CSS 변수 + antialiased 클래스
- `<Analytics />`, `<SpeedInsights />`
- ThemeProvider, SiteHeader, SiteFooter 제거 → `[locale]/layout.tsx`·`(static)/layout.tsx`로 이동

### 5-2. `[locale]/layout.tsx`

```tsx
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations('SiteHeader');
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppChrome headerLabels={{ mySaju: t('mySaju'), inyeon: t('inyeon') }}>
        {children}
      </AppChrome>
    </NextIntlClientProvider>
  );
}
```

### 5-3. `(static)/layout.tsx`

```tsx
export default function StaticLayout({ children }) {
  return (
    <AppChrome>
      {children}
    </AppChrome>
  );
  // AppChrome 내부 SiteHeader는 EN 기본값 사용 (LocaleSwitcher 미포함)
}
```

### 5-4. AppChrome

- `headerLabels?: { mySaju: string; inyeon: string }` prop
- 기존 root layout의 `<main className="hanji-paper">` + 창살 band + ㅎ + flex 컬럼 그대로 이전
- `<SiteHeader labels={headerLabels} />`
- `<AnalyticsProvider />`
- `<SiteFooter />`
- `(static)` 경우 `LocaleSwitcher` 미포함

---

## 6. SiteHeader 수정

```tsx
interface SiteHeaderProps {
  labels?: { mySaju: string; inyeon: string };
}
const DEFAULTS = { mySaju: 'My Saju', inyeon: 'Inyeon' };

export function SiteHeader({ labels = DEFAULTS }: SiteHeaderProps) {
  const pathname = usePathname();  // next-intl navigation (locale prefix 제거)
  // ...NAV 라벨을 labels prop에서 사용
  // LocaleSwitcher: locale layout에서만 렌더 (AppChrome showLocaleSwitcher prop)
}
```

`LocaleSwitcher`는 `[locale]/layout.tsx`를 통할 때만 표시. `AppChrome`에 `showLocaleSwitcher?: boolean` prop — `[locale]/layout.tsx`는 `true` 전달, `(static)/layout.tsx`는 기본값 `false` 사용.

**SiteHeader `usePathname` 호환성:** `(static)` 페이지는 `NextIntlClientProvider` 바깥이므로, SiteHeader의 `usePathname`은 Phase 2에서 `next/navigation`의 것을 유지. trust 페이지 URL에는 locale prefix가 없어 active 체크(`pathname.startsWith("/inyeon")`)가 정상 동작. `[locale]/` 라우트에서는 `@/i18n/navigation`의 `usePathname`(locale prefix 제거) 사용 필요 — SiteHeader를 두 context에서 모두 쓰려면 `next/navigation` 버전으로 통일해도 무방 (EN에서는 prefix 없으므로 동일 결과).

---

## 7. LocaleSwitcher

```tsx
// src/components/layout/locale-switcher.tsx
'use client';

const LOCALES = [
  { code: 'en', label: 'EN · English' },
  { code: 'ja', label: 'JA · 日本語' },
  { code: 'ko', label: 'KO · 한국어' },
  { code: 'zh-TW', label: 'ZH · 繁中' },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();      // from @/i18n/navigation
  const pathname = usePathname();  // from @/i18n/navigation (locale prefix 없는 경로)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-md p-1.5 text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Language</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => router.replace(pathname, { locale: code })}
            className={locale === code ? 'font-semibold text-primary' : ''}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 8. messages JSON 구조

`src/messages/en.json` 전체 key 목록:

```json
{
  "SiteHeader": {
    "mySaju": "My Saju",
    "inyeon": "Inyeon"
  },
  "SiteFooter": {
    "about": "About",
    "faq": "FAQ",
    "privacy": "Privacy",
    "terms": "Terms",
    "disclaimer": "For entertainment 🌙"
  },
  "LocaleSwitcher": {
    "label": "Language"
  },
  "BirthForm": {
    "title": "Enter your birthday",
    "dateLabel": "Birthday",
    "timeLabel": "Birth time (optional)",
    "timePlaceholder": "Not sure — skip it",
    "submit": "Read my saju →",
    "submitting": "Calculating..."
  },
  "SajuResult": {
    "dayMasterLabel": "Your Day Master",
    "pillarsTitle": "Your Four Pillars",
    "editButton": "Change birthday"
  },
  "Fortune": {
    "sectionTitle": "Your Fortune",
    "money": "Money",
    "love": "Love",
    "career": "Career",
    "thisYear": "This Year",
    "tiers": {
      "strong": "Strong",
      "some": "Some",
      "steady": "Steady",
      "none": "Quiet"
    },
    "shareButton": "Share ✨",
    "disclaimer": "For entertainment 🌙"
  },
  "DailyFortune": {
    "title": "Today's Fortune",
    "loading": "Reading the stars...",
    "shareButton": "Share ✨"
  },
  "Inyeon": {
    "title": "Inyeon · 인연",
    "idolSectionTitle": "K-pop Compatibility",
    "partnerSectionTitle": "Someone Special",
    "noSajuBanner": "Calculate your saju first →",
    "shareButton": "Share ✨"
  },
  "CompatibilityModal": {
    "viewAgain": "View result again ✨",
    "checkAnother": "Check another idol"
  },
  "Common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "tryAgain": "Try again"
  }
}
```

**번역 원칙:**
- 아이돌 이름·그룹명·한자·오행 단어는 번역 안 함 (공통 고유명사)
- fun 리딩(`data/ksaju-readings.json`)은 Phase 2 EN 유지
- "For entertainment 🌙" 이모지 유지

---

## 9. Fortune locale 처리

### fortune.ts 리팩터

`calcFortune()`이 문자열 대신 **category/tier key**를 반환하도록 변경.

```ts
// 변경 전
{ label: "Money", tierLabel: "Strong", line: "Wealth flows..." }

// 변경 후
{ category: "money", tier: "strong", line: "Wealth flows..." }
// line(subLine)은 Phase 2 EN 고정 유지
```

컴포넌트에서:
```tsx
const t = useTranslations('Fortune');
<span>{t(card.category)}</span>       // "Money" / "マネー"
<span>{t(`tiers.${card.tier}`)}</span> // "Strong" / "強い"
```

### Daily Fortune locale

**API 변경:**
```
GET /api/daily-fortune?dayMaster=甲&locale=ja
```

**Supabase DDL (마이그레이션):**
```sql
ALTER TABLE daily_fortunes ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';
ALTER TABLE daily_fortunes DROP CONSTRAINT daily_fortunes_date_day_master_key;
ALTER TABLE daily_fortunes ADD CONSTRAINT daily_fortunes_date_day_master_locale_key
  UNIQUE (date, day_master, locale);
```

**route.ts 프롬프트 locale 지정:**
```ts
const langMap = {
  en: 'English', ja: 'Japanese', ko: 'Korean', 'zh-TW': 'Traditional Chinese'
};
const prompt = `Generate a one-sentence daily fortune in ${langMap[locale]}...`;
```

**DailyFortune 컴포넌트:**
```tsx
const locale = useLocale();
fetch(`/api/daily-fortune?dayMaster=${dayMaster}&locale=${locale}`);
```

---

## 10. sitemap 업데이트

```ts
// src/app/sitemap.ts
const locales = ['en', 'ja', 'ko', 'zh-TW'];
const coreRoutes = ['/', '/inyeon'];
// EN: /  /inyeon
// JA: /ja/  /ja/inyeon
// ...
// Trust 페이지는 EN만 (Phase 3에서 locale 추가)
```

---

## 11. Phase 3 (향후)

- Trust 페이지 `[locale]/`로 이전 + JA·KO·ZH-TW 번역
- `(static)` route group 제거
- SiteHeader `useTranslations` 전면 전환 (labels prop 패턴 제거)
- `data/ksaju-readings.json` → `data/readings/{en,ja,ko,zh-TW}.json` 분리
- hreflang `<link>` 태그 추가
- fortune.ts subLine locale 처리

---

## 12. 테스트 전략

**기존 192 tests 유지.** 파일 이전에 따른 import 경로 업데이트만 필요.

**신규 테스트 (~10개):**

| 파일 | 테스트 |
|------|--------|
| `src/i18n/routing.test.ts` | locales 4개, defaultLocale='en', localePrefix='as-needed' |
| `src/components/layout/locale-switcher.test.tsx` | 4개 옵션 렌더, 현재 locale 활성 표시, router.replace 호출 |
| `src/components/layout/site-header.test.tsx` | labels prop 커스텀 텍스트, 미전달 시 EN 기본값 |
| `src/lib/fortune.test.ts` | category/tier key 반환 검증 (기존 텍스트 매칭 → key 매칭으로 업데이트) |

**빌드 검증 기준:**
```
next build:
  / /inyeon                         (EN static)
  /ja/ /ja/inyeon                   (JA static)
  /ko/ /ko/inyeon                   (KO static)
  /zh-TW/ /zh-TW/inyeon             (ZH-TW static)
  /about /faq /privacy /terms       (root static, 변경 없음)
  /api/daily-fortune                (dynamic, locale 파라미터)
tsc + eslint clean
vitest: ~202 tests pass
```

---

## 13. 구현 태스크 순서

| # | 태스크 | 커밋 단위 |
|---|--------|----------|
| 1 | next-intl 기반 + middleware 병합 | `i18n/routing·request·navigation`, `next.config.ts`, `middleware.ts` |
| 2 | 파일 구조 이전 + AppChrome 추출 | `[locale]/` 이전, `(static)/` 생성, root layout 슬림화 |
| 3 | messages EN 작성 + 컴포넌트 연결 | `messages/en.json`, 각 컴포넌트 `useTranslations` |
| 4 | JA·KO·ZH-TW 번역 파일 | `messages/{ja,ko,zh-TW}.json` (AI 초안 → 사용자 검토) |
| 5 | LocaleSwitcher + SiteHeader 업데이트 | `locale-switcher.tsx`, SiteHeader labels prop |
| 6 | Fortune locale 연결 | `fortune.ts` category/tier key, 컴포넌트 연결 |
| 7 | Daily Fortune locale | `?locale=` 파라미터, Supabase DDL, route.ts |
| 8 | sitemap + 빌드 검증 + 마무리 | sitemap 4 locale, 전체 green |
