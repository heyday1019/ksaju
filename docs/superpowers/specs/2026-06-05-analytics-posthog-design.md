# 프로덕트 분석 (PostHog, cookieless) — 사이클 15 설계 문서

> 작성일: 2026-06-05 · 상태: 승인됨 (브레인스토밍 통과)
> 맥락: ksaju.me Vercel 라이브(`ksaju-green.vercel.app`). 사용자 "관리자 대시보드 + 구글 로그인" 요청을 **호스티드 분석으로 리프레임**(대시보드/인증 자체 구축 금지).

## 한 줄 요약

방문 유입·퍼널을 **자체 대시보드/인증 없이** 측정한다. 호스티드 **PostHog**를 **cookieless(메모리) 익명** 모드로 붙이고, 핵심 퍼널 이벤트(생년 입력 → 아이돌 선택 → 카드 공개 → 공유)와 **국가(자동 GeoIP)·연령 버킷(생년 파생)**을 전송. PostHog 자체 대시보드가 곧 관리자 페이지.

## 원칙
- **자체 대시보드/인증/DB 미구축** — 호스티드 도구의 대시보드·로그인을 사용. (1인 개발 시간 보호.)
- **얇은 래퍼 시임**(`src/lib/analytics.ts`)으로 호출부가 `posthog-js`를 직접 import하지 않음 → 테스트·교체 용이.
- **키 없으면 no-op** — 로컬/dev/CI/현재 키없는 Vercel 배포 모두 무영향.
- **cookieless 익명** — 배너 불필요(EU·10대 청중 안전). 트레이드오프: unique/returning 부정확(세션 단위 퍼널은 정상).
- 원시 생년월일은 절대 전송 안 함(연령 **버킷**만).

## 범위

### 포함
1. `posthog-js` 의존성 + `src/lib/analytics.ts`(신규, 래퍼: `initAnalytics`/`track`/`ageBucket`).
2. `src/lib/analytics.test.ts`(no-op·capture·ageBucket 테스트).
3. `AnalyticsProvider`(신규 client) — 루트 layout 마운트, init + SPA 페이지뷰.
4. 호출부 6개 이벤트 계측(아래 표).
5. `/privacy` 정적 페이지 + 슬림 footer(Privacy 링크).
6. `.env.example`(+ `.env.local`은 사용자) + `docs/deploy-runbook.md`에 "분석 켜기" 섹션 추가.
7. 테스트 + 빌드 검증.

### 비포함
- 자체 분석 대시보드 페이지, Google/임의 로그인·인증.
- About/FAQ/Terms(후속 trust-pages 사이클; 이번엔 Privacy만).
- Vercel Web Analytics(PostHog 단일 소스).
- 동의 배너, returning-visitor 정확도, PostHog reverse-proxy.

## 컴포넌트 & 상세

### 1. 래퍼 `src/lib/analytics.ts` (client-safe)
- `initAnalytics()`: `NEXT_PUBLIC_POSTHOG_KEY` 없으면 즉시 return(no-op). 있으면 `posthog.init(key, { api_host: NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com", persistence: "memory", person_profiles: "never", capture_pageview: false })`. (페이지뷰는 수동.) 멱등(중복 init 가드).
- `track(event: AnalyticsEvent, props?)`: init 안됐으면 no-op, 됐으면 `posthog.capture(event, props)`. `AnalyticsEvent`는 아래 이벤트명 유니온 타입.
- `ageBucket(birthYear: number): AgeBucket`: 현재연도-생년으로 `"<13" | "13-17" | "18-24" | "25-34" | "35+"` 반환(경계 포함 규칙 아래).
- 내부 `initialized` 플래그로 상태 관리(모듈 스코프).

연령 버킷 경계(만 나이 근사 = 현재연도 - 생년):
- age < 13 → `"<13"`, 13–17 → `"13-17"`, 18–24 → `"18-24"`, 25–34 → `"25-34"`, ≥35 → `"35+"`.

### 2. `AnalyticsProvider` (신규 client, 루트 `layout.tsx` 마운트)
- mount 시 `initAnalytics()`.
- `usePathname()` 변경 시 `track("$pageview")`(또는 posthog.capture('$pageview')). App Router는 SPA 내비 페이지뷰 수동 필요.
- 키 없으면 전부 no-op(자식 렌더만).

### 3. 이벤트 (퍼널)
| 이벤트 | 위치 | props |
|---|---|---|
| `$pageview` | 라우트 변경 | (국가=PostHog GeoIP 자동) |
| `saju_calculated` | 홈 `handleSubmit` + `/inyeon` `handleSelfBirth` | `age_bucket` |
| `idol_picked` | `CompatibilitySection` 선택 | `idol`, `group`, `element` |
| `partner_submitted` | `PartnerCompatSection` 제출 성공 | — |
| `compat_revealed` | 궁합 모달 open + result 존재 | `kind: "idol"\|"partner"`, `score_bucket` |
| `card_shared` | `useShareImage` 공유 성공 | `kind`, `method: "web_share"\|"download"` |

- `element`: 아이돌 `dayMaster`의 오행(기존 saju 데이터에서 파생).
- `score_bucket`: 점수 0-100 → 예 `"0-39"|"40-59"|"60-79"|"80-100"`(원점수 대신 버킷).
- `card_shared.method`: `shareOrDownloadPng` 경로 결과 반영(현재 함수는 void → 어느 경로였는지 반환하도록 소폭 확장 또는 래퍼에서 분기). 구현 plan에서 확정.

### 4. `/privacy` + footer
- `src/app/privacy/page.tsx`(정적, metadata title). 공개: 익명 사용 이벤트 수집, 연령 버킷(생년 파생, 원시 DOB 미전송·미저장), 국가=IP 추정, 쿠키 없음, 제3자=PostHog, 엔터테인먼트 목적, 연락처.
- 슬림 footer(루트 layout 또는 `SiteFooter` 신규) — Privacy 링크. 후속 About/FAQ 사이클이 확장할 시드.

### 5. 설정
- `.env.example`: `NEXT_PUBLIC_POSTHOG_KEY=` + `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`.
- 사용자: PostHog 프로젝트 생성 → 키를 Vercel env(Production/Preview) + 로컬 `.env.local`에 추가.
- `docs/deploy-runbook.md`에 "Analytics 켜기" 섹션 추가(키 발급·등록 절차).

## 데이터/상태 흐름
```
layout(AnalyticsProvider) mount → initAnalytics() (키 있으면)
route change → $pageview
홈/인연 생년 제출 → saju_calculated{age_bucket=ageBucket(year)}
아이돌 선택 → idol_picked{idol,group,element}
상대 제출 → partner_submitted
궁합 모달 open(result) → compat_revealed{kind,score_bucket}
공유 성공 → card_shared{kind,method}
→ 모두 PostHog 익명 이벤트(메모리 persistence) → PostHog 대시보드/퍼널/브레이크다운
```

## 에러/엣지
- 키 부재 → 전 경로 no-op, 앱 정상.
- PostHog 로드 실패/네트워크 → track no-op(앱 영향 0; try/catch 감쌈).
- SSR: analytics는 client에서만(`"use client"`/effect). server 컴포넌트에서 import 금지.

## 테스트 (vitest)
- `analytics.test.ts`: (a) `track` 키없음/미init 시 no-op(posthog.capture 미호출), (b) init 후 `track`이 `posthog.capture`를 올바른 event/props로 호출(posthog mock), (c) `ageBucket` 경계값(12→"<13",13,17,18,24,25,34,35→"35+"). `initAnalytics` 키없음 시 init 미호출.
- 호출부 계측은 래퍼 mock으로 얇게(필요 시 1개 스모크). 과한 통합테스트 지양.
- 빌드: `npm run build` 성공(`/privacy` static 포함), 전체 스위트 그린.

## 검증
- `npm test` 그린(신규 analytics 테스트 포함).
- `npx tsc --noEmit` clean, `npm run lint` 신규 경고 0.
- `npm run build` — `/privacy` 라우트 생성, 키없이도 빌드/런 정상(no-op).

## 비목표 가드
- 대시보드/인증 코드 작성 금지.
- 원시 생년월일·시각 전송 금지(버킷만).
- 쿠키/localStorage 사용 금지(cookieless).
