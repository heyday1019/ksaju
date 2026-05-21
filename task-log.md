# KSaju Task Log

> 작업 일지. 매일 마지막에 오늘 한 일과 내일 시작 액션을 기록.

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
