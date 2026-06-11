# Phase 2 글로벌 멀티랭귀지 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** next-intl v4 기반으로 EN·JA·KO·ZH-TW 4개 locale을 지원하는 멀티랭귀지 인프라를 구축하고, 코어 플로우(`/`, `/inyeon`) + Fortune + Daily Fortune의 UI 텍스트를 모두 번역한다.

**Architecture:** `app/[locale]/` 세그먼트에 코어 페이지를 이전하고, `app/(static)/` route group으로 trust 페이지에 chrome을 제공한다. 공통 chrome(`AppChrome`)을 추출해 두 layout이 재사용. Root layout은 html/body/fonts/Analytics만 담당.

**Tech Stack:** next-intl v4.12.0 (installed), Next.js 16, App Router, TypeScript, shadcn/ui DropdownMenu

**Spec:** `docs/superpowers/specs/2026-06-12-multilang-design.md`

**Base branch:** `main` (`c3ad916`)

---

## 파일 맵

| 경로 | 동작 |
|------|------|
| `src/i18n/routing.ts` | NEW — locales/defaultLocale/localePrefix 정의 |
| `src/i18n/request.ts` | NEW — next-intl getRequestConfig, messages 로드 |
| `src/i18n/navigation.ts` | NEW — locale-aware Link/usePathname/useRouter export |
| `src/i18n/routing.test.ts` | NEW — routing 설정 단위테스트 |
| `next.config.ts` | MODIFY — next-intl 플러그인 추가 |
| `src/middleware.ts` | MODIFY — admin auth + next-intl middleware 병합 |
| `src/components/layout/app-chrome.tsx` | NEW — ThemeProvider + chrome 공통 래퍼 |
| `src/components/layout/site-header.tsx` | MODIFY — labels prop, showLocaleSwitcher prop |
| `src/components/layout/locale-switcher.tsx` | NEW — 글로브 드롭다운 |
| `src/components/layout/locale-switcher.test.tsx` | NEW |
| `src/components/layout/site-header.test.tsx` | MODIFY — labels prop 테스트 추가 |
| `src/app/layout.tsx` | MODIFY — 슬림화 (html/body/fonts/Analytics) |
| `src/app/[locale]/layout.tsx` | NEW — NextIntlClientProvider + AppChrome |
| `src/app/[locale]/page.tsx` | MOVED from `src/app/page.tsx` |
| `src/app/[locale]/inyeon/page.tsx` | MOVED from `src/app/inyeon/page.tsx` |
| `src/app/(static)/layout.tsx` | NEW — ThemeProvider + AppChrome (intl 없음) |
| `src/app/(static)/about/page.tsx` | MOVED from `src/app/about/page.tsx` |
| `src/app/(static)/faq/page.tsx` | MOVED from `src/app/faq/page.tsx` |
| `src/app/(static)/privacy/page.tsx` | MOVED from `src/app/privacy/page.tsx` |
| `src/app/(static)/terms/page.tsx` | MOVED from `src/app/terms/page.tsx` |
| `src/messages/en.json` | NEW — EN 번역 파일 |
| `src/messages/ja.json` | NEW — JA 번역 파일 |
| `src/messages/ko.json` | NEW — KO 번역 파일 |
| `src/messages/zh-TW.json` | NEW — ZH-TW 번역 파일 |
| `src/app/page.tsx` | DELETE (moved to `[locale]/`) |
| `src/app/inyeon/page.tsx` | DELETE (moved to `[locale]/inyeon/`) |
| `src/app/about/page.tsx` | DELETE (moved to `(static)/about/`) |
| `src/app/faq/page.tsx` | DELETE (moved to `(static)/faq/`) |
| `src/app/privacy/page.tsx` | DELETE (moved to `(static)/privacy/`) |
| `src/app/terms/page.tsx` | DELETE (moved to `(static)/terms/`) |
| `src/components/kst/birth-form.tsx` | MODIFY — useTranslations 추가 |
| `src/components/inyeon/inyeon-view.tsx` | MODIFY — useTranslations 추가 |
| `src/components/DailyFortune.tsx` | MODIFY — useTranslations + locale fetch |
| `src/components/compat/compatibility-modal.tsx` | MODIFY — useTranslations 추가 |
| `src/lib/fortune.ts` | MODIFY — FortuneCard.title 제거 |
| `src/components/fortune/fortune-card.tsx` | MODIFY — t('Fortune.' + key) 사용 |
| `src/components/fortune/fortune-section.tsx` | MODIFY — useTranslations 추가 |
| `src/app/api/daily-fortune/route.ts` | MODIFY — locale 파라미터, 다국어 프롬프트 |
| `src/app/sitemap.ts` | MODIFY — 4 locale × 코어 URL |
| `src/app/sitemap.test.ts` | MODIFY — locale URL 검증 |
| `docs/supabase-migration.sql` | MODIFY — daily_fortunes locale 컬럼 |

---

## Task 1: next-intl 기반 설정 + middleware 병합

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/routing.test.ts`
- Modify: `next.config.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: routing.ts 작성**

```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ja', 'ko', 'zh-TW'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 2: request.ts 작성**

```ts
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: navigation.ts 작성**

```ts
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: routing.test.ts 작성**

```ts
// src/i18n/routing.test.ts
import { describe, it, expect } from 'vitest';
import { routing } from './routing';

describe('routing', () => {
  it('4개 locale 정의', () => {
    expect(routing.locales).toEqual(['en', 'ja', 'ko', 'zh-TW']);
  });
  it('defaultLocale은 en', () => {
    expect(routing.defaultLocale).toBe('en');
  });
  it('localePrefix는 as-needed', () => {
    expect(routing.localePrefix).toBe('as-needed');
  });
});
```

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```
npx vitest run src/i18n/routing.test.ts
```
Expected: 3 tests pass

- [ ] **Step 6: next.config.ts 업데이트**

```ts
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: middleware.ts 업데이트 — admin auth 함수 추출 + next-intl 통합**

```ts
// src/middleware.ts
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intl = createIntlMiddleware(routing);

function adminAuth(request: NextRequest): NextResponse {
  const auth = request.cookies.get('ksaju-admin-auth');
  if (auth?.value === '1') return NextResponse.next();

  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    const [, pass] = decoded.split(':');
    const expected = process.env.ADMIN_PASSWORD || 'ksaju-admin';
    if (pass === expected) {
      const response = NextResponse.next();
      response.cookies.set('ksaju-admin-auth', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
      });
      return response;
    }
  }

  return new NextResponse(null, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KSaju Admin"' },
  });
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminAuth(request);
  }
  return intl(request);
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/((?!api|_next|.*\\..*).*)'],
};
```

- [ ] **Step 8: 빌드 확인 (tsc 에러 없음)**

```
npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 9: 커밋**

```
git add src/i18n/ next.config.ts src/middleware.ts
git commit -m "feat(i18n): next-intl routing/request/navigation + middleware 병합"
```

---

## Task 2: AppChrome 추출 + 파일 구조 이전

**Files:**
- Create: `src/components/layout/app-chrome.tsx`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx` (from app/page.tsx)
- Create: `src/app/[locale]/inyeon/page.tsx` (from app/inyeon/page.tsx)
- Create: `src/app/(static)/layout.tsx`
- Create: `src/app/(static)/about/page.tsx` (from app/about/page.tsx)
- Create: `src/app/(static)/faq/page.tsx` (from app/faq/page.tsx)
- Create: `src/app/(static)/privacy/page.tsx` (from app/privacy/page.tsx)
- Create: `src/app/(static)/terms/page.tsx` (from app/terms/page.tsx)
- Modify: `src/app/layout.tsx` (슬림화)
- Delete: `src/app/page.tsx`, `src/app/inyeon/page.tsx`, trust 4개

- [ ] **Step 1: AppChrome 작성 — 기존 root layout에서 chrome 추출**

현재 `src/app/layout.tsx`의 `<main className="hanji-paper">` 블록 전체를 새 컴포넌트로 추출.

```tsx
// src/components/layout/app-chrome.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

interface AppChromeProps {
  children: React.ReactNode;
  headerLabels?: { mySaju: string; inyeon: string };
  showLocaleSwitcher?: boolean;
}

export function AppChrome({
  children,
  headerLabels,
  showLocaleSwitcher = false,
}: AppChromeProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <main className="hanji-paper min-h-screen relative overflow-hidden">
        <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

        <span
          className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-30 sm:z-0"
          aria-hidden="true"
        >
          ㅎ
        </span>

        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader
            labels={headerLabels}
            showLocaleSwitcher={showLocaleSwitcher}
          />
          <AnalyticsProvider />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </div>

        <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
      </main>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: SiteHeader에 labels + showLocaleSwitcher prop 추가**

현재 `src/components/layout/site-header.tsx`를 수정. `LocaleSwitcher`는 Task 5에서 구현 — 지금은 `null` 렌더 placeholder.

```tsx
// src/components/layout/site-header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface SiteHeaderProps {
  labels?: { mySaju: string; inyeon: string };
  showLocaleSwitcher?: boolean;
}

const DEFAULTS = { mySaju: "My Saju", inyeon: "Inyeon" };

export function SiteHeader({
  labels = DEFAULTS,
  showLocaleSwitcher = false,
}: SiteHeaderProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/", label: labels.mySaju },
    { href: "/inyeon", label: labels.inyeon },
  ] as const;

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-6 pb-3 pt-9">
      <Link href="/" className="flex items-baseline gap-1.5">
        <span className="font-display text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </span>
        <span className="hanja text-sm font-bold text-muted-foreground">사주</span>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || /^\/[a-z]{2}(-[A-Z]{2})?(\/)?$/.test(pathname)
              : pathname.includes(item.href);
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
        {/* LocaleSwitcher: Task 5에서 구현 */}
        {showLocaleSwitcher && null}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

**주의:** `pathname.includes(item.href)` 패턴으로 `/ja/inyeon` 경로도 활성 체크. `/` 홈은 별도 regex로 `/ja/`, `/ko/` 등도 매칭.

- [ ] **Step 3: root layout.tsx 슬림화**

기존 `src/app/layout.tsx`를 다음으로 대체 (chrome 제거, getLocale 추가, fonts/Analytics/metadata 유지):

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import {
  Geist,
  Inter,
  Gowun_Batang,
  Yeon_Sung,
  Noto_Serif_KR,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getLocale } from "next-intl/server";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
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
const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ksaju.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KSaju · Korean Saju Compatibility for K-pop Fans",
    template: "%s · KSaju",
  },
  description:
    "Discover your Korean saju (사주) compatibility with your bias. " +
    "1,000 years of Korean fortune wisdom, made shareable for the K-content generation.",
  keywords: ["saju", "korean fortune", "kpop compatibility", "kpop saju", "inyeon", "사주"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "KSaju",
    title: "KSaju · Korean Saju Compatibility for K-pop Fans",
    description: "Saju, but make it K. Find your bias compatibility in seconds.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "KSaju" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KSaju · Korean Saju Compatibility for K-pop Fans",
    description: "Saju, but make it K. Find your bias compatibility in seconds.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0828" },
  ],
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} ${notoSerifKR.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: `[locale]/layout.tsx` 작성**

```tsx
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppChrome } from "@/components/layout/app-chrome";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "SiteHeader" });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppChrome
        headerLabels={{ mySaju: t("mySaju"), inyeon: t("inyeon") }}
        showLocaleSwitcher
      >
        {children}
      </AppChrome>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 5: `(static)/layout.tsx` 작성**

```tsx
// src/app/(static)/layout.tsx
import { AppChrome } from "@/components/layout/app-chrome";

export default function StaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome>{children}</AppChrome>;
}
```

- [ ] **Step 6: 코어 페이지 이전 — `[locale]/page.tsx`**

현재 `src/app/page.tsx` 전체 내용을 `src/app/[locale]/page.tsx`에 복사 (내용 무변경).

```bash
# src/app/[locale]/page.tsx 생성 후 src/app/page.tsx 삭제
```

내용: 현재 `src/app/page.tsx`와 동일 (Home 컴포넌트 전체).

- [ ] **Step 7: `[locale]/inyeon/page.tsx` 이전**

현재 `src/app/inyeon/page.tsx` 내용을 `src/app/[locale]/inyeon/page.tsx`에 복사 (내용 무변경).

```tsx
// src/app/[locale]/inyeon/page.tsx — 내용 동일
import type { Metadata } from "next";
import { InyeonView } from "@/components/inyeon/inyeon-view";

export const metadata: Metadata = {
  title: "Inyeon · KSaju",
  description: "Your K-pop bias & partner saju compatibility.",
};

export default function InyeonPage() {
  return <InyeonView />;
}
```

- [ ] **Step 8: Trust 페이지 이전**

`src/app/about/page.tsx` → `src/app/(static)/about/page.tsx` (내용 무변경)
`src/app/faq/page.tsx` → `src/app/(static)/faq/page.tsx` (내용 무변경)
`src/app/privacy/page.tsx` → `src/app/(static)/privacy/page.tsx` (내용 무변경)
`src/app/terms/page.tsx` → `src/app/(static)/terms/page.tsx` (내용 무변경)

각 파일: 기존 경로에서 읽어 새 경로에 Write, 기존 파일 삭제.

- [ ] **Step 9: 기존 원본 파일 삭제**

```bash
rm src/app/page.tsx
rm src/app/inyeon/page.tsx
rm src/app/about/page.tsx
rm src/app/faq/page.tsx
rm src/app/privacy/page.tsx
rm src/app/terms/page.tsx
```

- [ ] **Step 10: `src/messages/en.json` placeholder 생성 (빌드 통과용)**

Task 3에서 완성하지만, `[locale]/layout.tsx`가 messages import를 시도하므로 지금 빈 구조 생성.

```json
{
  "SiteHeader": {
    "mySaju": "My Saju",
    "inyeon": "Inyeon"
  }
}
```

- [ ] **Step 11: `next build` 통과 확인**

```
npx next build
```
Expected: `/` `/inyeon` `/about` `/faq` `/privacy` `/terms` `/ja/` `/ko/` `/zh-TW/` 모두 static ○ (또는 ƒ는 api 라우트만). tsc/lint 에러 없음.

- [ ] **Step 12: 커밋**

```
git add src/components/layout/app-chrome.tsx src/components/layout/site-header.tsx \
  src/app/layout.tsx src/app/[locale]/ src/app/\(static\)/ src/messages/en.json
git commit -m "feat(i18n): AppChrome 추출 + [locale]/(static) 파일 구조 이전"
```

---

## Task 3: messages/en.json 완성 + 컴포넌트 연결

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/components/kst/birth-form.tsx`
- Modify: `src/components/inyeon/inyeon-view.tsx`
- Modify: `src/components/compat/compatibility-modal.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: messages/en.json 완성**

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
  "Home": {
    "cardTitle": "When were you born?",
    "cardSubtitle": "Korea uses KST · we'll convert for you",
    "tagline": "Saju, but make it K."
  },
  "BirthForm": {
    "dateLabel": "Birth date",
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
    "time": "This Year",
    "shareButton": "Share ✨",
    "disclaimer": "For entertainment 🌙"
  },
  "DailyFortune": {
    "title": "Today's Fortune",
    "loading": "Reading the stars...",
    "shareButton": "Share ✨",
    "comeback": "Come back tomorrow for a new reading 🌙"
  },
  "Inyeon": {
    "title": "Inyeon",
    "hanja": "인 연",
    "selfTitle": "First, your birthday",
    "selfSubtitle": "We need your saju to reveal your matches.",
    "selfSubmit": "See my saju",
    "selfSubmitting": "Reading...",
    "idolSectionTitle": "K-pop Compatibility",
    "partnerSectionTitle": "Someone Special"
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

- [ ] **Step 2: BirthForm에 useTranslations 추가**

`src/components/kst/birth-form.tsx` 수정 — `useTranslations('BirthForm')` 추가, FormLabel과 시간 label/placeholder를 번역 사용, submitLabel/submittingLabel prop 기본값을 번역으로.

파일 상단 import 추가:
```tsx
import { useTranslations } from "next-intl";
```

`BirthForm` 함수 내부 첫 줄에 추가:
```tsx
const t = useTranslations("BirthForm");
```

FormLabel "Birth date" → `{t("dateLabel")}` 로 교체.

Birth time FormLabel 찾아 → `{t("timeLabel")}` 로 교체.

Birth time Select placeholder(현재 "Skip it" 또는 비슷한 문자열) → `{t("timePlaceholder")}` 로 교체.

Button 텍스트 `{submitting ? (submittingLabel ?? t("submitting")) : (submitLabel ?? t("submit"))}` 패턴 사용 — prop이 있으면 prop 우선, 없으면 번역 사용.

- [ ] **Step 3: home page.tsx에서 번역 텍스트 사용**

`src/app/[locale]/page.tsx` 수정 — 상단에 `import { useTranslations } from "next-intl";` 추가, `Home` 함수 내부에 `const t = useTranslations("Home");` 추가.

변경 대상:
- `"When were you born?"` → `{t("cardTitle")}`
- `"Korea uses KST · we\\'ll convert for you"` → `{t("cardSubtitle")}`
- `"Saju, but make it K."` → `{t("tagline")}`

- [ ] **Step 4: InyeonView에 useTranslations 추가**

`src/components/inyeon/inyeon-view.tsx` 상단에 import:
```tsx
import { useTranslations } from "next-intl";
```

함수 내부:
```tsx
const t = useTranslations("Inyeon");
```

변경 대상:
- `"Inyeon"` (h1) → `{t("title")}`
- `"인 연"` → `{t("hanja")}`
- `"First, your birthday"` → `{t("selfTitle")}`
- `"We need your saju to reveal your matches."` → `{t("selfSubtitle")}`
- `submitLabel="See my saju"` → `submitLabel={t("selfSubmit")}`
- `submittingLabel="Reading…"` → `submittingLabel={t("selfSubmitting")}`

- [ ] **Step 5: CompatibilityModal에 useTranslations 추가**

`src/components/compat/compatibility-modal.tsx` 내에서 "View … result again ✨"와 "Check another idol" 문자열을 찾아 번역으로 교체.

Import 추가:
```tsx
import { useTranslations } from "next-intl";
```

컴포넌트 내부:
```tsx
const t = useTranslations("CompatibilityModal");
```

"View … result again ✨" 버튼 텍스트 → `{t("viewAgain")}`
"Check another idol" 버튼 텍스트 → `{t("checkAnother")}`

- [ ] **Step 6: 테스트 실행**

```
npx vitest run
```
Expected: 192 tests pass (컴포넌트 로직 무변경이므로 기존 테스트 통과)

- [ ] **Step 7: 커밋**

```
git add src/messages/en.json src/components/kst/birth-form.tsx \
  src/components/inyeon/inyeon-view.tsx src/components/compat/compatibility-modal.tsx \
  src/app/[locale]/page.tsx
git commit -m "feat(i18n): messages/en.json + 컴포넌트 useTranslations 연결"
```

---

## Task 4: JA·KO·ZH-TW 번역 파일

**Files:**
- Create: `src/messages/ja.json`
- Create: `src/messages/ko.json`
- Create: `src/messages/zh-TW.json`

- [ ] **Step 1: ja.json 작성**

```json
{
  "SiteHeader": {
    "mySaju": "私の四柱",
    "inyeon": "縁"
  },
  "SiteFooter": {
    "about": "About",
    "faq": "FAQ",
    "privacy": "プライバシー",
    "terms": "利用規約",
    "disclaimer": "For entertainment 🌙"
  },
  "LocaleSwitcher": {
    "label": "言語"
  },
  "Home": {
    "cardTitle": "あなたの生年月日は？",
    "cardSubtitle": "韓国標準時(KST)に変換します",
    "tagline": "Saju, but make it K."
  },
  "BirthForm": {
    "dateLabel": "生年月日",
    "timeLabel": "出生時刻（任意）",
    "timePlaceholder": "わからない場合はスキップ",
    "submit": "四柱を見る →",
    "submitting": "計算中..."
  },
  "SajuResult": {
    "dayMasterLabel": "日干",
    "pillarsTitle": "四柱",
    "editButton": "生年月日を変更"
  },
  "Fortune": {
    "sectionTitle": "あなたの運勢",
    "money": "金運",
    "love": "恋愛",
    "career": "仕事",
    "time": "今年",
    "shareButton": "シェア ✨",
    "disclaimer": "For entertainment 🌙"
  },
  "DailyFortune": {
    "title": "今日の運勢",
    "loading": "星を読んでいます...",
    "shareButton": "シェア ✨",
    "comeback": "明日また新しい運勢をチェック 🌙"
  },
  "Inyeon": {
    "title": "縁",
    "hanja": "인 연",
    "selfTitle": "まず生年月日を入力",
    "selfSubtitle": "相性を出すためにあなたの四柱が必要です。",
    "selfSubmit": "四柱を見る",
    "selfSubmitting": "読み込み中...",
    "idolSectionTitle": "K-POPとの相性",
    "partnerSectionTitle": "大切な人との相性"
  },
  "CompatibilityModal": {
    "viewAgain": "結果をもう一度見る ✨",
    "checkAnother": "他のアイドルをチェック"
  },
  "Common": {
    "loading": "読み込み中...",
    "error": "エラーが発生しました",
    "tryAgain": "もう一度試す"
  }
}
```

- [ ] **Step 2: ko.json 작성**

```json
{
  "SiteHeader": {
    "mySaju": "내 사주",
    "inyeon": "인연"
  },
  "SiteFooter": {
    "about": "소개",
    "faq": "FAQ",
    "privacy": "개인정보",
    "terms": "이용약관",
    "disclaimer": "For entertainment 🌙"
  },
  "LocaleSwitcher": {
    "label": "언어"
  },
  "Home": {
    "cardTitle": "생일을 입력하세요",
    "cardSubtitle": "한국 표준시(KST)로 변환해드립니다",
    "tagline": "Saju, but make it K."
  },
  "BirthForm": {
    "dateLabel": "생년월일",
    "timeLabel": "태어난 시간 (선택)",
    "timePlaceholder": "모르면 넘어가세요",
    "submit": "내 사주 보기 →",
    "submitting": "계산 중..."
  },
  "SajuResult": {
    "dayMasterLabel": "일간",
    "pillarsTitle": "사주 四柱",
    "editButton": "생일 변경"
  },
  "Fortune": {
    "sectionTitle": "나의 운세",
    "money": "재물",
    "love": "연애",
    "career": "직업",
    "time": "올해",
    "shareButton": "공유 ✨",
    "disclaimer": "For entertainment 🌙"
  },
  "DailyFortune": {
    "title": "오늘의 운세",
    "loading": "별자리를 읽는 중...",
    "shareButton": "공유 ✨",
    "comeback": "내일 새로운 운세를 확인하세요 🌙"
  },
  "Inyeon": {
    "title": "인연",
    "hanja": "인 연",
    "selfTitle": "먼저 생일을 입력하세요",
    "selfSubtitle": "궁합을 보려면 내 사주가 필요해요.",
    "selfSubmit": "내 사주 보기",
    "selfSubmitting": "읽는 중...",
    "idolSectionTitle": "K-팝 스타와의 궁합",
    "partnerSectionTitle": "소중한 사람과의 궁합"
  },
  "CompatibilityModal": {
    "viewAgain": "결과 다시 보기 ✨",
    "checkAnother": "다른 아이돌 확인"
  },
  "Common": {
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "tryAgain": "다시 시도"
  }
}
```

- [ ] **Step 3: zh-TW.json 작성**

```json
{
  "SiteHeader": {
    "mySaju": "我的四柱",
    "inyeon": "緣分"
  },
  "SiteFooter": {
    "about": "關於",
    "faq": "FAQ",
    "privacy": "隱私權",
    "terms": "服務條款",
    "disclaimer": "For entertainment 🌙"
  },
  "LocaleSwitcher": {
    "label": "語言"
  },
  "Home": {
    "cardTitle": "請輸入您的生日",
    "cardSubtitle": "將自動換算為韓國標準時間(KST)",
    "tagline": "Saju, but make it K."
  },
  "BirthForm": {
    "dateLabel": "生日",
    "timeLabel": "出生時間（選填）",
    "timePlaceholder": "不知道的話可以跳過",
    "submit": "查看我的四柱 →",
    "submitting": "計算中..."
  },
  "SajuResult": {
    "dayMasterLabel": "日主",
    "pillarsTitle": "四柱",
    "editButton": "更改生日"
  },
  "Fortune": {
    "sectionTitle": "我的運勢",
    "money": "財運",
    "love": "感情",
    "career": "事業",
    "time": "今年",
    "shareButton": "分享 ✨",
    "disclaimer": "For entertainment 🌙"
  },
  "DailyFortune": {
    "title": "今日運勢",
    "loading": "正在解讀星象...",
    "shareButton": "分享 ✨",
    "comeback": "明天再來看新的運勢 🌙"
  },
  "Inyeon": {
    "title": "緣分",
    "hanja": "인 연",
    "selfTitle": "請先輸入您的生日",
    "selfSubtitle": "需要您的四柱才能查看配對。",
    "selfSubmit": "查看我的四柱",
    "selfSubmitting": "讀取中...",
    "idolSectionTitle": "K-POP 配對",
    "partnerSectionTitle": "與重要的人配對"
  },
  "CompatibilityModal": {
    "viewAgain": "再次查看結果 ✨",
    "checkAnother": "查看其他偶像"
  },
  "Common": {
    "loading": "載入中...",
    "error": "發生錯誤",
    "tryAgain": "再試一次"
  }
}
```

- [ ] **Step 4: `next build` 통과 확인 — 4개 locale 라우트 모두 static**

```
npx next build
```
Expected: `/ja/` `/ko/` `/zh-TW/` 추가됨, 모두 static ○

- [ ] **Step 5: 커밋**

```
git add src/messages/ja.json src/messages/ko.json src/messages/zh-TW.json
git commit -m "feat(i18n): JA/KO/ZH-TW 번역 파일 추가"
```

---

## Task 5: LocaleSwitcher + SiteHeader 완성

**Files:**
- Create: `src/components/layout/locale-switcher.tsx`
- Create: `src/components/layout/locale-switcher.test.tsx`
- Modify: `src/components/layout/site-header.tsx` (LocaleSwitcher 연결)
- Modify: `src/components/layout/site-header.test.tsx`

- [ ] **Step 1: locale-switcher.test.tsx 작성 (TDD — 먼저 실패)**

```tsx
// src/components/layout/locale-switcher.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleSwitcher } from "./locale-switcher";

const mockReplace = vi.fn();
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => mockReplace.mockClear());

  it("4개 locale 옵션 렌더", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText("EN · English")).toBeInTheDocument();
    expect(screen.getByText("JA · 日本語")).toBeInTheDocument();
    expect(screen.getByText("KO · 한국어")).toBeInTheDocument();
    expect(screen.getByText("ZH · 繁中")).toBeInTheDocument();
  });

  it("현재 locale(en)에 font-semibold 클래스", () => {
    render(<LocaleSwitcher />);
    const enBtn = screen.getByText("EN · English");
    expect(enBtn.className).toContain("font-semibold");
  });

  it("JA 선택 시 router.replace 호출", async () => {
    render(<LocaleSwitcher />);
    await userEvent.click(screen.getByText("JA · 日本語"));
    expect(mockReplace).toHaveBeenCalledWith("/", { locale: "ja" });
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npx vitest run src/components/layout/locale-switcher.test.tsx
```
Expected: FAIL (파일 없음)

- [ ] **Step 3: LocaleSwitcher 구현**

```tsx
// src/components/layout/locale-switcher.tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES = [
  { code: "en", label: "EN · English" },
  { code: "ja", label: "JA · 日本語" },
  { code: "ko", label: "KO · 한국어" },
  { code: "zh-TW", label: "ZH · 繁中" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Language"
        >
          <Globe className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => router.replace(pathname, { locale: code })}
            className={
              locale === code
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            }
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npx vitest run src/components/layout/locale-switcher.test.tsx
```
Expected: 3 tests pass

- [ ] **Step 5: SiteHeader에 LocaleSwitcher 연결**

`src/components/layout/site-header.tsx`에서 `{showLocaleSwitcher && null}` 줄을:

```tsx
import { LocaleSwitcher } from "./locale-switcher";
// ...
{showLocaleSwitcher && <LocaleSwitcher />}
```

으로 교체. import 추가 포함.

- [ ] **Step 6: site-header.test.tsx에 labels prop 테스트 추가**

기존 테스트 파일을 열고 다음 테스트 추가:

```tsx
it("labels prop으로 커스텀 네비 텍스트 렌더", () => {
  render(
    <SiteHeader labels={{ mySaju: "私の四柱", inyeon: "縁" }} />
  );
  expect(screen.getByText("私の四柱")).toBeInTheDocument();
  expect(screen.getByText("縁")).toBeInTheDocument();
});

it("labels prop 미전달 시 EN 기본값 사용", () => {
  render(<SiteHeader />);
  expect(screen.getByText("My Saju")).toBeInTheDocument();
  expect(screen.getByText("Inyeon")).toBeInTheDocument();
});
```

- [ ] **Step 7: 전체 테스트 실행**

```
npx vitest run
```
Expected: 192 + 3(LocaleSwitcher) + 2(SiteHeader) = ~197 tests pass

- [ ] **Step 8: 커밋**

```
git add src/components/layout/locale-switcher.tsx \
  src/components/layout/locale-switcher.test.tsx \
  src/components/layout/site-header.tsx \
  src/components/layout/site-header.test.tsx
git commit -m "feat(i18n): LocaleSwitcher 글로브 드롭다운 + SiteHeader labels prop"
```

---

## Task 6: Fortune locale 연결

**Files:**
- Modify: `src/lib/fortune.ts`
- Modify: `src/components/fortune/fortune-card.tsx`
- Modify: `src/components/fortune/fortune-section.tsx`
- Modify: `src/lib/fortune.test.ts`

- [ ] **Step 1: fortune.test.ts 업데이트 — title 제거, key 기반 검증으로 변경**

`fortune.test.ts`에서 `title` 참조를 제거하고 `key` 기반 검증으로 교체:

기존:
```ts
it("Money: 재성=일간이 극하는 오행. 辛(metal)→재성 wood, count 1 → Steady", () => {
  const money = calcFortune(RM, LUCK_2026)[0];
  expect(money.element).toBe("wood");
  expect(money.tierLabel).toBe("Steady");
});
```

변경 후:
```ts
it("Money: 재성=일간이 극하는 오행. 辛(metal)→재성 wood, count 1 → some tier", () => {
  const money = calcFortune(RM, LUCK_2026)[0];
  expect(money.key).toBe("money");
  expect(money.element).toBe("wood");
  expect(money.tierLabel).toBe("Steady"); // tierLabel은 Phase 2에서 EN 유지
});
```

`title` 필드를 체크하는 테스트가 있다면 제거.

- [ ] **Step 2: 테스트 실행 — 현재 상태에서 통과 확인**

```
npx vitest run src/lib/fortune.test.ts
```
Expected: 통과 (title 참조가 없으므로 현재도 통과)

- [ ] **Step 3: fortune.ts FortuneCard에서 title 제거**

`src/lib/fortune.ts`의 `FortuneCard` 인터페이스에서 `title: string` 제거:

변경 전:
```ts
export interface FortuneCard {
  key: FortuneKey;
  title: string;
  emoji: string;
  element: WuXing;
  tierLabel: string;
  line: string;
  subLine?: string;
}
```

변경 후:
```ts
export interface FortuneCard {
  key: FortuneKey;
  emoji: string;
  element: WuXing;
  tierLabel: string;
  line: string;
  subLine?: string;
}
```

`calcFortune()` 내부 4개 카드 객체에서 `title: "Money"` / `title: "Love"` / `title: "Career"` / `title: "This Year"` 줄을 각각 제거.

- [ ] **Step 4: fortune.test.ts 실행 — title 제거 후 통과 확인**

```
npx vitest run src/lib/fortune.test.ts
```
Expected: 모두 통과 (title 체크 없음)

- [ ] **Step 5: fortune-card.tsx 수정 — useTranslations으로 카테고리명 렌더**

```tsx
// src/components/fortune/fortune-card.tsx
"use client";

import { useTranslations } from "next-intl";
import { WUXING_META } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { FortuneCard as FortuneCardData } from "@/lib/fortune";

const ACCENT: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

export function FortuneCard({ card }: { card: FortuneCardData }) {
  const t = useTranslations("Fortune");
  const meta = WUXING_META[card.element];
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {card.emoji} {t(card.key)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[card.element]}`}
          title={meta.label}
        >
          {card.tierLabel}
        </span>
      </div>
      <p className="text-sm leading-snug">{card.line}</p>
      {card.subLine && (
        <p className="text-xs text-muted-foreground">{card.subLine}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: fortune-section.tsx 수정 — useTranslations 추가**

`src/components/fortune/fortune-section.tsx`에서:

Import 추가:
```tsx
import { useTranslations } from "next-intl";
```

컴포넌트 내부 첫 줄:
```tsx
const t = useTranslations("Fortune");
```

변경 대상:
- `"Your Fortune · 운세"` → `{t("sectionTitle")} · 운세`
- Share 버튼 텍스트 `"Share ✨"` → `{t("shareButton")}`
- `"For entertainment 🌙"` → `{t("disclaimer")}`

- [ ] **Step 7: 전체 테스트 실행**

```
npx vitest run
```
Expected: 이전과 동일한 테스트 수 통과 (fortune-card는 useTranslations mock이 필요할 수 있음 — 기존 테스트 환경 확인)

**주의:** `fortune-card.test.tsx` 또는 fortune-card를 렌더하는 테스트가 있다면 `next-intl` mock을 추가해야 할 수 있음:
```ts
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
```

- [ ] **Step 8: 커밋**

```
git add src/lib/fortune.ts src/lib/fortune.test.ts \
  src/components/fortune/fortune-card.tsx \
  src/components/fortune/fortune-section.tsx
git commit -m "feat(i18n): fortune title 제거 + FortuneCard/Section useTranslations 연결"
```

---

## Task 7: Daily Fortune locale

**Files:**
- Modify: `src/app/api/daily-fortune/route.ts`
- Modify: `src/components/DailyFortune.tsx`
- Modify: `docs/supabase-migration.sql`

- [ ] **Step 1: supabase-migration.sql에 locale DDL 추가**

`docs/supabase-migration.sql` 파일 끝에 추가:

```sql
-- daily_fortunes: locale 컬럼 추가 (Phase 2 멀티랭귀지)
-- Supabase SQL Editor에서 실행
ALTER TABLE daily_fortunes ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

ALTER TABLE daily_fortunes DROP CONSTRAINT IF EXISTS daily_fortunes_date_day_master_key;

ALTER TABLE daily_fortunes
  ADD CONSTRAINT daily_fortunes_date_day_master_locale_key
  UNIQUE (date, day_master, locale);
```

**⚠️ 사용자 수동 작업:** Supabase SQL Editor에서 위 DDL 실행 필요.

- [ ] **Step 2: route.ts 수정 — locale 파라미터 + 다국어 캐시/프롬프트**

`src/app/api/daily-fortune/route.ts` 전체를 다음으로 교체:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { birthToSaju } from "@/lib/saju";
import { stemRelation, type TimeRel } from "@/lib/fortune";
import { HEAVENLY_STEMS } from "@/lib/saju-data";
import { elementOf, WUXING_META } from "@/lib/saju-display";
import { routing, type Locale } from "@/i18n/routing";

export const revalidate = 86400;

const VALID_STEMS: Set<string> = new Set(HEAVENLY_STEMS.map((s) => s.char));

const LANG_MAP: Record<Locale, string> = {
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  "zh-TW": "Traditional Chinese",
};

const FALLBACK: Record<TimeRel, { message: string; energy: number; lucky_color: string }> = {
  combo:         { message: "Stars align perfectly today — your bias era starts now! ✨",    energy: 5, lucky_color: "Hot Pink"      },
  same:          { message: "You're fully in your element today — ride the wave! 🌊",        energy: 4, lucky_color: "Golden Yellow" },
  "generate-me": { message: "The universe has your back today — lean into it! 🍀",           energy: 4, lucky_color: "Sage Green"    },
  "i-generate":  { message: "Your energy lights up everyone around you today! 💫",           energy: 3, lucky_color: "Lavender"      },
  control:       { message: "A little resistance makes you stronger — you've got this! 🔥",  energy: 3, lucky_color: "Dusty Rose"    },
  neutral:       { message: "A calm, steady day — perfect for planning your next era! 🌤️",  energy: 3, lucky_color: "Sky Blue"      },
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dayMaster = searchParams.get("dayMaster");
  const localeParam = searchParams.get("locale") ?? "en";
  const locale: Locale = routing.locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : "en";

  if (!dayMaster || !VALID_STEMS.has(dayMaster)) {
    return NextResponse.json({ error: "Invalid dayMaster" }, { status: 400 });
  }

  const now = new Date();
  const kstStr = now.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
  const kst = new Date(kstStr);
  const kstYear = kst.getFullYear();
  const kstMonth = kst.getMonth() + 1;
  const kstDay = kst.getDate();
  const todayStr = `${kstYear}-${String(kstMonth).padStart(2, "0")}-${String(kstDay).padStart(2, "0")}`;

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

  // locale 포함 캐시 조회
  const { data: cached } = await supabase
    .from("daily_fortunes")
    .select("*")
    .eq("date", todayStr)
    .eq("day_master", dayMaster)
    .eq("locale", locale)
    .maybeSingle();

  if (cached) return NextResponse.json(cached);

  const elementLabel = WUXING_META[elementOf(dayMaster)].label;
  const lang = LANG_MAP[locale];
  const prompt = `Today's day pillar is ${todayPillar}. The user's day master is ${dayMaster} (${elementLabel}).
Their cosmic relationship today is "${relation}".

Write exactly 1 uplifting sentence (30–40 words) for a K-pop fan's daily fortune in ${lang}.
Tone: playful, Gen Z, positive. You may reference K-pop/idol culture subtly.
Pick an energy level (1–5, where 5 is peak) and a lucky color name in ${lang}.

Respond ONLY with valid JSON — no markdown, no extra text:
{"message":"...","energy":4,"lucky_color":"..."}`;

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
          locale,
          today_pillar: todayPillar,
          relation,
          message: parsed.message,
          energy,
          lucky_color: parsed.lucky_color,
        },
        { onConflict: "date,day_master,locale" },
      )
      .select("*")
      .maybeSingle();

    return NextResponse.json(
      inserted ?? {
        id: "fresh",
        date: todayStr,
        day_master: dayMaster,
        locale,
        today_pillar: todayPillar,
        relation,
        message: parsed.message,
        energy,
        lucky_color: parsed.lucky_color,
      },
    );
  } catch (err) {
    console.error("[daily-fortune] LLM/upsert failed, using fallback:", err);
    return NextResponse.json({
      id: "fallback",
      date: todayStr,
      day_master: dayMaster,
      locale,
      today_pillar: todayPillar,
      relation,
      ...FALLBACK[relation],
    });
  }
}
```

- [ ] **Step 3: DailyFortune.tsx 수정 — locale fetch + useTranslations**

`src/components/DailyFortune.tsx` 상단 import에 추가:
```tsx
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
```

컴포넌트 내부:
```tsx
const t = useTranslations("DailyFortune");
const locale = useLocale();
```

`useEffect` fetch URL 변경:
```tsx
fetch(`/api/daily-fortune?dayMaster=${encodeURIComponent(dayMaster)}&locale=${locale}`)
```

UI 텍스트 교체:
- `"✦ Today's Fortune · 오늘의 운세"` → `{t("title")} · 오늘의 운세`
- 로딩 섹션의 aria-label `"Loading today's fortune"` → `{t("loading")}`
- Share 버튼 `"Share ✨"` → `{t("shareButton")}`
- `"Come back tomorrow for a new reading 🌙"` → `{t("comeback")}`

- [ ] **Step 4: 전체 테스트 실행**

```
npx vitest run
```
Expected: 이전과 동일한 테스트 수 통과

- [ ] **Step 5: tsc 확인**

```
npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```
git add src/app/api/daily-fortune/route.ts \
  src/components/DailyFortune.tsx \
  docs/supabase-migration.sql
git commit -m "feat(i18n): Daily Fortune locale 파라미터 + 다국어 LLM 프롬프트"
```

---

## Task 8: sitemap + 빌드 검증 + 마무리

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/sitemap.test.ts`
- Modify: `task-log.md`

- [ ] **Step 1: sitemap.test.ts 업데이트 (TDD — 먼저 실패)**

기존 sitemap.test.ts에서 URL 목록 검증 부분을 locale 포함 버전으로 업데이트:

```ts
// src/app/sitemap.test.ts
import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("EN 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/");
    expect(urls).toContain("https://ksaju.me/inyeon");
  });

  it("JA 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/ja/");
    expect(urls).toContain("https://ksaju.me/ja/inyeon");
  });

  it("KO 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/ko/");
    expect(urls).toContain("https://ksaju.me/ko/inyeon");
  });

  it("ZH-TW 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/zh-TW/");
    expect(urls).toContain("https://ksaju.me/zh-TW/inyeon");
  });

  it("Trust 페이지 EN만 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/about");
    expect(urls).toContain("https://ksaju.me/faq");
    expect(urls).toContain("https://ksaju.me/privacy");
    expect(urls).toContain("https://ksaju.me/terms");
    // locale prefix trust 페이지는 Phase 3
    expect(urls.filter((u) => u.includes("/ja/about"))).toHaveLength(0);
  });

  it("총 14개 URL (4 locale × 2 코어 + 4 trust EN)", () => {
    expect(sitemap()).toHaveLength(14);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```
npx vitest run src/app/sitemap.test.ts
```
Expected: FAIL (현재 sitemap은 6개 URL만 반환)

- [ ] **Step 3: sitemap.ts 업데이트**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE = "https://ksaju.me";
const LOCALES = ["en", "ja", "ko", "zh-TW"] as const;
const CORE_ROUTES = ["/", "/inyeon"] as const;
const TRUST_ROUTES = ["/about", "/faq", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // 4 locale × 2 코어 라우트
  const localeEntries = LOCALES.flatMap((locale) =>
    CORE_ROUTES.map((route) => {
      const path =
        locale === "en"
          ? route === "/"
            ? `${BASE}/`
            : `${BASE}${route}`
          : route === "/"
          ? `${BASE}/${locale}/`
          : `${BASE}/${locale}${route}`;
      return { url: path, lastModified };
    }),
  );

  // Trust 페이지 EN만 (Phase 3에서 locale 추가)
  const trustEntries = TRUST_ROUTES.map((route) => ({
    url: `${BASE}${route}`,
    lastModified,
  }));

  return [...localeEntries, ...trustEntries];
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```
npx vitest run src/app/sitemap.test.ts
```
Expected: 6 tests pass

- [ ] **Step 5: 전체 테스트 + tsc + lint 실행**

```
npx vitest run
```
Expected: ~202 tests pass (기존 192 + 신규 ~10)

```
npx tsc --noEmit
```
Expected: 에러 없음

```
npx eslint src --max-warnings=2
```
Expected: 기존 2건 이하 (신규 경고 없음)

- [ ] **Step 6: next build 최종 검증**

```
npx next build
```
Expected 라우트:
```
○ /                      (from [locale]/page)
○ /inyeon                (from [locale]/inyeon)
○ /ja/                   
○ /ja/inyeon             
○ /ko/                   
○ /ko/inyeon             
○ /zh-TW/                
○ /zh-TW/inyeon          
○ /about                 (static)
○ /faq                   (static)
○ /privacy               (static)
○ /terms                 (static)
ƒ /api/daily-fortune     (dynamic)
```

- [ ] **Step 7: task-log.md 업데이트**

사이클 26 완료 항목에 기록:
- 사이클 27 — 멀티랭귀지(Phase 2) 출하 완료
- 4개 locale, ~202 tests, tsc/lint clean, 8라우트 + 4 trust static

- [ ] **Step 8: 최종 커밋**

```
git add src/app/sitemap.ts src/app/sitemap.test.ts task-log.md
git commit -m "feat(i18n): sitemap 4 locale × 코어 URL + 빌드 검증"
```

---

## 사용자 후속 작업 (배포 후)

1. **Supabase SQL Editor 실행:** `docs/supabase-migration.sql`의 daily_fortunes locale DDL
2. **번역 검토:** JA/KO/ZH-TW 텍스트가 KSaju 톤·타겟(K-pop 팬)과 맞는지 확인 후 필요 시 수정
3. **시각 검증:** 각 locale(`/ja/`, `/ko/`, `/zh-TW/`)에서 헤더 스위처·번역 UI 노출·Fortune 카드 카테고리명 확인
