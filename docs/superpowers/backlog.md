# KSaju Backlog — 향후 사이클 후보

> 현재 진행 중인 spec/plan 너머의 작업. 우선순위/스코프는 시점마다 재평가.
> 각 항목은 별도 spec → plan → 구현 사이클로 진입한다.

---

## A. 분석 / 관리자 트랙 (Analytics & Admin)

### A1. Visitor analytics 도입
**문제:** 누가 얼마나 들어오고 얼마나 머물다 가는지 데이터 없음.
**후보 솔루션:**
- **Vercel Web Analytics** (무료 hobby tier, 쿠키 없음, GDPR 친화) — 1차 추천
- **Vercel Speed Insights** (CWV 모니터링) — A1과 함께 도입 검토
- 향후 더 깊은 product analytics 필요 시: PostHog, Plausible, Umami
**스코프:** 작음 (~0.5일). `@vercel/analytics` + `@vercel/speed-insights` 패키지 설치 + layout.tsx에 컴포넌트 1줄씩.
**선행 조건:** 도메인 production 배포 + Vercel 프로젝트 연결 (현재 미)

### A2. 관리자 페이지 `/admin`
**문제:** 사용자 트래픽/체류 시간/사주 변환 빈도 등 봐야 함.
**핵심 결정 사항:**
- Auth: 누가 들어올 수 있나? (예: 이메일 화이트리스트 or Clerk/Auth.js, 초기엔 본인만)
- 데이터 소스: Vercel Analytics API (limited) vs 자체 DB로 로그 수집
- 표시: 차트 (recharts/visx) + 표 + 기간 필터
**의존:**
- A1이 먼저 (분석 데이터 발생)
- B1 (DB) 이후 본격 로그 수집
**스코프:** 중 (1-2주). 인증·라우팅·차트 컴포넌트.

### A3. SEO / Discoverability
- `/saju` 페이지의 OG 이미지 자동 생성 (Vercel OG)
- `sitemap.xml` 자동 생성 (langing + /saju 데모 케이스 몇 개)
- `robots.txt` + structured data (JSON-LD)

---

## B. 데이터 / 백엔드 트랙 (Persistence & Identity)

### B1. DB 통합 (Vercel Marketplace)
**문제:** 사용자 가입/저장, 분석 로그, 결제 기록 등 영속 저장소 필요.
**후보:** Neon Postgres (관계형, 일반 목적) / Supabase (Auth 포함 풀스택)
**선행:** 데이터 모델 spec 필요. 어떤 entity가 필요한지 (User, SajuQuery, Subscription, AnalyticsEvent 등).
**스코프:** 중 (드라이버 설치 + 마이그레이션 인프라 + 첫 entity 1개). 1주.

### B2. 사용자 가입 / 로그인
**선택지:** Clerk (Vercel Marketplace 네이티브) vs Auth.js v5 vs Supabase Auth
**기능:**
- 이메일 + 소셜 (Google/Apple) 로그인
- 본인의 사주 히스토리 저장 (재계산 안 해도 됨)
- premium 상태 추적
**스코프:** 중-대 (1-2주). middleware, 로그인/회원가입 UI, 세션 처리.

### B3. 사주 히스토리 페이지
- 로그인 사용자가 본인의 과거 조회 사주 목록 + 즐겨찾기
- B1 + B2 선행

---

## C. 수익화 트랙 (Premium & Billing)

### C1. Premium 서비스 정의
**문제:** Premium에서 뭘 줄 건지 명확화 필요. 후보:
- 대운(大運) 10년 운세 상세
- 신살(神煞), 공망(空亡), 12운성
- 깊이 있는 personality reading (AI 생성)
- 사주 PDF/이미지 export 고화질
- 광고 제거
- 다국어 (영/일/중) 풀 번역

### C2. 결제 통합
**후보:**
- **Stripe** (산업 표준, Vercel Marketplace에 ready)
- **Polar.sh** (developer-friendly, 더 간단)
- **Lemon Squeezy** (VAT/세무 처리해줌)
**기능:**
- 구독 (월/연) + 일회성 결제 (사주 단건 deep-read)
- 영수증, 인보이스, 환불, 구독 취소
- 한국 카드 결제 / 외국 카드 결제 처리 (PG 비교 필요 — 토스/카카오 등)
**스코프:** 중-대 (2주). 결제 페이지, webhook 처리, premium 상태 동기화.

### C3. 광고 (Free tier monetization)
- AdSense / Google Ads
- 직접 광고 (사주 관련 도메인 — 책, 운세 앱 cross-promo)
- 광고 영역 디자인이 한지/Cosmic 테마와 어울리는지 별도 검토

---

## D. 로깅 / 옵저버빌리티 트랙 (Logging & Observability)

### D1. 구조화 로깅
**문제:** Premium/결제 도입 시 디버깅·감사 필요.
**후보:**
- **Vercel Logs** (built-in, runtime 로그) — 1차 진입점
- **Axiom / Better Stack / Logtail** — 장기 보관, 검색
- **Sentry** — 에러 트래킹 + performance
**스코프:** 작음 (~0.5일). 로거 추상화 1개 + 핵심 분기점 instrument.

### D2. 결제 감사 로그 (audit trail)
- 결제 성공/실패/환불을 별도 테이블 또는 외부 audit log service에 저장
- 분쟁 발생 시 추적 가능해야 함
- B1 + C2 이후

### D3. 도메인 이벤트 추적
- 사용자 사주 조회 횟수, premium 전환 funnel
- PostHog 도입 후 funnel 정의

---

## E. 사주 도메인 확장 트랙

### E1. 음력 입력 옵션
- 사용자가 음력만 알 때 음→양 변환 후 사주 계산
- 음력 변환 라이브러리 또는 데이터 테이블 추가
- 입력 폼에 "양력 / 음력" 토글

### E2. 대운 (大運) 10년 운세
- 현재 spec L4 미반영분
- 남/여 순역(順逆) 다름 — 성별 입력 필요해짐
- UI: 10년 단위 타임라인 (현재 나이 기준 + 향후 50년)

### E3. 신살(神煞) / 공망(空亡) / 12운성
- 명리학 디테일 — 풀 패키지로 가려면 1-2 사이클
- L3 ship 후 "사주 reading depth"가 시장 검증된 다음 진입 권장

### E4. AI 사주 해석 (Claude API 통합)
- 4기둥 + 십신 + 오행 분포를 Claude/GPT에 던져 personalized reading 생성
- Premium feature 후보 (C1과 연결)
- Vercel AI Gateway 사용 검토 — provider 추상화 + 비용 추적

### E5. 사주 OG 이미지 자동 생성
- `/saju?params` 공유 시 사주 4기둥 미리보기 이미지를 Vercel OG로 동적 생성
- 한자 폰트 임베드 필요 (OG 이미지는 시스템 폰트 fallback 못 쓰므로 explicit embed)

---

## F. 디자인 / UX 폴리시 트랙

### F1. 사주 결과 카드 v2 (고급 시각화)
- 4기둥을 더 풍부한 시각화 (오행 wheel, 천간/지지 diagram)
- L3 ship 후 사용자 피드백 받아 진입 — 미리 디자인하면 placeholder 위 디자인 위험

### F2. 모바일 deep polish
- 현재는 핵심 동작 보장만 — 사주 결과 페이지의 typography, spacing, 한자 크기 등 정밀 폴리시
- 별도 사이클로 진입 권장 (디자인-only)

### F3. 다국어 (i18n)
- 영문 → 일본어, 중국어 (간/번체) 확장
- next-intl 도입
- 사주 도메인 한자는 동일 (CJK 공통), 설명문만 번역

---

## 우선순위 메모 (2026-05-22 시점)

다음 사이클은 **사주 4기둥 계산 (L3)** — 이 backlog와는 별개로 진행 중.

L3 ship 후 우선순위 후보:
1. **A1 Vercel Web Analytics** (5분 setup, 데이터 쌓기 시작)
2. **A3 SEO basics** (OG / sitemap / robots) — 트래픽 유입 채널 확보
3. **C1 Premium 정의 brainstorming** (실제 결제 트래픽 전 무엇이 가치 있는지 먼저 결정)
4. **E1 음력 입력 옵션** — 외국인 사용자가 의외로 음력만 아는 경우 많음
5. 나머지는 사용자 트래픽/피드백 봐가며

이 우선순위는 본 사이클 (L3) 끝나면 task-log "다음 사이클" 결정 시점에 재평가한다.
