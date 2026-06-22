# Apps in Toss 미니앱 (K사주) — 설계 문서

> 작성일: 2026-06-22 · 브랜치: `feat/apps-in-toss`
> 목표: 기존 KSaju(Next.js) 의 사주 엔진을 재사용해, 앱인토스(Apps in Toss) WebView
> 미니앱 버전을 **독립 Vite SPA**로 만든다. UI 텍스트는 한국어 전용, 외부 링크·외부
> 통신 전면 배제(오프라인 결정적 동작).

---

## 1. 배경 / 제약

- **Apps in Toss web-framework 는 Vite SPA 모델.** `@apps-in-toss/web-framework` 설치 후
  `npx ait init` 으로 `granite.config.ts` 생성. 설정의 `web.commands` 가 `dev: vite`,
  `build: tsc -b && vite build` 를 전제한다. 따라서 KSaju 의 Next.js 서버 기능
  (Server Action `calcUserSaju`, API routes `daily-fortune`/`tarot-reading`/
  `tarot-spread-reading`)은 **그대로 동작하지 않는다.**
- 결론: 미니앱은 **Next 앱의 포팅이 아니라, 순수 로직 엔진을 재사용하는 새 Vite SPA**.
  React 컴포넌트는 Next(next-intl·next-themes·App Router·server action)에 강결합돼 있어
  재사용 불가 → UI 는 한지 미감을 경량 재구성한다.
- 사용자 결정(2026-06-22 브레인스토밍):
  1. **코드 구조:** 신규 폴더 + libs **복사**(완전 독립, 크로스 import 없음).
  2. **리딩 엔진:** **룰베이스/정적 큐레이션만**. OpenRouter·Supabase·LLM 전부 제거.
  3. **기능 범위:** 4화면 전부 — 내 사주+운세 / 아이돌 궁합 / 오늘의 타로 / 타로 스프레드.
  4. **UI:** KSaju 한지 미감 경량 재현(TDS 미사용).
  5. **primaryColor:** 진달래 핑크 `#C8385A`.

---

## 2. 비목표 (YAGNI — v1 에서 만들지 않음)

- Supabase, PostHog, Vercel Analytics, OpenRouter(LLM) — 전부 제외.
- next-intl(한국어 하드코딩), next-themes(라이트 한지 전용, 다크 토글 없음).
- SEO/OG/robots/sitemap, trust 페이지(About/FAQ/Terms/Privacy).
- **외부 링크 일체 배제:** QR 코드(gen-qr), ksaju.me 사이트 링크, ko-fi 후원 링크,
  공유 카드 워터마크 URL. → 공유 카드 푸터는 외부 링크 없는 버전으로 교체.
- 일반 상대(인연) 궁합은 v1 범위 밖(아이돌 궁합만). 필요 시 v2.

---

## 3. 디렉터리 구조

```
apps-in-toss/                      # 자체 package.json·node_modules (완전 독립)
├─ granite.config.ts
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ package.json
└─ src/
   ├─ main.tsx                     # ReactDOM 부트스트랩
   ├─ App.tsx                      # 라우팅(react-router-dom) + 한지 셸/네비
   ├─ lib/                         # 기존 src/lib 에서 복사(순수 로직만)
   │   ├─ saju.ts                  #  └ "server-only" import 제거, 클라에서 직접 호출
   │   ├─ kst-converter.ts · kst-data.ts · kst-types.ts
   │   ├─ compatibility.ts
   │   ├─ idols.ts
   │   ├─ fortune.ts
   │   ├─ reading.ts
   │   ├─ tarot.ts
   │   ├─ saju-data.ts · saju-types.ts · saju-display.ts
   │   └─ utils.ts
   ├─ content/ko/                  # ★ 신규 한국어 콘텐츠 레이어
   │   ├─ labels.ts                #  궁합 레이블·오행 관계 카피(영→한)
   │   ├─ fortune.ts               #  Money/Love/Career/올해 운세 카피(한국어)
   │   ├─ compat-readings.ts       #  궁합 fun 내러티브(한국어, reading.json 대체)
   │   └─ tarot-readings.ts        #  타로 카드 의미·일간별 리딩(한국어)
   ├─ data/                        # 기존 data/ 에서 복사
   │   ├─ ksaju-idol-db.json       #  124명/24그룹(사주 사전계산)
   │   └─ ksaju-tarot.json         #  78장
   ├─ screens/
   │   ├─ MySajuScreen.tsx         #  생일 입력 → 4기둥·오행·운세
   │   ├─ CompatScreen.tsx         #  아이돌 검색·선택 → 궁합 결과
   │   ├─ TarotScreen.tsx          #  오늘의 카드 1장
   │   └─ TarotSpreadScreen.tsx    #  과거-현재-미래 3장
   └─ components/                  # 한지 미감 경량 컴포넌트
       ├─ BirthForm.tsx · PillarsGrid.tsx · WuxingBalance.tsx
       ├─ FortuneCard.tsx · IdolPicker.tsx · CompatResult.tsx
       ├─ TarotCard.tsx · ShareCard.tsx · ShareFooter.tsx
       └─ ui/ (버튼·인풋 등 최소 프리미티브)
```

---

## 4. 데이터 흐름 (전부 클라이언트·오프라인·결정적)

```
생일 입력 ─▶ birthToSaju(manseryeok, 브라우저) ─▶ UserSaju { pillars(4), dayMaster, 오행밸런스 }
   │
   ├─ 내 사주:  PillarsGrid + WuxingBalance + calcFortune(룰엔진)
   │            └▶ content/ko/fortune.ts 로 카피 매핑 → Money/Love/Career/올해 4카드
   ├─ 궁합:     IdolPicker → normalizeIdolSaju → calcCompatibility(점수/breakdown)
   │            └▶ content/ko/compat-readings.ts (일간오행×상대오행×티어) → fun 내러티브
   ├─ 오늘 타로: drawDailyCard(FNV-1a(4기둥+KST날짜)%78, 결정적)
   │            └▶ content/ko/tarot-readings.ts (카드×일간오행) → 한국어 리딩
   └─ 타로 스프레드: 같은 결정적 시드로 3장(중복 제거) → 과거/현재/미래
                └▶ content/ko/tarot-readings.ts 의 포지션별 리딩
```

- **LLM 자리 = 결정적 정적 큐레이션으로 대체.** 선택 키는 기존 `reading.ts` 패턴
  (일간 오행 × 상대/티어)을 그대로 사용 → 같은 입력엔 항상 같은 결과(테스트 가능).
- 사주 계산은 KST 기준(`convertToKST` → manseryeok). manseryeok·date-fns-tz 는
  브라우저 동작 확인됨(노드 전용 의존성 없음 — `server-only` 는 번들 크기 가드였을 뿐).

---

## 5. 한국어 콘텐츠 레이어

기존 엔진의 출력 문자열은 전부 영어다. 엔진(점수·드로우·키 선택)은 그대로 두고,
**문자열만 한국어 테이블로 분리**한다.

| 원본(영어) | 대체(한국어, content/ko) |
|---|---|
| `compatibility.ts` 의 레이블/오행관계 카피 | `labels.ts` |
| `fortune.ts` 의 카드 본문/키워드 | `fortune.ts` |
| `data/ksaju-readings.json` (궁합 내러티브 28라인) | `compat-readings.ts` |
| 타로 카드 의미·키워드·일간별 리딩(LLM 산출) | `tarot-readings.ts` |
| daily-fortune fallback 문장 | (내 사주 운세에 흡수) |

- 톤: 가볍고 fun, Gen Z 친화. "For entertainment 🌙" 디스클레이머 유지.
- 콘텐츠 분량이 작업의 큰 축 → 구현 단계에서 화면별로 점진 작성.

---

## 6. 공유 카드

- 9:16 PNG export(`html-to-image`) **유지** — KSaju 의 바이럴 핵심.
- `ShareCardFooter`(QR + ksaju.me)를 **외부 링크 없는 푸터**로 교체:
  앱명("K사주") + "For entertainment 🌙" 만. QR·URL·후원 링크 없음.
- 공유 수단: 앱인토스 web-framework 가 네이티브 공유 API 를 제공하면 우선 사용,
  없으면 `<a download>` 폴백. (구현 단계에서 프레임워크 공유 API 존재 여부 확인.)

---

## 7. granite.config.ts

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ksaju',                 // 콘솔 등록 App ID(배포 시 확정)
  brand: {
    displayName: 'K사주',
    primaryColor: '#C8385A',        // 진달래 핑크
    icon: '<콘솔 업로드 후 URL>',    // 사주 낙관 아이콘 재사용 가능
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  permissions: [],                  // 외부 통신·카메라 등 불필요 → 최소
  outdir: 'dist',
  webViewProps: { type: 'partner' },
});
```

---

## 8. 의존성 (apps-in-toss/package.json)

- 런타임: `react`, `react-dom`, `react-router-dom`, `@apps-in-toss/web-framework`,
  `@fullstackfamily/manseryeok`, `date-fns`, `date-fns-tz`, `lunar-javascript`(kst 의존 시),
  `zod`, `react-hook-form`, `@hookform/resolvers`, `motion`(타로 reveal), `html-to-image`,
  `clsx`, `tailwind-merge`.
- 빌드: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`+`@tailwindcss/postcss`,
  `vitest`+`happy-dom`+`@testing-library/react`(엔진·콘텐츠 키 선택 테스트 이식).
- **React 버전:** TDS 미사용이므로 React 19 우선. 단 web-framework 가 React 18 을
  핀하면 18 로 맞춘다(구현 1단계에서 확인).

---

## 9. 구현 단계 (writing-plans 에서 태스크화)

1. **스캐폴딩** — `apps-in-toss/` Vite+React+TS+Tailwind v4, `npm i @apps-in-toss/web-framework`
   → `npx ait init` → `granite.config.ts`(위 값). 빈 화면 `vite` 기동 확인.
2. **엔진 이식** — `src/lib` 복사, `saju.ts` 의 `server-only` 제거. manseryeok 클라
   빌드 동작 검증(RM/Jin known-answer 테스트 이식). idol-db·tarot json 복사.
3. **한국어 콘텐츠 레이어** — `content/ko/*` 작성(레이블·운세·궁합·타로). 결정적 키
   선택 테스트.
4. **4화면 UI** — 한지 경량 컴포넌트 + 라우팅. 생일 입력→내 사주→운세, 궁합, 오늘 타로,
   스프레드.
5. **공유 카드** — 외부 링크 제거 푸터 + (가능 시)토스 공유 API + 다운로드 폴백.
6. **토스 샌드박스** — 로컬 샌드박스 → 실기기 샌드박스 빌드·동작 확인. 배포(콘솔 업로드)는
   사용자 실행.

---

## 10. 위험 / 미해결

- **콘텐츠 분량:** 4화면 전부의 한국어 큐레이션은 적지 않음 → 단계적 작성, 화면별 커밋.
- **React 18 vs 19:** web-framework 핀 여부를 1단계에서 확정.
- **공유 API:** 프레임워크 네이티브 공유 지원 여부 미확인 → 다운로드 폴백 보장.
- **앱 아이콘/displayName/appName:** 콘솔 등록 값은 사용자가 배포 시 확정.
- **kst-converter 의 lunar-javascript 의존:** 복사 대상에 포함, 브라우저 동작 확인 필요.
```
