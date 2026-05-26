# KSaju Task Log

> 작업 일지. 매일 마지막에 오늘 한 일과 내일 시작 액션을 기록.

---

## 2026-05-26 (월)

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

#### 사이클 5b: 아이돌 검색·선택 UX (IdolPicker) — 결정 사항 (구현 진행 예정)

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
