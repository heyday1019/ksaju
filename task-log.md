# KSaju Task Log

> 작업 일지. 매일 마지막에 오늘 한 일과 내일 시작 액션을 기록.

---

## 2026-06-09 (화)

### 📌 오늘 요약 (2026-06-09)

**사이클 22 — 공유 카드 유입 마그넷(브랜디드 QR 푸터) 출하.** subagent-driven 실행.

- **방향:** 다음 사이클 brainstorm → 성장·바이럴 레버 → 약한 고리=카드(유입 마그넷) → 사용자가 만든 낙관(사주 도장)으로 **브랜디드 QR**(낙관 중앙 삽입) → 두 공유 카드 공통 푸터.
- **구현:** ① 1회 생성기 `scripts/gen-qr.mjs`(`npm run gen:qr`)가 `qrcode`(레벨 H)+`sharp`로 낙관(`scripts/assets/stamp-saju.png`, 우하단 워터마크 센터-크롭)을 중앙 합성 → `public/ksaju-qr.png` 커밋. `qrcode`·`sharp`=devDep, 런타임 의존성 0. QR 디코드 검증=`https://ksaju.me`. ② 신규 공통 `src/components/share/share-card-footer.tsx`(`ShareCardFooter`)가 QR+"Make yours → ksaju.me"+디스클레이머 → `CompatShareCard`·`FortuneShareCard` 둘 다 교체(DRY). ③ 두 모달 캡션 "make yours at ksaju.me" 훅. ④ 루트 잔재 정리(.gitignore + 임시 json 4개 제거).
- **커밋:** spec `8e12d39` · plan `04201b3` · Task1 `fbe237d`+`5891ae5`(QR 에셋·경로 정리) · Task2 `02e80d0`(footer) · Task3 `78d45c5`(두 카드 연결) · Task4 `8e7a6ff`(캡션).
- **상태:** 170 tests(169+footer 1), tsc clean, lint 2 기존경고만, `next build` 전 라우트 static ○.
- **⚠️ 사용자 후속:** QR은 **ksaju.me DNS 연결 후에만 라이브**(그 전엔 스캔 실패). **육안 확인 권장:** 두 공유 카드 푸터가 640px 안에서 클리핑 없이 들어가는지(특히 운세 카드, 추정 슬랙 ~28px) + 라이트/다크/모바일. localStorage 사주 게이트라 브라우저 세션 필요.

**오후 추가 작업:**

- **사이클 23 — 아이돌 DB 2차 확장:** DB **101→124명 / 19→24그룹** — EXO·SHINee·MAMAMOO·GOT7·NMIXX 각 5명 추가. `npm run seed:idols` 스크립트 재사용(WebSearch 검증 생일). `idols.ts`·UI 무변경. (`13bd775`)
- **런치 준비 보완 — SEO/OG:** layout 메타데이터 확장(환경변수 URL·OG이미지·robots·themeColor·아이콘) + 소셜 OG 이미지 신규 생성(1200×630 274KB, `next/og`). (`81d6b22` · `96dee53`)
- **버그픽스 — compat-card:** 미니사주 한자 중앙정렬 + 박스 오버플로 수정. (`82ee92e`)
- **Vercel Analytics + Speed Insights 통합:** `@vercel/analytics` + `@vercel/speed-insights` 추가. import 경로·클라이언트 wrapper 픽스 3회 → `@vercel/speed-insights/next` 정식 설치로 확정. 총 4커밋(`4101461`·`3837dc1`·`be6746f`·`ba6ec13`).

---

## 2026-06-10 (수)

### 📌 오늘 요약 (2026-06-10)

**FAQ 연락처 이메일 변경 (소규모 콘텐츠 패치).**

- `/faq` 페이지 contact 링크 `hello@ksaju.me` → `ksaju.korea@gmail.com` (`src/app/faq/page.tsx`). ksaju.me 도메인 메일이 아직 미활성 상태이므로 Gmail 주소로 임시 교체.
- 커밋·푸시 완료.

### ▶️ 다음 세션 시작 액션

**현재 위치:** `main`(= origin/main 동기화). 배포: `ksaju-green.vercel.app` auto-deploy.

**우선순위 후속 작업:**
1. **ksaju.me DNS 연결** — `docs/deploy-runbook.md` §4 (사용자 직접 작업).
2. **PostHog 분석 활성화** — Vercel env에 `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` 추가 후 재배포.
3. **ksaju.me 도메인 메일 활성화 후 FAQ 이메일 재변경** — `hello@ksaju.me`로 복구 예정.

**보류 💤(트래픽 데이터 후 결정):** 런타임 LLM 리딩, 유료 IAP, POD 굿즈, 회원 계정.

---

## 2026-06-08 (월)

### 📌 오늘 요약 (2026-06-08)

주말 네트워크 중단 후 재개. 하루에 **3개 사이클 출하**(17·18·19, 모두 main) + **사이클 20 출하**(아이돌 DB 확장) + **사이클 21 출하**(`/inyeon` UX 폴리시).

- **사이클 20 — 아이돌 DB 확장:** DB 76→101명/14→19그룹(SEVENTEEN·NCT·ATEEZ·ZEROBASEONE·RIIZE 각 5명). 재사용 생성기 `scripts/seed-idols.mjs`(`npm run seed:idols`)가 `scripts/idol-seed.json`(WebSearch ≥2출처 검증 생일)→manseryeok 계산·병합(self-check·idempotent). 재생성 불변 테스트로 전 엔트리 고정. subagent-driven 실행. 164 tests. **main 병합·push 완료.**
- **사이클 21 — `/inyeon` UX 폴리시:** spec `2b55de2` · plan `2d2f7dc` · Task 1 `81e1277`(신규 `SajuSummaryBar` = 오행색 한자 + 일간 줄, `inyeon-view` 연결) · Task 2 `2d3575e`(`idol-picker`: 알파벳 정렬 `SORTED_GROUPS` · 검색 `autoFocus`+힌트 · 멤버수 알약 배지 · aespa 기본 펼침) · Task 3 `3cb73ad`(양 compat 섹션 "View … result again ✨" 재오픈 버튼, 기존 state 재사용). 프레젠테이션 전용(새 의존성·데이터·분석·엔진 변경 0). TDD(+5 tests). **169 tests**, tsc clean, lint 2 기존경고만, `/`·`/inyeon` static build ○. dev 부팅·라우트 200 확인(인터랙티브 픽커/바는 localStorage 저장 사주에 게이트 → 브라우저 세션 필요, 동작은 유닛테스트 커버). ff-merge `feat/inyeon-ux`→main→push.
- **git 신원:** repo-local `heyday1019`/`heyday1019@gmail.com`(사이클 19부터 적용).

— 이하 같은 날짜 이전 기록 —

### 📌 오늘 요약 (앞부분, 사이클 17~19)

주말 네트워크 중단 후 재개. 하루에 **3개 사이클을 출하**(모두 `main` ff-merge·push 완료).

- **사이클 17 — 운세 공유 카드(9:16 PNG):** 비활성 Share 티저 → 활성화. 전용 `FortuneShareCard`/`FortuneShareModal`, 사이클 13 export 엔진 재사용(신규 export 코드 0). (157 tests)
- **사이클 18 — Trust 페이지:** `/about`·`/faq`·`/terms` 정적 페이지(privacy 패턴 미러) + footer nav 4링크 + sitemap 6 URL(`/privacy` 포함). footer/sitemap TDD. (158 tests)
- **사이클 19 — 카드/아이돌 비주얼 폴리시:** IdolCard 오행 컬러 아바타 + 공유 카드 미니사주 오행색·간격 + 공유 `ELEMENT_TEXT` 맵 + name/group aria-label + 출생시간 카피 친근화. TDD. (162 tests)
- **워크플로:** 각 사이클 brainstorm → spec → plan → 인라인 실행(executing-plans, 태스크별 커밋) → `finishing-a-development-branch`(ff-merge). 전부 사용자 검토·승인 게이트 통과.
- **인프라:** git repo-local 신원 설정(`heyday1019` / `heyday1019@gmail.com`) — auto-config 경고 해소. 사이클 19 코드 커밋부터 적용(이전 커밋 author는 불변).
- **상태:** 테스트 157→162, tsc/lint clean(기존 2 warning만), `next build` 6 라우트 static ○. 라이브 `ksaju-green.vercel.app`(auto-deploy from main).

### ▶️ 다음 세션 시작 액션 (세션 회복)

**현재 위치:** `main`(= origin/main 동기화, `30f7bc3`). 작업 브랜치 없음. 큰 비주얼 폴리시 번들 종료.

**개발 후보(추천순):**
1. **아이돌 DB 확장** — `data/ksaju-idol-db.json`에 인기 그룹 추가(SEVENTEEN, NCT 등) + 기존 생일 나무위키 재검증(NewJeans/IVE/LE SSERAFIM만 검증됨). 사주는 manseryeok로 사전계산. 바이럴 커버리지↑, 저위험. 스키마/`normalizeIdolSaju` 그대로.
2. **`/inyeon` UX 다듬기** — 일반 상대 궁합 흐름·빈 상태·CTA 카피 등 사용성 개선.
3. **사이클 19 최종 eyeball(사용자)** — `/inyeon` 픽커 아바타 오행색이 사람마다 다른지 + 공유 카드 미니사주 한자 색·간격 시각 확인(다크/모바일). 어긋나면 미세 조정 사이클.

**사용자(비개발) 대기 작업:**
- `ksaju.me` 커스텀 도메인 DNS 연결(`docs/deploy-runbook.md` §4).
- Vercel env에 `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` 추가 후 재배포 → 프로덕션 분석 활성화.

**보류 💤(트래픽 데이터 후 결정):** 런타임 LLM 리딩, 유료 IAP, POD 굿즈, 회원 계정.

---

### ✅ 사이클 20 구현 완료 (아이돌 DB 확장 — 보이그룹 배치)

**결과:** plan Task 1→4 전부 실행 완료. `data/ksaju-idol-db.json` **76→101명 / 14→19그룹** — SEVENTEEN·NCT·ATEEZ·ZEROBASEONE·RIIZE 각 5명(합계 25명) 추가. 재사용 생성기 `scripts/seed-idols.mjs`(`npm run seed:idols`)가 큐레이트 `scripts/idol-seed.json`(WebSearch ≥2출처 생일 검증)을 manseryeok `calculateSaju`로 계산·병합(self-check·idempotent). `src/lib/idols.test.ts`에 재생성 불변 테스트 추가 — DB 전 엔트리(old+new)를 manseryeok 라이브 계산값과 대조·고정. `idols.ts`·UI 무변경. **164 tests pass**(162+2), tsc clean, lint=기존 2 warning만, `next build` 성공(6 라우트 static ○). 아이돌 픽커 최종 eyeball은 사용자 몫.

**커밋(브랜치 `feat/idol-db-expansion`):** `c50b3d9` regeneration test · `1bf7d64` seed list · `df28db7` generator + DB expansion (+ spec `4c9e8f0`·plan `a5104e1`·본 docs). 컨트롤러가 main ff-merge·push 처리.

---

### ✅ 사이클 19 구현 완료 (카드/아이돌 비주얼 폴리시)

**결과:** plan Task 1→5 전부 실행 완료(인라인). 순수 프레젠테이션 폴리시 4종 — ① IdolCard 아바타 모노그램을 일간 오행 튼트(/15)+오행색 글자로(`elementOf(idol.saju.dayMaster)`), ② 공유 카드 미니사주 한자 오행색+균일 간격(신규 `HanjaPillars`) & PillarsGrid char 간격, ③ IdolCard 결합 `aria-label`("이름, 그룹"), ④ BirthForm 출생시간 카피 친근화(한국어 전문용어 제거, 선택·정확도 명확화). DRY: 공유 `ELEMENT_TEXT` 맵을 `saju-display.ts`에 추가해 PillarsGrid·CompatShareCard가 공유. TDD: idol-card 오행클래스+aria-label, compat-card 오행색, ELEMENT_TEXT 단언. **162 tests pass**(158+4), tsc clean, lint=기존 2 warning만, `next build` 성공(6 라우트 static ○). dev 검증: 홈 출생시간 신규 카피 노출·구 "12지지" 제거 확인. 시각(아바타 색/한자 간격)은 테스트+빌드로 검증, 최종 eyeball은 사용자 몫.

**커밋(브랜치 `feat/visual-polish`):** `47aca69` ELEMENT_TEXT+grid · `c3b72b9` idol avatar · `48d3e25` compat mini-saju · `fc1fe1b` form copy (+ spec `aa5a52a`·plan `ad1f8cd`·본 docs). 이후 `finishing-a-development-branch`로 main ff-merge·push.

---

### ✅ 사이클 18 구현 완료 (trust 페이지)

**결과:** plan Task 1→6 전부 실행 완료. `/about`·`/faq`·`/terms` 정적 server 컴포넌트 신규(privacy 패턴 미러) + footer nav 4링크(About·FAQ·Privacy·Terms, `flex-wrap`) + sitemap 6 URL(`/privacy` 포함). footer/sitemap TDD 테스트 추가. **158 tests pass**, tsc clean, lint=기존 2 warning만(`form.tsx` ref·`saju-data.ts` YinYang), `next build` 성공(6 라우트 모두 static ○). dev curl 검증: 전 라우트 200 + 콘텐츠 마커·footer 4링크 확인.

**커밋(브랜치 `feat/trust-pages`):** `82b6b29` about · `f422a6a` faq · `6edbc7d` terms · `2c7cfce` footer · `a541bf0` sitemap (+ 본 docs 커밋). 이후 `finishing-a-development-branch`로 main ff-merge·push.

---

### 사이클 18: Trust 페이지 (About / FAQ / Terms) — 설계·계획 ✅ → 구현 완료 ✅

> 로드맵 잔여항목 #4(2026-06-05 기준). Privacy는 사이클 15 출하 → About/FAQ/Terms로 trust 세트 완성. AdSense 승인·SEO·신뢰 + footer 확장.

**결정(브레인스토밍):** ① 3개 별도 라우트(`/about`·`/faq`·`/terms`) — privacy 패턴 미러, SEO/AdSense 유리, 각 페이지 공유 가능. ② About = **브랜드 보이스**("KSaju is…", 중립·확장성, 개인정보 비노출). ③ sitemap에 누락됐던 `/privacy`도 함께 등록. ④ 영어 전용·인라인 JSX(i18n/MDX 오버헤드 없음). 카피는 3페이지 전체 영문 초안을 사용자가 **검토·승인**.

**범위:** 정적 server 컴포넌트 3개 + footer nav 4링크 확장 + sitemap 6 URL + footer/sitemap 테스트(TDD). **비범위:** CMS/MDX/i18n, 새 디자인 시스템, 클라이언트 JS·분석, privacy 재설계.

**산출물:** spec `docs/superpowers/specs/2026-06-08-trust-pages-design.md`(`779d942`) · plan `docs/superpowers/plans/2026-06-08-trust-pages.md`(`aa1c89e`). **구현 완료** — 위 "✅ 사이클 18 구현 완료" 참고.

---

### 사이클 17: 운세(fortune) 공유 카드 (9:16 PNG) — 완료 ✅ (main 병합·push)

> 로드맵 잔여항목 #6(2026-06-05 기준). "내 사주" 운세의 Share가 비활성 티저였음 → 사이클 13 이미지 export 엔진(`share-image.ts`/`useShareImage`)과 사이클 13 `CompatShareCard`·`CompatibilityModal` 패턴을 재사용해 활성화. 주말 네트워크 중단 후 재개(2026-06-08).

**결정(spec/plan):** 신규 엔진·궁합·카피·데이터·i18n·런타임 LLM **0**. 전용 9:16 `FortuneShareCard`(360×640 → pixelRatio 3 → 1080×1920)가 `calcFortune`을 내부 직접 호출(prop 스레딩 없음, `CompatShareCard`가 `getReading` 부르는 패턴과 동일). 모달 본문=카드(미리보기=export). `FortuneSection`의 disabled Share 티저 → 활성 버튼 + 모달 + `card_shared {kind:"fortune"}` 분석 이벤트.

**구현 결과:** 일간 히어로(한자+오행 라벨+키워드) + 4운세(Money/Love/Career/This Year, 오행색 티어 배지) + `ksaju.me`/`For entertainment 🌙` 워터마크의 9:16 카드. 자동 검증 **157 tests pass**(card render + modal smoke 2 + section Share enabled), tsc clean, lint 신규 경고 0(기존 form.tsx/saju-data.ts 2건만), `next build` 성공(`/`·`/inyeon` static ○).

**커밋(최신순):**
- `5907752` T3: Share 활성화 — 카드 모달 오픈 + `card_shared` 분석
- `ba03773` T2: `FortuneShareModal` — 미리보기 본문 + Share 버튼
- `d091397` T1: 9:16 `FortuneShareCard`(일간 히어로 + 4운세)
- `8b99bc0` plan · `2755f19` spec

**신규:** `src/components/fortune/fortune-share-card.tsx`(+test) · `fortune-share-modal.tsx`(+test). **수정:** `fortune-section.tsx`(+test, Share 활성화).

**재사용 무변경:** `share-image.ts`, `use-share-image.ts`, `fortune.ts`, `saju-display.ts`(`dayMasterInfo`/`WUXING_META`).

**남은 것:** ① 사용자 수동 시각 검증(`npm run dev`: `/` 생일 입력 → Your Fortune 섹션 → Share ✨ → 모달 9:16 카드 노출 → PNG ~1080×1920 다운로드, 한글/한자 글리프 정상, 다크/모바일 — 4라인+히어로가 640px에서 밀도 높음, 클리핑 시 간격 조정). ② `finishing-a-development-branch`(feat/fortune-share → main 병합·push).

---

## 2026-06-05 (금)

### 🗺️ 남은 작업 / 로드맵 (2026-06-05 기준)

**현재 상태:** ksaju.me MVP가 Vercel에 라이브(`ksaju-green.vercel.app`, `main` 자동배포). 이미지 export·런치메타·분석까지 완료. `main`=`origin/main` 동기화됨.

**진행 중:** 사이클 16(궁합 카드 fun 리딩) — 구현 완료(154 tests·tsc·lint·build green, 카피 사용자 승인). **수동 시각 검증 + 브랜치 마무리(feat/compat-reading → main)** 만 남음.

**남은 작업 (우선순위순):**
1. ✅ **사이클 16 — 궁합 카드 fun 리딩** (구현 완료): `data/ksaju-readings.json`(25 쌍+3 티어) + `reading.ts` `getReading` + 카드 히어로. 남은 것: 수동 시각 검증·브랜치 마무리.
2. ⏳ **사용자: ksaju.me 커스텀 도메인 연결** — `docs/deploy-runbook.md` §4 (Vercel Domains + 레지스트라 DNS). 현재 `*.vercel.app`만.
3. ⏳ **사용자: 프로덕션 분석 활성화** — PostHog 키를 **Vercel env**(Production/Preview)에 추가 + redeploy(`docs/deploy-runbook.md` §6). 로컬 `.env.local`은 검증 완료(이벤트 수신 확인). PostHog에서 퍼널·idol 브레이크다운·age_bucket 대시보드 구성.
4. ⏳ **trust 페이지** (About / FAQ / Terms) — SEO·AdSense·신뢰. Privacy는 사이클 15에서 출하됨. footer 확장.
5. ⏳ **카드·아이돌 비주얼 폴리시** — 아이돌 아바타 오행별 색상(火→핑크/水→청자/木→녹색/金→회색/土→갈색), 동명이인 name+group 구분, 입력폼 출생시간 툴팁, 카드 한자 간격.
6. ⏳ **운세(fortune) 공유 카드** — 사이클 13 이미지 export 엔진 재사용(`FortuneShareCard`). 현재 운세 Share는 비활성 티저.
7. 💤 (보류) 런타임 LLM 리딩·유료 IAP·POD 굿즈·회원 계정 — 트래픽 데이터(분석) 본 뒤 판단.

**검증 베이스라인:** 전체 154 tests pass, tsc/eslint clean, `next build` static OK.

---

### 사이클 16: 궁합 카드 fun 리딩 (큐레이티드 라이브러리) — 구현 완료 ✅ (수동 시각 검증만 남음)

> 사용자 갭 #1(🔴). "점수+레이블=분석, 내러티브=감정 — 사람은 감정을 공유한다." 공유 욕구 레버.

**결정(브레인스토밍):** 런타임 LLM 미사용 — LLM은 **오프라인 저작 도구**. 큐레이티드 라이브러리(`data/ksaju-readings.json`, 28 스니펫 = 25 정렬 오행쌍 + 3 점수티어) → `getReading()` 순수·결정적 함수(`fortune.ts` 패턴). 내러티브=카드 **감정 히어로**, breakdown 불릿 **제거**. 아이돌+상대 둘 다 자동. 영문·fun·건전(teen)·2-3줄·전 라인 사용자 리뷰.

**구현 결과:** 궁합 공유 카드에 개인화된 2-3줄 fun 내러티브를 점수/레이블 바로 아래 **감정 히어로**로 추가하고, 분석 breakdown 불릿(Day Master/Branch)을 카드에서 제거. `getReading(mePillars, otherPillars, score)`는 **내 일간 오행 × 상대 일간 오행 × 점수 티어**(high≥75/mid 50-74/low<50)로 정적 JSON에서 결정적 선택 — 런타임 LLM·API키·KV 0. `STEM_ELEMENT`는 `HEAVENLY_STEMS`(saju-data)에서 파생(compatibility.ts의 private STEM_ELEMENT와 동일 소스, DRY). `CompatShareCard`가 보유 props로 내부 직접 호출 → 아이돌(CompatibilitySection)·상대(PartnerCompatSection) **둘 다 자동 적용**(prop 스레딩·모달/섹션 변경 0). 전체 **154 tests pass**(reading 4 신규 + 카드 테스트 갱신), tsc clean, lint 신규 경고 0(기존 2건만), `next build` 성공(전 라우트 static ○). 카피 28라인 **사용자 리뷰 통과(수정 없이 승인)**.

**커밋(최신순):**
- `e701063` T3: 리딩=카드 히어로, breakdown 불릿 제거 (카드+테스트 갱신)
- `9533d06` T2: `getReading` 결정적 순수함수 (오행쌍 × 점수티어, 4 tests)
- `f701ffc` T1: `data/ksaju-readings.json` 큐레이티드 카피 (25 쌍 + 3 티어)
- `1ddd924` plan · `89a95cc` spec

**신규:** `data/ksaju-readings.json` · `src/lib/reading.ts`(+test). **수정:** `src/components/compat/compat-share-card.tsx`(+test).

**남은 것:** ① 사용자 수동 시각 검증(`npm run dev`: `/inyeon` → 아이돌/상대 궁합 → 모달 카드에 리딩이 점수 아래 노출·breakdown 불릿 부재·Share PNG에 포함·다크/모바일) ② `finishing-a-development-branch`(feat/compat-reading → main 병합·push).

**향후 시임:** LLM 라이브 생성 업그레이드 시 동일 `getReading` 시그니처 뒤로 교체 가능(설계상 열어둠).

---

### 사이클 13.5: `/inyeon` 아이돌 그룹 아코디언 — 완료 ✅ (main 병합·push)

> 사용자 피드백: 아이돌 전체가 펼쳐져 일반 상대 궁합 폼이 한참 아래로 밀려 첫 방문자가 못 봄.

**구현 결과:** `IdolPicker` 브라우즈 모드를 아코디언으로 — 그룹 헤더=토글 버튼(이름+멤버수, ▸/▾), **한 번에 하나만 펼침**, 기본 전부 접힘 → 목록이 짧아져 "Or someone else" 폼이 fold 위로. 검색 모드는 플랫 결과 유지. aria-expanded/controls. 테스트 7개로 갱신(접힘 기본·펼침/접힘·아코디언 전환·그룹 내 단일선택). 커밋 `a436e3f`. 144 tests pass·tsc·lint·build OK. `main` 병합·push 완료.

---

### 사이클 15: 프로덕트 분석 (PostHog, cookieless) — 구현 완료 ✅ (사용자가 키로 활성화)

> 맥락: ksaju.me Vercel 라이브(`ksaju-green.vercel.app`). 사용자의 "관리자 대시보드 + 구글 로그인" 요청을 **호스티드 분석으로 리프레임**(대시보드/인증 자체 구축 안 함 — 1인 개발 시간 보호). 다음 후보: LLM fun 리딩(공유 욕구 폭발 레버) / About·FAQ·Terms trust 페이지 / 카드·아이돌 비주얼 폴리시.

**구현 결과:** 유입·퍼널을 자체 대시보드/인증 없이 측정. 얇은 래퍼 `src/lib/analytics.ts`(`initAnalytics`/`track`/`ageBucket`/`scoreBucket`)가 `posthog-js`를 cookieless(메모리)·익명으로 init하고 **키 없으면 전부 no-op**(로컬/CI/키없는 Vercel 무영향). `AnalyticsProvider`(루트 layout)가 init+SPA 페이지뷰. 6 이벤트: `$pageview`·`saju_calculated`(age_bucket)·`idol_picked`(idol/group/element)·`partner_submitted`·`compat_revealed`(kind/score_bucket)·`card_shared`(kind/method). `shareOrDownloadPng`가 `ShareOutcome`(web_share/download/cancelled) 반환 → `useShareImage` `onShared` → 섹션이 method 트래킹. `/privacy` 페이지 + 슬림 footer 추가. 전체 **150 tests pass**, tsc clean, eslint 기존 2건만, `next build` 성공(키 없이도 — `/privacy` 포함 static ○).

**브레인스토밍 결정:** 자체 대시보드/인증 미구축(호스티드 PostHog) / cookieless 무배너(unique 정확도 희생 수용) / 원시 DOB 미전송(연령 버킷만) / Privacy만 이번 사이클(About·FAQ·Terms 후속) / PostHog 단일소스(Vercel Analytics 제외).

**커밋(최신순):** `feat(privacy)`(T6) · `feat(analytics): funnel events`(T5) · `feat(share): onShared method`(T4) · `feat(analytics): AnalyticsProvider`(T3) · `feat(analytics): PostHog wrapper`(T2) · `build: posthog-js`(T1) · `docs: env+runbook`(T7) · plan·spec(`6da6b6f`).

**신규:** `src/lib/analytics.ts`(+test) · `src/components/analytics/analytics-provider.tsx` · `src/app/privacy/page.tsx` · `src/components/layout/site-footer.tsx` · `.env.example`. **수정:** `share-image.ts`(+test)·`use-share-image.ts`·`compatibility-modal.tsx`·`layout.tsx`·`page.tsx`·`inyeon-view.tsx`·`compatibility-section.tsx`·`partner-compat-section.tsx`·`.gitignore`(`!.env.example`)·`docs/deploy-runbook.md`.

**남은 것(사용자):** ① PostHog 프로젝트 생성 → `NEXT_PUBLIC_POSTHOG_KEY`를 Vercel env + `.env.local`에 추가 → redeploy(`docs/deploy-runbook.md` §6) ② PostHog에서 퍼널·idol 브레이크다운 구성 ③ 브랜치 마무리(feat/analytics-posthog → main).

---

### 사이클 14: 프로덕션 런치 준비 — 구현 완료 ✅ (배포 실행은 사용자 런북)

> CLAUDE.md 로드맵 **step 9**(Vercel 배포)의 선행 dev 작업. 다음은 사용자가 `docs/deploy-runbook.md` 실행(push→Vercel→DNS).

**구현 결과:** `ksaju.me` 소프트 론칭 준비. 소셜 링크 프리뷰(루트 metadata `metadataBase`+OpenGraph+Twitter 카드 + 코드생성 `opengraph-image.tsx`(next/og 1200×630, 한지 팔레트·井 모티프·Latin)), 검색엔진 기본(`robots.ts` 전체허용+sitemap / `sitemap.ts` `/`·`/inyeon`), 피벗 잔재 정리. 전체 **146 tests pass**(robots/sitemap +2), tsc clean, eslint 기존 경고 2건만, `next build` 성공 — `/`·`/inyeon`·`/opengraph-image`·`/robots.txt`·`/sitemap.xml` 모두 static ○.

**브레인스토밍 결정:** 스코프=폴리시 먼저 후 배포 / OG 이미지=코드생성(next/og), Latin v1(CJK 폰트 임베딩 보류) / robots=indexable / 배포·DNS=사용자 런북 분리(env var 0, zero-config).

**커밋(최신순):**
- `docs: deploy runbook` (T6) · 이후 docs 마무리(T7)
- `feat(seo): metadataBase + OpenGraph + Twitter` (T4)
- `feat(seo): code-generated 1200x630 OG image (next/og)` (T3)
- `feat(seo): sitemap.xml — / and /inyeon` (T2)
- `feat(seo): robots.txt — allow all + sitemap reference` (T1)
- plan · spec (`74bcdd9`)

**신규:** `src/app/robots.ts`(+test) · `src/app/sitemap.ts`(+test) · `src/app/opengraph-image.tsx` · `docs/deploy-runbook.md`. **수정:** `src/app/layout.tsx`(metadata 확장).

**plan 대비 deviation:** Task 5(`_org` 잔재 삭제) — `layout_org.tsx`/`page_org.tsx`/`globals_org.css`는 **gitignore된 untracked 로컬 파일**(추적된 적 없음)로 판명 → 워킹트리에서만 rm, 커밋 없음(추적 대상 0). 결과(잔재 제거)는 동일.

**남은 것:** ① 사용자 수동 시각 검증(빌드/OG 카드) ② `docs/deploy-runbook.md` 실행(push→Vercel import→ksaju.me DNS) ③ 브랜치 마무리(feat/launch-readiness → main).

---

### 사이클 13: 이미지 export 공통 기반 — 구현 완료 ✅ (수동 시각 검증 + 브랜치 마무리 남음)

> CLAUDE.md 로드맵 **step 13**(+step 7/8 부분 충족). 선행: 사이클 12(범용 `CompatibilityModal`). 다음은 step 9 Vercel 배포.

**구현 결과:** 운세·궁합 공유 PNG의 **재사용 export 엔진** + 궁합 결과 9:16 카드. 모달 본문이 카드 자체(미리보기=export)가 되고 Share ✨ 버튼이 클라이언트에서 `html-to-image`로 캡처 → Web Share API(파일)→다운로드 폴백. 전체 **142 tests pass**, tsc clean, eslint 기존 경고 2건만, `next build` 성공(`/`·`/inyeon` 모두 static ○ — `html-to-image`는 client-only라 static export 무해).

**브레인스토밍 결정:** 캡처전략=전용 9:16 오프스크린 레이아웃(화면UI 캡처 X) / 범위=공통엔진+**궁합 카드만**(운세는 다음 사이클 엔진 재사용) / 전달=**Web Share + 다운로드 폴백** / 카드 본문=모달 미리보기 겸용(A안) / 생성=클라이언트 onClick / 폰트=next/font self-host + `document.fonts.ready` / 브랜딩=워드마크+entertainment(QR 보류).

**커밋(최신순):**
- `9286237` T5: 모달 본문=9:16 share card + Share 버튼 (+smoke test, 3 cases)
- `26a9d91` T4: `CompatShareCard` 전용 9:16 export 레이아웃 (+render test, `CompatOther` 카드로 이전)
- `1ccd659` T3-fix: share-image 테스트 불필요 `@ts-expect-error` 제거(TS2578)
- `7538150` T3: `useShareImage` 훅 — 비동기 share 상태 래퍼
- `8f9863b` T2: `share-image.ts` 엔진 — 캡처 + web-share/download (7 tests)
- `31ff707` T1: `html-to-image` 의존성 추가
- `44c8e94` plan · `6cf8f6d` spec

**신규 파일:** `src/lib/share-image.ts`(+test) · `src/hooks/use-share-image.ts` · `src/components/compat/compat-share-card.tsx`(+test). **수정:** `compatibility-modal.tsx`(본문 교체) · `package.json`.

**리뷰:** T2~T5 각 독립 spec+quality 리뷰 통과(SPEC ✅/QUALITY ✅, T5 INTEGRATION ✅). 주목할 deviation: T4 테스트 픽스처가 무효 `type:"combine"`→유효 union(`"combo"`/`"three-harmony"`)으로 정정 + RM 2곳 렌더로 `getAllByText` 사용(둘 다 정당). T3에서 plan 테스트의 `@ts-expect-error`가 실제론 불필요(cast가 delete를 합법화)해 TS2578 → 제거. T5 smoke test는 plan의 `/close/i` 쿼리가 Radix 내장 X("Close")와 ghost 버튼 양쪽 매칭 → 모호 → 인라인 에러 메시지 대기로 교체.

**Deferred(비차단):** `useShareImage`의 inline `shareMeta` 객체가 매 렌더 새 참조(콜드 경로라 무해) / 운세 `FortuneShareCard`(다음 사이클) / 모달 카드가 width 360 고정이라 좁은 폰에서 `transform: scale` 미적용(현재 dialog max-w-[360px]로 충분, 추후 반응형 스케일 검토).

**남은 것:** ① 사용자 수동 시각 검증(아래 체크리스트) ② 최종 코드리뷰 ③ `finishing-a-development-branch`(feat/image-export → main 병합·push).

**수동 시각 검증 체크리스트(`npm run dev`):**
1. `/inyeon` → 사주 입력/복원 → 아이돌 선택 → 모달에 9:16 카드(점수·label·양쪽 미니사주 한자 비공백·`ksaju.me`·`For entertainment 🌙`).
2. Share ✨(데스크톱) → `ksaju-compat.png` 다운로드 → 한글/한자 글리프 정상(폰트 임베딩)·~1080×1920.
3. 다크모드 토글 → 카드 가독성.
4. 모바일 뷰포트(iPhone) → 카드 fit·Share 동작.
5. 에러 경로(오프라인 등) → 인라인 "Couldn't create image — try again" + 모달 유지.

---

### 사이클 12: '인연' 페이지 (궁합 이전 + 일반 상대 궁합) — 완료 ✅ (main 병합·push 완료)

> CLAUDE.md 로드맵 **step 12**. 선행: 사이클 11(`/inyeon` 플레이스홀더). 다음은 step 13 "이미지 export 공통 기반".

**구현 결과:** `/inyeon` 플레이스홀더를 실제 '인연' 페이지로 교체. (a) K-pop 최애 궁합을 홈→`/inyeon` 이전(홈 `SajuResult`는 인라인 `CompatibilitySection` 제거 → `/inyeon` CTA 링크), (b) 일반 상대 궁합 `PartnerCompatSection`(이름 optional + 생일 → `calcUserSaju` → `calcCompatibility`) 추가. `CompatibilityModal`을 아이돌 전용→범용(`idol`→`other:{name,sub?,pillars}`)으로 일반화해 두 케이스 재사용. 홈↔인연 본인 사주 공유는 `src/lib/saju-storage.ts`(localStorage `ksaju:userSaju:v1`). `BirthForm`에 `submitLabel`/`submittingLabel` props 추가. `/inyeon`은 얇은 server wrapper(`page.tsx` metadata 유지) + client `InyeonView` 패턴. 전체 **133 tests pass**, tsc clean, `next build` 성공(`/`·`/inyeon` 모두 static ○), eslint 기존 경고 2건만.

**커밋(최신순):**
- `feat(home)` T7: 홈 saveUserSaju + SajuResult 인라인 궁합 → `/inyeon` CTA (+테스트 갱신)
- `feat(inyeon)` T6: page → server wrapper(InyeonView 렌더), 플레이스홀더 page.test.tsx 제거
- `feat(inyeon)` T5: `InyeonView` — storage 로드 + 아이돌·상대 두 섹션 (+2 tests)
- `7769a41` T4-fix: PartnerCompatSection 이중제출 가드 + stale 결과 리셋
- `2a74382` T4: `PartnerCompatSection` 일반 상대 궁합
- `99b13c0` T3: `CompatibilityModal` 범용화 (idol→other)
- `0670523` T2: `BirthForm` submit/submitting 라벨 props
- `4a71a1c` T1: `saju-storage.ts` localStorage 영속

**브레인스토밍 결정:** 범위=한 사이클에 a+b 모두 / 크로스페이지=localStorage 영속 / 레이아웃=세로 스택 / 상대 이름 optional 추가(모달 "You × {name}").

**마무리:** `dev`→`main` fast-forward 병합, `origin/main`·`origin/dev` push 완료(`196b377`). dev 영속 브랜치 유지.

**남은 검증(직접):** `npm run dev` 수동 시각 검증 — 홈 사주→CTA→/inyeon 자동표시→아이돌+상대 궁합 모달, 새로고침 후 me 유지, 미저장 새 브라우저 폴백 폼.

**Deferred(비차단):** BirthForm "Born in" 라벨이 상대 컨텍스트에선 모호(다음 BirthForm 수정 시) / Them 폴백·에러경로 테스트 보강 / saju 요약카드 일간·오행 미표시(기둥만).

---

## 🎯 다음 할 일 — 사이클 13: 이미지 export 공통 기반 (CLAUDE.md step 13)

> **MVP의 가장 큰 남은 조각이자 바이럴의 핵심.** 운세·궁합 결과를 SNS 공유용 PNG로 내보내기. 현재 FortuneSection 공유는 비활성 티저, 궁합 모달엔 워터마크만 있고 다운로드 없음.

**목표:** 9:16 세로 카드 PNG 다운로드(IG Story/TikTok 규격). 운세 카드 + 궁합 결과 두 곳에서 재사용 가능한 공통 export 기반.

**기술 후보:** `html-to-image`(toPng) — DOM→PNG. 폰트/이미지 CORS·웹폰트 임베딩 주의. 대안 `dom-to-image-more`, `modern-screenshot`. (정식 결정은 브레인스토밍에서.)

**브레인스토밍에서 정할 것:**
1. 공유 카드 디자인 — 화면 표시용 UI를 그대로 캡처할지 vs 전용 9:16 export 레이아웃(오프스크린)을 따로 만들지.
2. 대상 범위 — 이번 사이클에 운세+궁합 둘 다? 아니면 궁합부터?
3. 워터마크/브랜딩 — ksaju.me 로고·QR·"For entertainment 🌙" 배치.
4. 폰트 임베딩 전략(한글 명조/한자 깨짐 방지) + 모바일 사파리 다운로드 UX(공유시트 vs 다운로드).
5. 이미지 생성 위치 — 클라이언트 onClick 캡처(번들 크기 vs 서버 렌더).

**선행 참고:**
- 운세 공유 티저: `src/components/fortune/fortune-section.tsx`("Share ✨ (soon)" 비활성 버튼).
- 궁합 모달: `src/components/compat/compatibility-modal.tsx`(양쪽 사주미니 + ksaju.me 워터마크 — export 대상 후보).
- 워크플로: brainstorming → writing-plans → subagent-driven-development → finishing. 태스크별 커밋.

**그 다음(step 9):** Vercel 배포 + ksaju.me 도메인 연결 → 소프트 론칭. (마케팅 병행: IG/TikTok 팬덤 빌딩.)

---

## 2026-06-04 (목)

### 사이클 11: 멀티페이지 골격 + 내비 — 구현 완료 ✅ (수동 시각 검증만 남음)

> **번호 정리:** CLAUDE.md 로드맵 **step 11**(멀티페이지 골격) 기준으로 본 사이클을 "사이클 11"로 표기. (과거 task-log 2026-05-27 decompose가 "사이클 10=멀티페이지"로 적었던 것과 어긋났음 → step 번호 기준으로 통일.) 다음은 CLAUDE.md **step 12** "인연 페이지".

**구현 결과:** 단일 라우트 `/`를 `/`(내 사주)+`/inyeon`(인연 'Coming soon' 플레이스홀더)로 분리. 공유 chrome(한지 배경·창살·ㅎ)+슬림 헤더(로고+My Saju/Inyeon 네비+테마토글, `usePathname` 활성표시)를 루트 `layout.tsx`로 추출. 홈 page.tsx는 콘텐츠(히어로+Card)만. 전체 **128 tests pass**, tsc clean, `next build` 성공(`/`·`/inyeon` 모두 static ○), eslint 기존 경고 2건만.

**커밋(최신순):**
- `fc5c1a5` T3: chrome를 루트 layout으로 이동 + page.tsx 콘텐츠화 (원자적; 세션 제한으로 중단된 subagent를 컨트롤러가 직접 마무리)
- `6b4a3e3` T2: `/inyeon` 'Coming soon' 플레이스홀더 (+RTL 1 test)
- `f2ae057` T1: `SiteHeader` (로고+네비+테마토글, +RTL 3 tests)
- `df69cf1` plan · `cf5c66d` spec

**리뷰:** T1·T2 스펙+품질 APPROVED. T3 스펙 APPROVED. T3 코드품질 리뷰가 CHANGES REQUESTED(I-1 이중 min-h-screen, I-2 overflow-hidden)를 냈으나 **기술 검증 후 둘 다 기각**: (I-1) min-height는 중첩 시 합산 안 됨(2×viewport 아님) + 제안 수정안은 flex 센터링 체인을 깨뜨림(컬럼 min-h-screen은 load-bearing); (I-2) main은 max-height 없어 콘텐츠만큼 자라 in-flow 클립 없음(body 스크롤), overflow-hidden은 음수오프셋 ㅎ의 양축 bleed를 의도적 클립. **결정적 근거: 리팩터 전 단일페이지(사용자 검증 통과)와 동일 패턴 → 신규 회귀 아님.** Task 4 수동 시각 검증에서 두 페이지 스크롤바/클리핑 명시 확인 예정.

**Deferred(비차단):** SiteHeader 활성링크 `font-medium`/`font-semibold` 중복(동작 무관)·focus-visible 링 / inyeon `&amp;`→`&` / 헤더 모바일 메뉴(현재 슬림 한 줄로 충분).

### 다음 작업 — 사이클 12 (CLAUDE.md step 12) '인연' 페이지
- (a) 기존 `CompatibilitySection`/`CompatibilityModal`을 `/`(SajuResult 인라인)에서 `/inyeon`으로 이전.
- (b) 일반 상대 궁합: `/inyeon`에 상대 생일 입력 폼 → `calcUserSaju` 재사용 → `calcCompatibility`.
- **크로스 페이지 상태 결정 필요**: `/inyeon`이 사용자 본인 사주를 어떻게 확보? (localStorage 영속 / 레이아웃 client Context / 재입력 중 택1) — 사이클 12 브레인스토밍 첫 질문.

---

## 2026-06-02 (화)

### 사이클 9: Fun 운세 리딩 — 구현 완료 ✅ (수동 시각 검증만 남음)

> **2026-06-02 후속 세션:** Task 5~7(UI 컴포넌트 + 통합) 완료. 전체 **124 tests pass**, tsc clean, `next build` 성공, eslint 기존 경고 2건만(form.tsx ref / saju-data.ts YinYang — 둘 다 선행). 추가 커밋(최신순): `a944264`(T7 통합: SajuResult 오행↔궁합 사이 FortuneSection + page.tsx Promise.all 병렬 calcCurrentLuck) · `875e3c8`(Share 티저 ✨로 교체) · `de1e19b`(T6 FortuneSection+RTL 2 tests) · `d767a1a`(T5 FortuneCard). 각 태스크 스펙+품질 리뷰 통과(APPROVED). **남은 것: 사용자 수동 시각 검증 + 최종 코드리뷰 + finishing-a-development-branch.**
> **Deferred(비차단):** FortuneCard 배지 aria-label / page.tsx `onEdit` 시 상태 리셋(userSaju·kst와 동일 선행 패턴) / saju-result.test에 FortuneSection 렌더 smoke 추가 / fortune.ts inPairs 중복·controllerOf 역방향테이블화·stemRelation 분기 테스트 보강.

**방향:** '내 사주' 결과 뷰에 규칙기반·짧고 fun한 영문 운세 카드 4종(**Money / Love / Career / This Year**)을 추가. 명리학 십신(十神) lite 규칙으로 일간·오행밸런스·현재 세운(연주)/월운(월주)에서 **결정적**으로 산출. LLM 미사용. 공유는 **비활성 티저 버튼**만(실제 이미지 export는 후속 공통기반).

**브레인스토밍 결정 사항:**

| 항목 | 결정 |
|------|------|
| **카테고리** | Money / Love / Career / Time(월간·한해) 4종 |
| **시간 운세** | 현재 연·월 간지 **자체 계산**(세운+월운). manseryeok에 오늘 KST 정오를 넣어 절기/입춘 경계 정확 처리(직접 절기 로직 안 짬) |
| **표시 위치** | 오행 섹션 다음 **인라인 'Your Fortune' 섹션(항상 표시)**, 그 아래 궁합 |
| **공유 범위** | **비활성 Share 티저 버튼**만(이미지 export는 후속) |
| **엔진 구조** | 접근법 A — 순수 client `fortune.ts`(compatibility.ts 패턴) + `calcCurrentLuck` 서버액션 |

**문서:**
- spec: `docs/superpowers/specs/2026-06-02-fun-fortune-reading-design.md` (`717798d`)
- plan: `docs/superpowers/plans/2026-06-02-fun-fortune-reading.md` (`4c11672`, 8 TDD 태스크)

**실행 방식:** Subagent-Driven Development (태스크별 implementer → 스펙 리뷰 → 코드 품질 리뷰).

**완료된 태스크 (Task 1~4, 커밋 최신순):**

| SHA | 태스크 | 내용 |
|-----|--------|------|
| `f5c2e2b` | T4 fix(I2) | `LOVE` 테이블을 `Record<HeavenlyStem,...>`로 → 10천간 완전성 컴파일 타임 강제 + undefined-spread 위험 제거 |
| `3a6607a` | **Task 4** | **`src/lib/fortune.ts` 운세 엔진** + `fortune.test.ts` 9 테스트. `calcFortune(userSaju, luck)` → 4카드. client-safe(manseryeok 미import) |
| `c6da362` | Task 3 | `calcCurrentLuck()` 서버액션 (`src/app/actions/saju.ts`) — `dateToLuck(new Date())` 위임 |
| `7c4bd02` | T2 fix | dateToLuck proxy 호출 주석 + 월운 known-answer(癸巳) 테스트 강화 |
| `984f674` | Task 2 | `dateToLuck(now)` (`src/lib/saju.ts`, server-only) — 오늘 KST 정오 → manseryeok → 연주/월주. known-answer: 2026 → **丙午** ✅ |
| `a4a8785` | Task 1 | `CurrentLuck` 타입(saju-types) + `STEM_COMBO`를 saju-data로 승격(단일 출처) + compatibility.ts가 공유 |

- **검증:** Task 1~4 각각 스펙 리뷰 + 코드 품질 리뷰 통과(모두 APPROVED). 전체 테스트 통과(fortune 9 + dateToLuck 2 추가). tsc clean.
- **알려진 known-answer 확인:** 2026 연주 = 丙午, 2026-06-02 월주 = 癸巳 (manseryeok 출력, 손계산과 일치).
- **엔진 규칙 요약(fortune.ts):** Money=재성(`WUXING_CONTROL[dm]`) 오행 개수 tier / Career=관성(dm을 극하는 오행) 개수 tier / Love=일간 천간 10종 아키타입 테이블 / This Year=일간 vs 올해 연간 관계(합/같음/생/극) + 이번달 월운 서브라인. 개수는 `wuxingBalance` 사용. tier 0→none·1-2→some·3+→strong.

### 🔭 남은 작업 (다음 세션 — Task 5~8, plan 파일 그대로 실행)

> plan: `docs/superpowers/plans/2026-06-02-fun-fortune-reading.md` 의 **Task 5부터**. base SHA = `f5c2e2b`.

- **Task 5 — `src/components/fortune/fortune-card.tsx`** (프레젠테이션): `FortuneCard` 데이터 1개 렌더. 오행 액센트색(`ACCENT` 리터럴, wuxing-balance.tsx 패턴 차용), 제목·이모지·tierLabel 배지·line·subLine. 단독 테스트 없음(Section 테스트가 커버).
- **Task 6 — `src/components/fortune/fortune-section.tsx`** (컨테이너, `"use client"`): `calcFortune(userSaju, luck)` → 4카드 그리드(모바일 1열/sm 2열) + **비활성** "Share ☮ (soon)" 버튼 + "For entertainment 🌙". RTL 테스트(`fortune-section.test.tsx`, happy-dom): 4카드 제목 렌더 + Share 버튼 disabled.
- **Task 7 — 통합:** `SajuResult`에 `currentLuck: CurrentLuck` prop 추가, 오행 섹션과 궁합 섹션 **사이**에 `<FortuneSection userSaju={userSaju} luck={currentLuck} />` 삽입. `page.tsx`의 `handleSubmit`에서 `calcUserSaju`와 `calcCurrentLuck()`를 `Promise.all`로 병렬 호출, `currentLuck` state 추가 → SajuResult에 전달. 분기 조건에 `!currentLuck` 추가. **전체 테스트 + tsc + `next build` 회귀.**
- **Task 8 — 마무리:** 수동 시각 검증(운세 4카드 노출/다크/모바일/Share 비활성) → 검증 회귀(vitest/tsc/eslint) → task-log + CLAUDE.md step 10 ✅ 갱신 → 커밋. 이후 **finishing-a-development-branch** + 최종 코드 리뷰.

### 다음 세션 첫 액션
1. `git branch --show-current` → `dev` 확인, `git log --oneline -3` (HEAD = `f5c2e2b`)
2. `npx vitest run` 으로 현재 그린 상태 확인
3. subagent-driven-development 스킬 재개 → plan의 **Task 5** implementer 디스패치(base `f5c2e2b`)
4. plan 파일에 각 태스크의 완전한 코드가 들어 있으니 그대로 사용. fortune-card/section 코드, 테스트, 통합 diff 모두 명시됨.

### 미해결/주의
- 코드 품질 리뷰 deferred(비차단, 향후 시간 날 때): T2 I1(`controllerOf` 역방향 룩업 테이블화), T4 M1(`inPairs` 중복 — 3번째 소비자 생기면 saju-data로 통합), M3(`tierLabel "Steady"` MONEY/LOVE 충돌 — UI에서 tierLabel을 key로 안 쓰면 무해), M4(stemRelation의 same/control/neutral 분기 직접 테스트 미보강).
- 워킹트리에 미추적 자산(`bi8Au.png`, `watermark.pen`, `scripts/`, `stamp-watermark*.png` 등) 있음 — 이번 작업과 무관, 그대로 둠.

---

## 2026-05-27 (수)

### 🔭 향후 계획 (decompose) — 다음 세션부터

사용자 비전 확장 정리. **사주 중심 + 가벼운 fun 운세 + 궁합은 '인연' 별도 페이지.** "깊은 상담/리딩 금지(depth 비경쟁)" 원칙 유지 — 운세는 규칙기반 짧고 fun한 카드, LLM 미사용.

- **시각 검증(사이클 5~8):** ✅ 사용자 확인 통과 (폼→사주 뷰→궁합 모달 정상). 발견: "사주 운세 리딩" 부재 → 아래 사이클 9로 반영.
- **사이클 9 (계획) — Fun 운세 리딩 + SNS 공유 UI**
  - 규칙기반: 일간(Day Master)·오행밸런스로 금전/연애/올 한해 등 운세를 **짧고 fun한 영문 카드**로 매핑(레이블 테이블 방식, `compatibility.ts`의 funLabel 패턴 차용). LLM 안 씀.
  - `src/lib/fortune.ts`(규칙·테이블) + `src/components/fortune/`(운세 카드) + SNS 공유 요약 UI.
  - 사주 결과 뷰에 "Your fortune" 섹션/탭으로.
- **사이클 10 (계획) — 멀티페이지 골격 + 내비**: 단일 페이지 → 라우트 분리(`/` 내 사주, `/inyeon` 인연) + 메뉴/네비. App Router.
- **사이클 11 (계획) — '인연' 페이지 (궁합 이전 + 확장)**
  - (a) K-pop 스타 궁합: 기존 `CompatibilitySection`/`CompatibilityModal`을 `/inyeon`으로 이동(사주 뷰 인라인에서 제거).
  - (b) **일반 상대 궁합**: 상대 생일 입력 폼 → `calcUserSaju`(재사용) → `calcCompatibility`로 두 사람 점수.
- **공통 기반 (계획) — 이미지 export**: 운세·궁합 공유 PNG(9:16, html-to-image). step 7/9. 운세·인연 공유 UI 공통 기반.

**재사용 자산 메모:** `calcUserSaju`(server action) 상대 사주에도 재사용. `compatForIdol`/`calcCompatibility`/`normalizeIdolSaju` client-safe. `saju-display.ts`(오행색/일간키워드) 운세 카드에도 활용. me 기둥은 `userSaju.pillars`에서 직접 추출(server-only `toCompatPillars` 회피 — 사이클 8 참고).

---

### 사이클 6: manseryeok 사용자 사주 변환 — 완료 ✅

**구현 결과:** `0202524`(server-only 인프라) + `2f6f197`(변환 lib+타입+action). `src/lib/saju.ts`(`birthToSaju`/`toCompatPillars`) + `src/app/actions/saju.ts`(`calcUserSaju`) + UserSaju 타입. 9 테스트 → 전체 **96 tests pass**, tsc/eslint/`next build` clean (페이지 여전히 static, manseryeok 서버측만). RM/Jin known-answer가 아이돌 DB 값과 정확히 일치 확인.

**확정된 결정 사항:**

브레인스토밍으로 확정된 결정:

| 항목 | 결정 |
|------|------|
| **실행 위치** | Server Action (서버) — manseryeok ~300KB를 클라이언트 번들에서 제외 |
| **기둥 범위** | 4기둥 전체(시주 포함). 궁합은 3기둥만 소비하나 공유카드 사주미니용으로 시주 확보 |
| **시간/타임존** | `BirthData → convertToKST → KST 일시 → calculateSaju` (기존 KST 변환기 재사용, CLAUDE.md 흐름도 일치). 진태양시 보정은 기본값(서울 127°, 시주에만 영향) |
| **구조** | A안 — 순수 `birthToSaju` lib + 얇은 Server Action 래퍼 |

**사전 검증:** `calculateSaju(1992,9,12)` → 壬申/己酉/辛卯 = 아이돌 DB의 RM 사전계산값과 **정확히 일치** (Jin도 일치). 라이브러리가 DB와 동일 소스 → RM/Jin을 known-answer 테스트로 사용.

**설계 요약:**
- `src/lib/saju.ts` (`import "server-only"`): manseryeok + convertToKST import. `birthToSaju(birth): UserSaju`, `toCompatPillars(saju): SajuPillars`. 시간 미입력 시 hour pillar null.
- `src/lib/saju-types.ts`에 `UserSaju { pillars:{year,month,day,hour:string|null}, dayMaster, isTimeCorrected }` 추가 (클라이언트 안전 — manseryeok 미import → `import type` 가능).
- `src/app/actions/saju.ts` (`"use server"`): `calcUserSaju(birth)` — birthSchema 검증 후 birthToSaju. Next.js 16 server action 규약은 구현 전 `node_modules/next/dist/docs` 확인.
- 테스트(node env, TDD): RM/Jin known-answer, 타임존 변환으로 day pillar 달라지는 케이스, no-time→hour null, toCompatPillars 3기둥.
- **비범위:** UI/페이지 연결 (다음 사이클). 이번엔 변환 엔진 + action까지.

### 사이클 8: 궁합 + 결과 모달 (티저 → 실기능) — 완료 ✅

**구현 결과:** `feat(compat)` 커밋. `src/components/compat/`(CompatibilitySection+CompatibilityModal), SajuResult 티저→실섹션 교체. 3 테스트 → 전체 **111 tests pass**, tsc/eslint/`next build`(static) clean. me 기둥은 userSaju.pillars 인라인 추출(server-only toCompatPillars 회피). 이미지 export는 다음.

**결정:**

**결정:** IdolPicker는 **사주 뷰 인라인**(티저 교체). 범위는 **궁합 결과 모달 UI만**(이미지 export/다운로드는 다음 step 7/9).

**설계:** `src/components/compat/`
- `CompatibilitySection`(client): IdolPicker + selectedIdol/modal 상태. me 기둥은 `userSaju.pillars`에서 직접 추출(toCompatPillars는 server-only saju.ts에 있어 client import 불가 → 인라인). `compatForIdol(me, idol)`(idols.ts, client-safe) 호출.
- `CompatibilityModal`(presentational Dialog): 점수·fun레이블·breakdown(일간/오행/지지 note)·양쪽 사주미니·ksaju.me 워터마크·"For entertainment 🌙"·"Check another idol".
- SajuResult 티저 `<section>` → `<CompatibilitySection userSaju>`로 교체.
- 테스트: Section RTL(아이돌 선택→모달 점수 노출), Modal RTL(결과 렌더·onClose).

---

### 사이클 7: '내 사주' 인페이지 결과 뷰 (사주 중심 피벗) — 완료 ✅

**구현 결과:** `0a864d2`. page.tsx form↔result 상태머신(`convertToKST`+`calcUserSaju`→사주 뷰), `src/lib/saju-display.ts`, `src/components/saju/`(SajuResult+PillarsGrid+WuxingBalance), birth-form 로딩 prop, KstResultModal 은퇴. 12 테스트 → 전체 **108 tests pass**, tsc/eslint(기존 경고만)/`next build` clean(페이지 static). CLAUDE.md 방향 업데이트 노트 + 로드맵 step 8 갱신.

**결정 사항:**

**⚠️ 포지셔닝 피벗:** 사용자가 "내 사주가 메인, 아이돌 궁합은 fun 부가 기능"으로 방향 조정. CLAUDE.md의 궁합 중심 포지셔닝과 다름 → 구현 후 CLAUDE.md MVP/포지셔닝 업데이트 필요. 단 "깊은 리딩 금지/depth 비경쟁" 원칙은 유지(가벼운 사주 카드).

| 항목 | 결정 |
|------|------|
| **플로우** | 단일 페이지 상태머신: `form → calcUserSaju → 인페이지 '내 사주' 뷰`. 기존 KstResultModal 은퇴(내용 흡수) |
| **메인 화면** | 내 사주 결과가 메인. 궁합+SNS공유는 다음 사이클에 예쁜 모달로 |
| **사주 카드 내용** | 4기둥(한자+한글+오행색) + 일간 강조+fun키워드 + 오행밸런스 + 기존 KST·12지지·funfact |
| **결과 표시** | 인페이지 전체 뷰 |
| **이번 범위** | '내 사주' 인페이지 뷰만. 궁합/공유 모달은 다음. **티저 버튼 포함**, **서브컴포넌트 분리** |

**설계 요약:**
- 데이터: `convertToKST`(client, KST·지지·funfact) + `calcUserSaju`(server action, 4기둥). 제출 시 로딩.
- `src/lib/saju-display.ts`(client-safe): `elementOf`, `WUXING_META`(token mok/hwa/to/geum/su), `pillarBreakdown`, `wuxingBalance`, `dayMasterInfo`(DAY_MASTER_KEYWORDS).
- `src/components/saju/`: 컨테이너 `saju-result.tsx` + 서브컴포넌트 `pillars-grid.tsx`, `wuxing-balance.tsx`. "Check compatibility ✨" 티저(비활성, 다음 사이클) + "Edit my info".
- 검증: `saju-display.test.ts`(node) + `saju-result.test.tsx`(RTL). page는 next build+수동.

---

## 2026-05-26 (화)

### 오늘 한 일 (진행 중)

#### 사이클 5a: 아이돌 DB 연동 레이어 (완료 ✅)

- **세션 복구:** 직전 세션이 용량 제한으로 중단. git 워킹트리는 클린(스태시·미저장 변경 없음)이라, 만들려던 "아이돌 DB ↔ compatibility 엔진 연동 모듈"은 **저장 전 유실**된 것으로 판단 → 재작성.
- **`src/lib/idols.ts` 신규** (`5c0b96d`)
  - `data/ksaju-idol-db.json`(76명/14그룹) 로드 + 스키마 검증 (필수필드·중복id·`dayMaster===day.hanja[0]` 통과)
  - 타입 `Idol`/`IdolSaju`/`IdolPillar`, exports `idols`/`groups`
  - `getIdolById`, `getIdolsByGroup`, `searchIdols`(이름/그룹·대소문자무시·부분일치·빈쿼리=전체), `compatForIdol`(=normalizeIdolSaju+calcCompatibility 래퍼)
  - `idols.test.ts` 18 tests → 전체 **79 tests pass**, tsc/eslint clean
  - DB JSON도 함께 커밋(모듈의 import 의존)
- **CLAUDE.md 로드맵 업데이트** (`4ceabca`): step 5를 (✅ DB 연동 레이어) + (🔨 검색·선택 UX)로 분리

#### 사이클 5b: 아이돌 검색·선택 UX (IdolPicker) — 완료 ✅

**구현 결과:** `8e4a7a1`(테스트 인프라) + `6d2de7f`(컴포넌트). IdolCard/IdolPicker + 8 컴포넌트 테스트 → 전체 **87 tests pass**, tsc/eslint/`next build` clean. onSelect까지 동작, 아직 페이지에 마운트 안 됨(설계대로).

**확정된 결정 사항:**

브레인스토밍으로 확정된 결정:

| 항목 | 결정 |
|------|------|
| **탐색 방식** | 검색 + 그룹 브라우징 (검색바 + 기본 그룹별 목록) |
| **산출물 범위** | 피커 컴포넌트만 (궁합 결과·페이지 연결은 다음 사이클). "나" 사주(manseryeok) 아직 없음 |
| **검증** | RTL + happy-dom 컴포넌트 테스트 도입 (전역 env는 node 유지, 컴포넌트 테스트만 `@vitest-environment happy-dom` pragma) |
| **구조** | B안 — 컨테이너 `IdolPicker` + 순수 `IdolCard` 분리 |

**설계 요약:**
- `src/components/idols/idol-card.tsx` — 순수 프레젠테이션. props `idol`/`selected`/`onSelect`. 모노그램 아바타(이름 첫 글자) + 이름 + 그룹. **공식 사진·로고 없음**(CLAUDE.md). 선택 시 `border-primary`+`bg-primary/5`. radiogroup 내 `role="radio"`+`aria-checked`.
- `src/components/idols/idol-picker.tsx` — `"use client"` 컨테이너. props `onSelect(idol)`/`className?`. 내부 상태 `query`/`selectedId`. 검색바(shadcn Input) + query 빈값→그룹 브라우징(`groups`×`getIdolsByGroup`), query 있음→`searchIdols` 플랫 필터, 0건→empty state. 카드 탭→`onSelect`.
- 한지 디자인 토큰(`border-border`/`font-display`/`text-primary`/`muted-foreground`), 반응형 그리드(모바일 2열/데스크탑 3~4열).
- devDeps 추가: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `happy-dom`. vitest `setupFiles`로 jest-dom matcher 등록.
- **비범위:** 앱 페이지/플로우 연결, 궁합 결과 표시 (다음 사이클). 컴포넌트는 RTL로만 검증, 아직 마운트 안 됨.

---

## 2026-05-22 (금)

### 오늘 한 일 — KST 변환기 마무리 + 코드 리뷰 fix

#### 사이클 3: Task 10-11 + 리뷰 fix + 모바일 폴리시

- **Task 10 — `page.tsx` 통합 완료** (`2d5602f`)
  - `"use client"` 추가, 기존 hero card 콘텐츠를 BirthForm + KstResultModal로 교체
  - 브라우저 timezone 감지를 `useState + useEffect`(plan) → **`useSyncExternalStore`**로 변경: React 19의 새 lint `react-hooks/set-state-in-effect`가 plan 패턴 거부. server snapshot=undefined, client snapshot=IANA로 hydration-safe.
  - 한지/창살/ㅎ/토글 디자인 보존

- **Task 11 — 수동 시각 검증 (사용자 협조)** + 2개 버그 발견 → 즉시 fix (`19ce0b9`)
  1. **Radix Dialog a11y error**: `KstResultModal`에 `DialogTitle` 누락 → `sr-only` `<DialogTitle>` + `<DialogDescription>` 추가
  2. **Select dropdown 투명**: 근본 원인은 `globals.css`의 `@theme inline` 블록에 폰트만 매핑, shadcn 시맨틱 컬러 토큰(`--color-popover` 등) 미등록 → `bg-popover` 컴파일 안 됨. 좁게 `popover`만 등록 (잠정).
  - 부수 발견: MetaMask 확장이 모든 localhost 페이지에 inpage.js 주입 → 시크릿 창에서 검증 회피

- **Final 코드 리뷰 디스패치** (general-purpose subagent, `7fd2060..19ce0b9` 13 commits)
  - 결과: **"No - with fixes"** — C1 1건, I1-I6 6건, M1-M8 8건
  - 가장 중요한 발견: **C1** — Tailwind v4 시맨틱 토큰 13개 전체가 미등록 상태였음. `bg-primary`/`bg-card`/`bg-accent`/`from-primary` 등 26개 utility가 무음 실패. 모달의 brand 컬러와 KSaju 헤더 그라데이션이 안 보이고 있었음 (hanji-paper 부모 배경이 비쳐서 우연히 가려져 있었음)

- **리뷰 fix 적용 (6 commit)**
  - `392854c`: C1(전체 시맨틱 토큰 등록) + I1(time 필드 FormMessage) + I3(캐스트 재검토 후 유지 + 주석) + I4(superRefine mutation 제거 → `convertToKST`로 이동)
    - 검증: 컴파일 CSS에 `.bg-primary` `.bg-card` `.from-primary` `.to-accent` 등 26개 utility 확인됨
    - I3은 push back: shadcn FormField의 `ControllerProps default(FieldValues)` generic 설계상 우리 FormValues로의 추론 불가 → 캐스트는 안전성 우회가 아니라 구조적 노이즈로 결론
  - `e2bbac7`: I2(date/time 입력을 `FormField`로 정식 wrap, name='year'/'hour' 앵커) + I5(`alert()` → in-card destructive error banner) + M1(defaultTimezone이 POPULAR_TIMEZONES에 없을 때 합성 SelectItem `(detected)` 맨 위에 삽입)
  - `7519da9`: 모바일 ㅎ z-index — 모바일에서 카드가 ㅎ을 가려 디자인 의도 사라짐 → `z-30 sm:z-0`로 mobile만 카드 위로

### 오늘의 commits (5개, 최신순)

| SHA | 메시지 |
|-----|--------|
| `7519da9` | fix(landing): lift ㅎ above card on mobile (z-30 sm:z-0) |
| `e2bbac7` | fix(review): apply deferred review items I2, I5, M1 |
| `392854c` | fix(review): address code review C1, I1, I3, I4 |
| `19ce0b9` | fix(kst): resolve Dialog a11y error and Select dropdown transparency |
| `2d5602f` | feat(landing): integrate KST converter form and result modal |

### 현재 상태 (2026-05-22 작업 종료 시)

- **활성 브랜치:** `dev` (18 commits ahead of local `main`, 18 commits ahead of `origin/dev`)
- **local main:** 20 commits ahead of `origin/main` (어제 백의민족 피벗, 아직 push 안 함)
- **dev → origin/main 거리:** 38 commits (백의민족 20 + KST 18)
- **워킹 트리:** 클린
- **Dev 서버:** 중지됨
- **빌드/lint/test:** 모두 통과 (22 vitest tests · build pass · pre-existing form.tsx unused-ref warning 1건 외 lint clean)

### Task 11 시각 검증 — 사용자 보고 결과 (PASS)

| # | 시나리오 | 결과 |
|---|---------|------|
| 1 | 폼 초기 상태 (시크릿 창) | ✅ |
| 2 | 1999-03-15 14:30 NY → 모달 정상 | ✅ (C1 fix 이후 brand 컬러까지 모두 적용됨 재확인) |
| 3 | Edit → 폼 복귀 | ✅ |
| 4 | time 미입력 | ✅ |
| 5 | invalid 날짜 (1899/2051) | ✅ |
| 6 | Dark 모드 토글 | ✅ |
| 7 | 모바일 viewport | 처음엔 ㅎ이 카드에 가려져 ⚠️ → `7519da9`로 fix → ✅ |

### KST 변환기 사이클 완료 ✅

Spec → plan → 11 task → 6 fix → final review pass → 모든 검증 통과. 다음 사이클(사주 계산) 진입 준비됨.

---

## 내일 시작 시 첫 액션

### Step 0 — finishing-a-development-branch 결정 (어제로부터 보류)

오늘 finishing 스킬까지 진입했으나 dev/main/origin 정렬 결정을 사용자가 보류했음. 이게 가장 먼저 해야 할 일:

**dev (18 commits) 처리 옵션:**
1. dev → main local merge 후 한꺼번에 push (단순)
2. dev → origin/dev push + GitHub PR 생성 (KST + 백의민족 38 commits이 함께 PR에 포함됨 — 두 피벗을 한 PR로 묶거나, main부터 origin/main에 먼저 push해 base 정렬 필요)
3. dev 유지하고 별도 결정으로 보류

**main (20 commits) 처리 옵션 (어제부터 보류):**
- (a) dev → main merge 후 main을 origin/main에 push (백의민족 + KST 38 commits 한꺼번에 history에 보존)
- (b) main reset to origin/main (백의민족 작업은 dev에만 보존 — 중복 정리)
- (c) main을 그냥 origin/main에 push (origin/main도 따라잡기)

권장: **1(a) — 가장 단순. PR 없이 dev/main 동기화 + origin/main에도 history 보존.** 개인 프로젝트 단계라 PR 분리의 이득 작음.

### Step 1 — 다음 사이클 결정 (사주 v2 또는 다른 방향)

후보 (어제부터 거론):

**A) 사주 실제 계산 (manseryeok 통합)**
- 현재 KST 변환기는 데이터 수집만 됨, "Discover your saju" CTA는 disabled
- spec brainstorming → 4기둥(년주/월주/일주/시주) 계산 + 시각화
- 데이터 소스: KASI manseryeok 또는 무료 npm 라이브러리
- 의존성: 음력 변환, 천간/지지 60갑자, 절기 boundary
- 사이즈: 중-대 (1-2주, 도메인 로직 무거움)

**B) 사주 결과 카드 v2 (visualization)**
- 4기둥을 시각적으로 어떻게 보여줄지 디자인 spec
- 한지/창살/먹/단청 테마 유지
- 사이즈: 중 (디자인 1-2일 + 구현 며칠)

**C) 그 외 — 어제·오늘 떠오른 다른 아이디어**

### Step 2 — 일반 점검 (1분)

```bash
git branch --show-current   # 현재 브랜치 확인 (finishing 결정에 따라 dev or main)
git log --oneline -5        # 마지막 커밋들
npm test                    # 22 tests pass 재확인
```

---

## 미해결 / 결정 보류 항목

### 1. dev/main/origin/main 정렬 (어제 #1, 오늘로 이월)

위 "내일 시작 시 첫 액션 Step 0" 참고.

### 2. 디자인 시스템 후속 정리

오늘 C1 fix로 `@theme inline`에 시맨틱 토큰 13개 등록함 → `bg-card`, `bg-primary` 등이 처음으로 실제 컴파일됨. 부작용 점검 필요:
- 카드 배경이 이전에는 hanji 비쳐 보였는데 이제 **백자 #FFFFFF로 또렷이 분리**됨 — 디자인 의도와 일치하지만, **어제 백의민족 피벗 spec 작성 당시 의도와 다른 시각**일 수 있음
- 모달 brand 컬러가 처음으로 실제 적용됨 — 시각 검증 다시 했음
- 향후 컴포넌트 추가 시 동일 토큰 사용 패턴 따라가면 됨 (별도 작업 필요 없음, 기존 컴포넌트는 변화 흡수됨)

### 3. 사주 결과 카드 v2 / 사주 실제 계산 (어제 #2-3, 오늘로 이월)

위 "Step 1 다음 사이클 결정" 참고.

### 4. 코드 리뷰의 deferred items (오늘 발생)

- **I6** (UI 자동 테스트): spec상 "UI는 시각/수동 검증"으로 결정됨. 추후 결정 — Playwright 도입 시 KstResultModal 스모크 테스트가 다음 회귀 방지에 좋음. 리뷰어가 "C1을 잡았어야 할 테스트"로 명시함.
- **M2-M8** (소소한 폴리시): defaultTimezone 미커버리지 fallback / `formatSourceDate` locale comment / `koreaTimeOfDay` 단위 테스트 / `buildFunFact` dateline 방어 / 등. 별도 fix 사이클 또는 시간 날 때.

---

## 참고 파일 (오늘 추가·수정된 것)

| 파일 | 내용 |
|------|------|
| `src/app/page.tsx` | Task 10 통합 (use client, BirthForm/KstResultModal 사용) + error banner + 모바일 ㅎ z-index |
| `src/app/globals.css` | **@theme inline에 시맨틱 컬러 토큰 13개 등록 (C1)** — 디자인 시스템의 숨은 결함 해결 |
| `src/components/kst/birth-form.tsx` | I2(FormField wrap) + M1(synthetic timezone) + I3 주석 + I1 FormMessage |
| `src/components/kst/kst-result-modal.tsx` | DialogTitle/Description sr-only 추가 (a11y) |
| `src/lib/kst-types.ts` | superRefine mutation 제거 (I4) |
| `src/lib/kst-converter.ts` | hour-without-minute defaulting을 진입부로 이동 (I4) |
| `task-log.md` | 이 항목 추가 |

---

## 2026-05-21 (목)

### 오늘 한 일 — 2가지 큰 사이클

#### 사이클 1: 백의민족 한지 피벗 (디자인 시스템 완전 교체)

- **방향:** 어제 "Cosmic Korean 듀얼 모드" spec을 **폐기**하고 더 야심찬 "백의민족 + 한지 + 창살" 라이트 톤을 기본으로 격상. Cosmic Korean은 Dark 모드 토글로 유지.
- **새 디자인 토큰:** 한국어 명명 (한지/백자/묵/진달래/단청황/청자)
- **추가된 시각 자산:** 한지 텍스처(JK noise), 우물 정(井)자 창살 띠 (페이지 + hero card), 우측하단 거대 ㅎ 자음 (Yeon Sung 캘리그래피 + ink-bleed)
- **새 폰트:** Gowun Batang (한자/명조), Yeon Sung (캘리그래피) — 기존 Geist/Inter/Pretendard에 추가 (총 5종)
- **테마 인프라:** `next-themes` 설치, ThemeToggle 컴포넌트 (Sun/Moon)

**문서:**
- spec: `docs/superpowers/specs/2026-05-21-baekui-hanji-pivot-design.md` (커밋 `5f85aaa`)
- plan: `docs/superpowers/plans/2026-05-21-baekui-hanji-pivot.md` (커밋 `2fc35f7`)

**구현 결과:** 10 task 모두 완료, dev 브랜치 생성 + origin/dev push (`https://github.com/heyday1019/ksaju/tree/dev`). 사용자 시각 검증 통과. 폴리시(사 주 크기, 모바일 ㅎ 반응형, lint disable) + final review fix(hanji noise 가시화, `--color-hanji-warm` 토큰 추출) 적용.

#### 사이클 2: KST 출생시각 변환기 (랜딩 페이지 기능)

- **방향:** 외국인 사용자의 출생 시각을 한국 KST로 변환해주는 인터랙티브 폼을 랜딩 페이지 hero card에 추가. **사주의 데이터 입구 + "재미" 도구** 듀얼 역할.
- **결정 사항:**
  - 배치: 기존 hero card 안에 폼 통합 (마케팅 카피 대체)
  - 입력 UI: Native HTML5 `<input type="date"/time">`
  - Timezone: browser 자동감지 + 26개 주요 도시 dropdown
  - 결과 표시: shadcn Dialog (한지 테마 + 창살)
  - Fun 요소: KST 시각 + 요일 pill + **12지지 시간** (호랑이/용/뱀 등) + fun fact
  - 사주 CTA: "Discover your saju →" disabled + Coming Soon 배지 (별도 spec 향후)
  - 도메인 로직 TDD (vitest + Node env)

**문서:**
- spec: `docs/superpowers/specs/2026-05-21-kst-converter-design.md` (커밋 `99f2c6f`)
- plan: `docs/superpowers/plans/2026-05-21-kst-converter.md` (커밋 `7fd2060`)

**구현 진행 — 9/11 task 완료:**
| Task | 상태 | 커밋 |
|------|------|------|
| 1. deps + vitest setup | ✅ | `c6b9992` |
| 2. types + Zod schema | ✅ | `b71459c` |
| 3. POPULAR_TIMEZONES + JIZI_HOURS | ✅ | `c9c1336` |
| 4. getJiziHour TDD | ✅ | `32e04f1` (12 tests) |
| 5. convertToKST TDD | ✅ | `c498701` (18 tests) |
| 6. buildFunFact + import 통합 | ✅ | `2e71e09` (22 tests) |
| 7. shadcn add form + select | ✅ | `dc6782f` |
| 8. BirthForm 컴포넌트 + useEffect fix | ✅ | `be24ced` + `2239a36` |
| 9. KstResultModal 컴포넌트 | ✅ | `f529261` |
| **10. page.tsx 통합** | **⏳ 내일** | — |
| **11. 수동 시각 검증** | **⏳ 내일** | — |
| 최종 코드 리뷰 + finishing-a-development-branch | ⏳ 내일 | — |

**모든 도메인 로직 TDD 통과 (22 tests).** 컴포넌트도 빌드/lint 통과. 단, **랜딩 페이지에 아직 통합 안 됨** — Task 10이 마지막 연결고리.

### 오늘의 커밋 (23개, 최신순)

전체 commit log는 `git log --oneline 2fc35f7..HEAD` (또는 yesterday's `e973780..HEAD`)로 확인.

### 현재 상태

- **활성 브랜치:** `dev` (origin/dev 보다 12 커밋 앞섬 — Task 1-9 + 폴리시 + spec/plan 등)
- **main 브랜치:** origin/main 보다 20 커밋 앞섬 (백의민족 한지 피벗 commits만, 아직 push 안 함)
- **워킹 트리:** 클린
- **Dev 서버:** 중지됨
- **빌드/lint/test:** 모두 통과 (22 vitest tests)
- **푸시:** dev는 한 번 push했지만 그 이후 commit은 로컬에만. main은 push 안 함.

---

## 내일 시작 시 첫 액션

### Step 1 — 상태 점검 (1분)

```bash
git branch --show-current   # dev 확인
git log --oneline -5        # 마지막 커밋: f529261 KstResultModal
npm test                    # 22 tests pass 재확인
```

### Step 2 — Task 10: `page.tsx` 통합 진행

plan 파일의 Task 10 섹션 그대로 실행. 핵심:

- `src/app/page.tsx`에 `"use client"` 추가
- `useState`로 result/modalOpen, `useEffect`로 browser timezone 감지
- 기존 hero card 내용(카피 + 두 버튼) → `<BirthForm onSubmit={handleSubmit} defaultTimezone={defaultTz} />`
- 카드 헤더: "When were you born?" + CardDescription
- main 아래에 `<KstResultModal ... />`
- 한지/창살/ㅎ/토글 그대로 보존

plan 위치: `docs/superpowers/plans/2026-05-21-kst-converter.md` (Task 10 섹션)

Claude에게 요청 예시:
```
plan의 Task 10 (page.tsx 통합) 진행해줘. subagent로.
```

### Step 3 — Task 11: 수동 시각 검증 (사용자 협조)

`npm run dev` 후 브라우저에서 11 step 체크리스트:
1. 폼 초기 상태 (timezone 자동 감지 표시)
2. 정상 변환 케이스 (NY 1999-03-15 14:30 → Seoul 1999-03-16 04:30 + Tiger)
3. Edit → 폼 복귀 (값 보존)
4. time 미입력 → hint placeholder
5. invalid 날짜 (1899/2051) → inline error
6. Dark mode 토글 → 모달도 cosmic 톤
7. 모바일 viewport (iPhone) → 폼/모달 한 화면
8. 자동 테스트 회귀 (npm test)
9. 빌드 + lint 회귀
10. 보고

### Step 4 — 최종 코드 리뷰 + finishing-a-development-branch

- 전체 11 task에 대한 final code reviewer 디스패치
- `finishing-a-development-branch` 스킬로 브랜치 마무리:
  - dev 추가 commits push? (origin/dev 보다 12 commit 이상 앞설 것)
  - main 처리? (origin/main 보다 20+ 커밋 앞섬)
  - PR 생성? (GitHub에 dev → main PR)

---

## 미해결 / 결정 보류 항목

### 1. main 브랜치 push 시점

main이 origin/main 보다 20+ 커밋 앞섬 (백의민족 한지 피벗 작업 전체). dev/main 워크플로우 정착되면 결정:
- (a) dev → main merge 후 일괄 push
- (b) main을 origin/main으로 reset (백의민족 작업은 dev에만 보존 — git history 보면 중복)
- (c) 그냥 main도 push (origin/main도 따라잡기)

내일 finishing 단계에서 결정.

### 2. 사주 결과 카드 v2

KST 변환 완료 후 후속 작업으로 거론됨. spec brainstorming 단계. 다음 사이클 대상.

### 3. 사주 실제 계산

KST 변환기에서 데이터 수집은 됨 (`BirthData`). 다음 spec에서 manseryeok로 실제 사주 계산 + "Discover your saju" CTA 활성화.

---

## 참고 파일 (오늘 새로 생긴 것 위주)

| 파일 | 내용 |
|------|------|
| `docs/superpowers/specs/2026-05-21-baekui-hanji-pivot-design.md` | 백의민족 한지 피벗 spec ✅ |
| `docs/superpowers/plans/2026-05-21-baekui-hanji-pivot.md` | 백의민족 한지 피벗 plan ✅ |
| `docs/superpowers/specs/2026-05-21-kst-converter-design.md` | KST 변환기 spec ✅ |
| `docs/superpowers/plans/2026-05-21-kst-converter.md` | **KST 변환기 plan (내일 Task 10부터)** |
| `src/lib/kst-types.ts` | BirthData, KSTResult, JiziHour + Zod schema |
| `src/lib/kst-data.ts` | POPULAR_TIMEZONES (26) + JIZI_HOURS (12) |
| `src/lib/kst-converter.ts` | convertToKST, getJiziHour, buildFunFact (도메인) |
| `src/lib/kst-converter.test.ts` | 22 vitest tests |
| `src/components/kst/birth-form.tsx` | 폼 컴포넌트 |
| `src/components/kst/kst-result-modal.tsx` | 결과 모달 |
| `src/components/ui/form.tsx` | shadcn form (Task 7) |
| `src/components/ui/select.tsx` | shadcn select (Task 7) |
| `vitest.config.ts` | vitest 설정 (Node env, @ alias) |
| `src/app/globals.css` | 한지 테마 + 창살 + 잉크 유틸 (백의민족 피벗 결과) |
| `src/app/layout.tsx` | 4 폰트 + ThemeProvider (백의민족 피벗 결과) |
| **`src/app/page.tsx`** | **내일 Task 10에서 폼/모달 통합** |

---

## 세션 회복 팁

내일 새 세션 시작 시:
1. 이 파일(`task-log.md`)을 먼저 읽어 컨텍스트 회복
2. 위 "내일 시작 시 첫 액션" Step 1부터 진행
3. **dev 브랜치에 있는지 확인** (`git branch --show-current` → dev)
4. Claude는 자동 메모리·git 로그·CLAUDE.md를 통해 추가 컨텍스트 보강
5. 막힐 때 `git log --oneline -15` + `npm test`로 진척 확인
6. plan 파일 (`docs/superpowers/plans/2026-05-21-kst-converter.md`)의 Task 10 섹션을 직접 참고
