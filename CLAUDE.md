@AGENTS.md

# CLAUDE.md — KSaju Project Context

> 이 파일은 Claude Code가 자동으로 읽는 프로젝트 컨텍스트입니다.
> 프로젝트 루트에 두고 git에 커밋하세요. 방향이 바뀌면 이 파일을 업데이트하세요.
>
> 상단의 `@AGENTS.md`는 Next.js 16 breaking-change 경고를 import 합니다. 기술/빌드 노트는 그쪽에서 관리합니다.

---

## 🎯 프로젝트 한 줄 정의

**KSaju** = 외국인 K-pop 팬(10-20대)을 위한 **공유용 사주 궁합 카드 생성기**.
"내 최애(bias)와 나의 사주 궁합"을 재밌고 아름다운 카드로 만들어 SNS에 공유하게 하는 바이럴 소셜 토이.

- **도메인:** ksaju.me
- **타겟:** 영어권 외국인 K-pop 팬, Gen Z (10-20대)
- **무드:** 가볍고, 재밌고, 공유하고 싶은 (NOT 진지한 운명 상담)
- **태그라인:** "Saju, but make it K." (또는 진화 가능)

## 🏆 포지셔닝 / Wedge (왜 이 방향인가)

경쟁자(Seoul Saju, Sajume)는 **깊이 있는 유료 사주 리포트 서비스**다.
우리는 그들과 깊이로 경쟁하지 **않는다**. 대신:

| 경쟁자 | KSaju |
|---|---|
| 7,000자 진지한 리포트 | 짧고 재밌는 공유 카드 |
| 유료 리딩 판매 | 무료 + 바이럴 |
| 일반 자기이해 | K-pop 팬덤 네이티브 |
| 트랜잭션 | 소셜·커뮤니티·콘텐츠 브랜드 |

**핵심 원칙:** 궁합 점수는 *계산*한다(규칙 기반). 깊은 *해석*은 하지 않는다.
짧고 fun한 리딩만 LLM으로 생성. 명리학 깊이 엔진과 경쟁 금지.

## 📦 MVP 범위 (v1) — 딱 이것만

> **🔄 방향 업데이트 (2026-05-27):** 사용자 결정으로 **"내 사주가 메인, 아이돌 궁합은 fun 부가 기능"**으로 피벗.
> 핵심 흐름은 `생일 입력 → 내 사주 결과(메인) → (부가) 최애와 궁합 → 공유`. 아래 원문 흐름은 궁합 중심이었음.
> 단 "깊은 리딩 금지 / depth 비경쟁" 원칙은 유지(가벼운 사주 카드). 향후 본 섹션 정식 재작성 필요.

**핵심 사용자 흐름:**
1. 랜딩 (한지 미감, 밝고 fun)
2. 내 생일 입력 (+ 출생시간 선택사항)
3. 최애(bias) 선택 — 아이돌 DB에서 검색·탭
4. "Reveal compatibility ✨" 탭
5. 공유 카드 생성: 궁합 점수 + 오행 관계 + 짧은 fun 리딩 + 양쪽 사주 미니 + ksaju.me 워터마크
6. Share (IG Story / TikTok 다운로드)
7. "Check another idol" 반복 루프

**⛔ v1에서 만들지 말 것 (스코프 규율):**
- 개인 풀 사주 리딩 (나중)
- 깊은 분석 리포트 (경쟁자 영역, 금지)
- 타로, 작명 등 부가 기능 (나중)
- 회원가입 강제 (마찰 최소화, 게스트 우선)

## 🎨 디자인 방향 — "백의민족 한지" 라이트 우선

- **기본 = 라이트 모드 (한지 테마)**, Cosmic Korean = 다크 모드 토글
- next-themes 사용, defaultTheme="light"

**라이트 팔레트 (백의민족):**
- 한지 `#FBF6E8` (background) / 백자 `#FFFFFF` (card)
- 묵 `#1A1A2E` (foreground) / 진달래 `#C8385A` (primary)
- 단청황 `#C49A3F` (accent) / 청자 `#88B0BC` (sub)

**다크 팔레트 (Cosmic Korean):**
- Cosmic Navy `#0F0828` / Saju Pink `#FF4D8D` / Korean Gold `#F4C95D` / Hanji Cream `#FFF6E5`

**모티프:** 창호지 텍스처, 창살(井자) 프레임, 한글 자음(ㅎ) 배경 디자인 요소
**폰트:** Gowun Batang/Nanum Myeongjo(한글 명조), Geist+Inter(영문), Pretendard(한글 본문)
**로고:** 낙관(落款) 도장 미감 — 井 격자 + 四柱 한자 (또는 SA·JU), 인주 빨강 `#B5304A`

## 🛠️ 기술 스택 (확정)

- Next.js 16.2 + React 19.2 + TypeScript 5.9
- Tailwind v4 (CSS-first `@theme` 블록, globals.css에 토큰)
- shadcn/ui (Maia 프리셋, Radix 기반) — form/select 포함
- Supabase (SSR) — 백엔드/DB (Phase 후반)
- **사용자 사주 변환(완료):** `@fullstackfamily/manseryeok` 1.0.8 (KASI 기반, 진태양시 보정). `src/lib/saju.ts`의 `birthToSaju`가 사용자 생일 → 4기둥 한자 변환. server-only + `calcUserSaju` Server Action 경유(~300KB를 클라이언트에서 제외).
- **궁합 엔진(완료):** `src/lib/compatibility.ts` — 한자 4기둥 2개를 받아 0-100 점수 + fun 레이블 산출. 명리학 규칙(천간합/충, 오행 상생·상극, 지지 삼합/육합/충) 기반. 23개 vitest 테스트.
- 보조: date-fns-tz, next-themes, next-intl, react-hook-form, zod, vitest
- 배포: Vercel (마지막 단계), 도메인 ksaju.me

**보류 cycle:** 자체 사주 계산기(`docs/superpowers/plans/2026-05-22-saju-calculation.md`) — Tasks 1-3 commit(`bba3d7b`/`0d30570`/`0df88da`/`8b49d07`)은 보존(도메인 상수·타입을 궁합 엔진이 재사용 중). Task 4 커밋은 revert(`b011acd`). 향후 manseryeok 정확도 부족 시 부활 검토.

## 🔮 사주 + 궁합 흐름

```
사용자 생일 → manseryeok → 4기둥 한자(8자) ─┐
                                              ├→ compatibility.ts → score + label
아이돌 (DB pre-computed 한자) ────────────────┘
```

- 한자 4기둥 = 천간(stem) + 지지(branch) × 4 = "壬申·己酉·辛卯·..." 형식
- 도메인 상수/타입: `src/lib/saju-data.ts` (HEAVENLY_STEMS, EARTHLY_BRANCHES, WUXING_PRODUCE, WUXING_CONTROL), `src/lib/saju-types.ts` (WuXing, HeavenlyStem, EarthlyBranch)
- 궁합 엔진 사용:

```typescript
import { calcCompatibility, normalizeIdolSaju } from '@/lib/compatibility';

const me   = { year: '壬申', month: '己酉', day: '辛卯' };  // manseryeok 출력에서 추출
const idol = normalizeIdolSaju(idolDbEntry.saju);            // DB 객체 → 한자 문자열
const r = calcCompatibility(me, idol);
// r.score (0-100), r.label, r.breakdown.{dayMaster, elementBalance, branch}
```

## 🎴 아이돌 DB

- **위치:** `data/ksaju-idol-db.json` (76명 / 14개 그룹, 사주 사전 계산됨)
- **그룹:** BTS, BLACKPINK, NewJeans, IVE, aespa, LE SSERAFIM, TWICE, Stray Kids, ENHYPEN, TXT, ITZY, (G)I-DLE, Red Velvet, IU
- **스키마:** `{ id, name, group, birthdate, saju: { year:{kr,hanja}, month:{kr,hanja}, day:{kr,hanja}, dayMaster } }`
- ⚠️ NewJeans/IVE/LE SSERAFIM 생일은 웹 검증됨. 나머지는 재확인 권장(나무위키)
- 확장: 인기 그룹·멤버 추가 가능 (SEVENTEEN, NCT 등)

## 🧮 궁합 계산 로직 (설계 예정 — 다음 작업)

규칙 기반 점수(0-100) + fun 레이블. 명리학 기본 규칙:
- **오행 상생/상극** (Five Element 상생: 木→火→土→金→水→木 / 상극: 木剋土 등)
- **일간 합/충** (천간 합: 甲己, 乙庚 등 / 충)
- **지지 합/충/형** (삼합, 육합 / 충)
→ 이 규칙들을 점수와 fun 영문 레이블("Water × Fire: Steamy chemistry 🔥")로 매핑.
→ 짧은 리딩(2-3줄)만 LLM 생성.

## 🚀 빌드 로드맵 (MVP)

1. ✅ Next.js 보일러플레이트 + 의존성
2. ✅ 한지 라이트 테마 + Cosmic 다크 토글 (백의민족 피벗 사이클)
3. ✅ KST 출생시각 변환기 (랜딩 hero card)
4. ✅ **궁합 계산 엔진** (`src/lib/compatibility.ts`, 23 tests) — 한자 4기둥 2개 → 점수+레이블
5. **아이돌 DB 통합 + 검색·선택 UX** (DB: `data/ksaju-idol-db.json` 76명)
   - ✅ DB 연동 레이어 (`src/lib/idols.ts`, 18 tests) — 로드·검색·`compatForIdol` 래퍼, 엔진과 연결
   - ✅ 검색·선택 컴포넌트 (`src/components/idols/` IdolPicker+IdolCard, 8 tests, RTL+happy-dom) — onSelect까지. 페이지 연결·궁합결과는 다음 사이클
6. ✅ **사용자 사주 한자 변환 (manseryeok)** — `src/lib/saju.ts`(server-only) `birthToSaju`/`toCompatPillars` + `src/app/actions/saju.ts` `calcUserSaju` Server Action. BirthData→convertToKST→calculateSaju, 4기둥(시주 포함). 9 tests (RM/Jin known-answer = 아이돌 DB와 일치). 궁합 me 측 입력 공급
7. ⏳ 공유 카드 컴포넌트 (한지 미감, 9:16, 이미지 익스포트)
8. **결과 + 공유 흐름** (사주 중심 피벗 — 아래 방향 업데이트 참고)
   - ✅ '내 사주' 인페이지 결과 뷰 (`src/components/saju/` SajuResult+PillarsGrid+WuxingBalance, `src/lib/saju-display.ts`, 12 tests). 폼→`calcUserSaju`→4기둥·일간·오행밸런스·KST 뷰. KstResultModal 은퇴
   - 🔨 궁합 + SNS 공유 모달 (아이돌 선택 → `compatForIdol` → 예쁜 공유 모달) — 다음 사이클
9. ⏳ Vercel 배포 + ksaju.me 연결

## 📣 마케팅 (병행)

- IG + TikTok 듀얼 에이스, faceless 보이스오버 콘텐츠
- 콘텐츠 = 앱 화면 녹화 ("I checked my saju compatibility with my bias")
- n8n 자동화 파이프라인 (콘텐츠 준비 → 이미지 → 게시 → 추적)
- 출시 6-8주 전부터 팬덤 빌딩, 웨이트리스트

## 💰 목표 / 성공 기준

- **목표: 월 $100 + "내가 처음 만든 것으로 돈을 벌었다"는 성취**
- 수익원: 무료(광고) + 소액 IAP(깊은 궁합) + 사주 K-pop 굿즈(POD, 나중)
- 시장: 영어 사주 시장은 리더도 소규모(~수백 고객) = 지배자 없는 열린 시장

## 🧑 개발자 컨텍스트

- 1인 개발 (45세 IT 인프라 엔지니어, 한국), 주 10-15시간, 예산 $500
- n8n 자동화·콘텐츠 제작 경험 보유
- 영어는 초급(셰도잉 학습 중) → 영어 콘텐츠는 직접 작성, AI는 아이디어·번역 보조
- 톤 선호: 정중하면서 친근

## ⚠️ 주의사항

- 아이돌 이름·생일은 공개 정보로 사용(궁합 식별용). 공식 사진·로고 사용 금지. "For entertainment 🌙" 디스클레이머.
- 타겟에 10대 포함 → 콘텐츠·톤은 밝고 건전하게. 팬덤 "shipping"의 가벼운 재미 수준. 로맨틱 진지 X.
