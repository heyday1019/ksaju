# KSaju Task Log

> 작업 일지. 매일 마지막에 오늘 한 일과 내일 시작 액션을 기록.

---

## 2026-05-20 (수)

### 오늘 한 일

#### 1. 프로젝트 상태 진단

- 초기 의도: "Cosmic Korean 디자인 시스템을 적용하고 검증"
- 발견: Phase 1 커밋(`e1dc2ed`)이 실제로는 **ORG 템플릿만 커밋**했고, Cosmic Korean 변환은 working tree에 미커밋된 상태였음
- 더불어 `layout.tsx`의 next/font 변수와 `globals.css`의 `@theme inline` 사이의 연결이 끊어져 있어 Geist/Inter가 system-ui로 fallback되던 결함, Pretendard 미로드 결함도 발견

#### 2. 폰트 시스템 수정 (완료)

- **명세서:** `docs/superpowers/specs/2026-05-20-cosmic-korean-font-system-design.md`
- **구현 계획:** `docs/superpowers/plans/2026-05-20-cosmic-korean-font-system.md`
- **실행:** subagent-driven-development로 3 task 분해 실행
- **결과:**
  - 미커밋 Phase 1 변경을 별도 커밋으로 정리 (`a4cb249`)
  - Pretendard Variable CDN @import 추가 (`1dc05ac`)
  - `@theme inline`의 폰트 변수를 `var(--font-geist)`, `var(--font-inter)` 참조로 교체 + `--font-hangul` 1순위에 `"Pretendard Variable"` 추가 (`12123dc`)
  - `npm run build` 통과
- **수동 검증 미완료:** Task 3(브라우저 DevTools 검증) 진행 중 사용자가 시각적 이슈("전체 어두워 잘 안 보임") 보고 → 듀얼 모드 작업으로 자연 이전

#### 3. 듀얼 모드 디자인 결정 (명세 완료, 구현 미진행)

- 사용자가 "다크 모드 단일" 제약을 폐기하고 Light + Dark 듀얼 모드를 요구
- 브레인스토밍으로 4가지 핵심 결정 확정:
  1. 다크 = 기존 Cosmic Korean 유지, 라이트 = Hanji Cream 기반 (브랜드 일관성)
  2. 수동 토글 버튼 + localStorage (OS 자동 감지 없음)
  3. 첫 방문 기본 = Light
  4. 구현 라이브러리 = `next-themes` (SSR hydration·FOUC 자동 해결)
  5. Hero 그라데이션 = `from-primary to-accent` (두 모드 공통)
- **명세서:** `docs/superpowers/specs/2026-05-20-cosmic-korean-dual-mode-design.md` (`a456012`)
- **구현 계획:** 아직 미작성

### 오늘의 커밋 (최신순)

| SHA | 메시지 |
|-----|--------|
| `a456012` | docs: Cosmic Korean 듀얼 모드(Light/Dark) 디자인 시스템 설계서 |
| `12123dc` | fix: bridge next/font CSS variables to Tailwind theme |
| `1dc05ac` | fix: load Pretendard Variable via jsDelivr CDN |
| `a4cb249` | chore: commit Phase 1 Cosmic Korean changes that were left un-staged |
| `804d216` | docs: Cosmic Korean 폰트 시스템 구현 계획 |
| `3bd4178` | docs: Cosmic Korean 폰트 시스템 연결 수정 설계서 |

총 6 커밋. `origin/main`보다 6 커밋 앞섬 (아직 push 안 됨).

### 현재 상태

- **브랜치:** `main`
- **워킹 트리:** 클린 (untracked 파일만: `src/app/{globals,layout,page}_org.tsx` 백업 3개)
- **Dev 서버:** 중지됨
- **빌드:** `npm run build` 통과 확인됨
- **푸시:** 안 함 — 사용자가 결정

---

## 내일 시작 시 첫 액션

### Step 1 — 듀얼 모드 명세서 검토

다음 파일을 열어 검토:

```
docs/superpowers/specs/2026-05-20-cosmic-korean-dual-mode-design.md
```

검토 시 확인 포인트:
- 라이트 팔레트 색상값이 의도와 맞는지 (특히 `--secondary` `#FBE9CC`, `--muted` `#F5E3C0` 같은 미세 톤)
- 토글 버튼의 우상단 절대 위치가 OK인지 (헤더 도입 시 이동 예정)
- `next-themes` 라이브러리 사용에 동의하는지 (대안: 직접 구현)
- 별 패턴(`cosmic-stars`)을 Light에서 완전 숨기는 결정이 OK인지

### Step 2 — 명세 수정 또는 진행

**수정 필요 시:** Claude에게 직접 요청 (예: "라이트 모드 카드 배경을 순백 대신 #FFFEF8로 살짝 따뜻하게 바꿔줘").

**수정 없으면 다음 단계로.**

### Step 3 — Claude에게 다음 요청

```
듀얼 모드 명세서 검토 완료. /superpowers:writing-plans로 구현 계획 작성 진행해줘.
```

또는 직접 슬래시 커맨드로:

```
/superpowers:writing-plans
```

### Step 4 — 구현 실행

구현 계획 완성·검토 후, subagent-driven-development로 실행:

```
1. 로 진행해줘
```

(1번 = Subagent-Driven)

### Step 5 — 시각 검증 (듀얼 모드 + 폰트 통합)

듀얼 모드 구현 후 `npm run dev` + 브라우저로 다음을 한 번에 검증:

- ✅ 라이트 모드에서 메인 페이지 가독성
- ✅ 토글 클릭 시 Dark ↔ Light 즉시 전환, 깜빡임 없음
- ✅ 새로고침 후 모드 유지 (localStorage)
- ✅ Inter 폰트 적용 (DevTools Computed font-family)
- ✅ Pretendard CDN 다운로드 (Network 탭)
- ✅ `font-hangul` 클래스로 인라인 편집 시 Pretendard 적용
- ✅ Hot reload

(이전 폰트 시스템의 Task 3 검증이 듀얼 모드 검증으로 통합됨.)

---

## 미해결 / 결정 보류 항목

### 1. `_org` 백업 파일 처리

`src/app/{globals,layout,page}_org.tsx` 3개가 untracked. 옵션:
- **(a)** `.gitignore`에 추가하여 untracked 상태 유지
- **(b)** 삭제 (git 히스토리에 e1dc2ed Phase 1 커밋으로 원본 보존됨)
- **(c)** 별도 폴더(`docs/legacy/`)로 이동 후 commit

내일 듀얼 모드 작업 시작 전 결정.

### 2. `--secondary` / `--muted` 미세 조정

명세 Section 5 위험 표에 적힌 대로 라이트 모드의 `--muted` (#F5E3C0)와 `--secondary` (#FBE9CC) 구분이 미미할 수 있음. 출시 전 한 번 디자인 점검.

### 3. Push 시점

`origin/main`보다 6 커밋 앞섬. 일단 로컬 보존. 듀얼 모드 작업 1 사이클 끝나면 묶어서 push하는 게 자연스러움.

---

## 참고 파일

| 파일 | 내용 |
|------|------|
| `docs/superpowers/specs/2026-05-20-cosmic-korean-font-system-design.md` | 폰트 시스템 명세 (완료) |
| `docs/superpowers/plans/2026-05-20-cosmic-korean-font-system.md` | 폰트 시스템 구현 계획 (완료) |
| `docs/superpowers/specs/2026-05-20-cosmic-korean-dual-mode-design.md` | **듀얼 모드 명세 (내일 시작점)** |
| `src/app/globals.css` | 디자인 시스템 단일 진실 공급원 |
| `src/app/layout.tsx` | next/font 변수 노출 + (내일) ThemeProvider 추가 |
| `src/app/page.tsx` | 데모 페이지 — 하드코딩 hex 시맨틱화 필요 (내일) |
| `package.json` | 내일 `next-themes` 추가 예정 |

---

## 세션 회복 팁

내일 새 세션 시작 시:
1. 이 파일(`task-log.md`)을 먼저 읽어 컨텍스트 회복
2. 위 "내일 시작 시 첫 액션" Step 1부터 진행
3. Claude는 자동 메모리·git 로그·CLAUDE.md를 통해 추가 컨텍스트 보강
4. 막힐 때 `git log --oneline -10`으로 최근 진척 확인
