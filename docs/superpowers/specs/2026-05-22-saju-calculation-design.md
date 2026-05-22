# Saju 4-Pillar Calculation — 디자인 설계서

- **작성일:** 2026-05-22
- **상태:** 설계 승인 대기
- **선행 명세:**
  - `2026-05-21-baekui-hanji-pivot-design.md` (디자인 시스템 — 완료, main)
  - `2026-05-21-kst-converter-design.md` (KST 변환기 — 완료, main)
- **TDD:** 적용 (도메인 로직 + URL round-trip). UI는 시각/수동 검증.

---

## 1. 컨텍스트 및 동기

KST 변환기 사이클로 사용자의 출생 시각이 KST로 정렬되고 12지지(시주) 미리보기까지 도착함. 그러나 결과 모달의 **"Discover your saju →"** CTA는 여전히 disabled + "Coming Soon" 배지 상태로 남아있어, 랜딩에서 가장 큰 약속이 미완성. 이번 사이클은 그 약속을 푼다.

사주의 핵심은 **4기둥(年柱/月柱/日柱/時柱)** — 각 기둥은 천간(天干, 10) + 지지(地支, 12) = 60갑자 cycle. 이번 사이클은 4기둥 계산 + 오행(五行) 컬러링 + 일간(日干) 강조 + 십신(十神) 매핑까지 ship한다 (사용자 결정 L3 스코프).

### 1.1 사용자 가치

- **약속 이행:** "Discover your saju →"가 실제 작동
- **사주 핵심 정보 전달:** 4기둥 + 오행 + 십신 = 최소한의 의미 있는 명리 단위
- **공유/북마크 가능한 결과 페이지:** 외국 친구에게 "내 사주 보여줄게" 가능 (K-curiosity hook)
- **SEO crawlable:** "saju calculator", "korean four pillars" 검색 진입점 확보

### 1.2 사용자 결정 사항 (브레인스토밍 outcome)

- 방향: 사주 4기둥 계산 (UI 최소 확장 포함)
- 스코프: **L3** = 4기둥 + 오행 + 일간 강조 + 기둥별 1줄 + 십신
- Placement: **별도 `/saju` 페이지** (modal 확장 아님)
- 계산 데이터: **사전 생성 상수 테이블** (1900–2050 절기 boundary JSON)
- 데이터 흐름: **URL query params** (공유/북마크 가능)
- 시각 unknown: **β 정책** — 3기둥 표시 + 시주는 `?` + "Add a time" 안내
- 레이아웃: **A) Compact one-screen** — 4열 그리드, 한 번 스크롤로 끝

---

## 2. 목표

1. 1900–2050 범위 내 양력 생년월일 + (선택) 시각 + timezone → 사주 4기둥 계산
2. 결과를 **별도 `/saju` 페이지**에서 표시 (Server Component, URL query params)
3. 각 기둥에 천간/지지 한자 + 한글 reading + 오행 + 음양 표시
4. **일주의 천간(=일간)을 시각적으로 강조**하고 1-2문장 keyword 설명
5. **십신(十神)** 매핑 — 일간 기준 다른 7~9 위치의 관계 표시
6. **오행 분포(wuXingBalance)** — 8자(또는 6자) 분포를 가벼운 시각 요소로
7. 랜딩의 `KstResultModal` CTA 활성화 — disabled 해제, `<Link href={sajuHref(birth)}>`로 연결
8. 외국 OS(한자 폰트 미설치 환경)에서도 한자 100% 렌더 — Noto Serif KR fallback
9. 도메인 로직 + URL round-trip을 vitest TDD로 커버
10. 디자인 시스템(한지/창살/Cosmic Korean) 위에 자연 통합 — 시맨틱 토큰만 사용

### 2.1 비목표 (Out of Scope)

- **십신 상세 해석문** — 위치별 1줄 의미만, 풀 personality reading은 향후
- **대운(大運) 10년 운세** — 다음 사이클(L4) 대상
- **신살(神煞), 공망(空亡), 12운성** — 풀 명리 학문 영역
- **음력 입력 지원** — 사용자는 양력만 입력. 음력만 아는 사용자는 향후 별도 변환 옵션
- **사용자 가입/저장** — Auth + DB는 backlog (admin/premium 사이클)
- **사주 결과 OG 이미지 자동 생성** — Section 4의 `generateMetadata`는 텍스트 메타만; 이미지는 별도
- **모바일에서 사주 결과의 미세 typography 최적화** — 핵심 4-col 작동만 보장, 추가 폴리시는 별도

---

## 3. 아키텍처 — 5-layer

```
① 절기 boundary 룩업                  — src/lib/saju-boundaries.ts (+ .json)
   "임의 datetime → 그 시각이 속한 절기 인덱스"
   ↓ 호출
② 사주 도메인 상수                    — src/lib/saju-data.ts
   천간/지지 정보, 오행/음양, 지지장간, 십신 매트릭스, 5虎遁/5鼠遁
   ↓ 사용
③ 계산 로직                            — src/lib/saju-calculator.ts
   computeSaju(BirthData): SajuResult
   ↓ 호출
④ URL 직렬화                          — src/lib/saju-url.ts
   sajuHref(birth)  ·  parseSajuParams(URLSearchParams): BirthData | null
   ↓ 사용
⑤ 페이지 + UI 컴포넌트                — src/app/saju/page.tsx (Server Component)
   SajuIntro · SajuPillars · DayMasterCard · not-found.tsx
```

**책임 분리 근거:**
- ①은 사주 도메인 모름 — "datetime → 절기 인덱스" 단일 책임. 향후 다른 명리 도구에서도 재사용
- ②는 함수 0개, 상수만 — 데이터 무결성 단위 테스트로 검증
- ③은 ① + ②만 의존, 다른 의존 없음. 100% 순수 함수
- ④는 ↔ 변환만 — Zod 검증 포함
- ⑤ 페이지는 orchestration. 컴포넌트는 `SajuResult` 형태만 받는 presentational

**기존 코드 재사용:**
- `convertToKST(birth)` from kst-converter.ts → ③ 내부에서 시각 보정
- `getJiziHour(hour)` → ③ 내부에서 시지(時支) 도출
- `birthSchema` (Zod) from kst-types.ts → ④에서 monthly maxDay 검증 재사용

---

## 4. 데이터 모델

### 4.1 핵심 타입 (`src/lib/saju-types.ts`)

```ts
export type HeavenlyStem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type EarthlyBranch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type WuXing  = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYang = 'yin' | 'yang';

export type SipSin =
  | 'bigyeon'   // 比肩
  | 'geopjae'   // 劫財
  | 'sikshin'   // 食神
  | 'sanggwan'  // 傷官
  | 'pyeonjae'  // 偏財
  | 'jeongjae'  // 正財
  | 'pyeongwan' // 偏官 (七煞)
  | 'jeonggwan' // 正官
  | 'pyeonin'   // 偏印
  | 'jeongin';  // 正印

export type SajuPillar = {
  position: 'year' | 'month' | 'day' | 'hour';
  stem: {
    char: HeavenlyStem;
    ko: string;                  // "갑"
    element: WuXing;
    yinYang: YinYang;
    sipSin: SipSin | null;       // 일주 stem은 null (자기 자신)
  };
  branch: {
    char: EarthlyBranch;
    ko: string;                  // "자"
    element: WuXing;
    yinYang: YinYang;
    primaryHiddenStem: HeavenlyStem;  // 지지장간 본기
    sipSin: SipSin;              // 본기 천간 기준
  };
};

export type SajuResult = {
  source: {
    birthLocal: BirthData;       // 원본 (재가공 없이)
    kstLabel: string;            // "1999년 3월 16일 04:30 KST"
    timeKnown: boolean;
  };
  pillars: {
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    hour: SajuPillar | null;     // 시각 unknown → null (β 정책)
  };
  dayMaster: {
    stem: HeavenlyStem;
    ko: string;
    element: WuXing;
    yinYang: YinYang;
    keyword: string;             // "Yin Wood — flexible, growing"
  };
  wuXingBalance: Record<WuXing, number>;  // 8자(시각 known) or 6자(unknown) 분포
};
```

### 4.2 사주 도메인 상수 (`src/lib/saju-data.ts`)

함수 없음, 모두 `as const` 객체:
- `HEAVENLY_STEMS`: 10개 천간 각각의 `{ char, ko, element, yinYang }`
- `EARTHLY_BRANCHES`: 12개 지지 각각의 `{ char, ko, element, yinYang, primaryHiddenStem }`
- `WUXING_PRODUCE`: 5행 생(生) cycle 매핑 — `{ wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' }`
- `WUXING_CONTROL`: 5행 극(剋) cycle 매핑 — `{ wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' }`
- `OHO_DUN`: 五虎遁 — `{ '甲': '丙', '乙': '戊', ... }` (년간 → 寅月 시작 천간)
- `OSEO_DUN`: 五鼠遁 — `{ '甲': '甲', '乙': '丙', ... }` (일간 → 子時 시작 천간)
- `DAY_MASTER_KEYWORDS`: 10천간 각각의 keyword 문구 (영문)

### 4.3 절기 boundary 데이터 (`src/lib/saju-boundaries.json`)

```jsonc
{
  "1900": [
    { "term": "ipchun", "utc": "1900-02-04T20:32:00Z" },
    { "term": "gyeongchip", "utc": "1900-03-06T..." },
    // ... 12 entries per year (월령 절기만, 24절기 중 12개)
  ],
  "1901": [ ... ],
  // ...
  "2050": [ ... ]
}
```

- 1900–2050: 151년 × 12 = 1,812 entry
- 시각 정밀도: 분 단위 충분 (사주 boundary는 분 단위에서 명확)
- 데이터 생성: Meeus 태양 황경 알고리즘으로 일회 계산 + KASI 8 ground truth로 sanity-check (plan에서 스크립트화)
- 시간대: UTC ISO 8601로 저장 → 런타임에 KST 변환 lookup
- 사이즈: ~80KB (gzip 후 ~25KB), Server bundle only

---

## 5. 도메인 계산 로직

### 5.1 진입점

```ts
export function computeSaju(birth: BirthData): SajuResult;
```

### 5.2 흐름

```
1. kst = convertToKST(birth)              // 기존 재사용 (kst-converter.ts)
2. yearPillar  = computeYearPillar(kst)
3. monthPillar = computeMonthPillar(kst, yearPillar.stem)
4. dayPillar   = computeDayPillar(kst)    // 자시(KST 23:00 ≥) → 다음날 일주
5. hourPillar  = kst.hour != null
     ? computeHourPillar(kst, dayPillar.stem)
     : null
6. 십신 매핑 ← computeSipSin(dayPillar.stem.char, others)   // 7~9 위치
7. wuXingBalance ← count(stems + branches)
8. dayMaster ← lookup(dayPillar.stem, DAY_MASTER_KEYWORDS)
9. return SajuResult
```

### 5.3 각 기둥 공식

**년주**:
- birth가 그해 입춘(立春) 이전이면 `year_used = year − 1`, 그 외 `year_used = year`
- `stemIdx = (year_used − 4) mod 10`, `branchIdx = (year_used − 4) mod 12`
- 앵커: 1984 = 甲子年

**월주**:
- `saju-boundaries.json`에서 birth ≥ boundary[i] && birth < boundary[i+1]인 i 찾기
- branch = `寅月` + i (즉 입춘 직후 = 寅月, 경칩 직후 = 卯月 ...)
- stem = `OHO_DUN[yearStem]`을 寅月 시작으로 잡고 branch offset만큼 +

**일주**:
- 60갑자 cycle. 앵커: `1900-01-01 KST = 甲戌日`
- `dayDiff = Math.floor((kst_at_midnight − 1900-01-01 KST) / 1day)`
- 자시 보정: `kst.hour >= 23` → `dayDiff += 1`
- `stemIdx = (dayDiff + offsetForGapsul) mod 10`, branchIdx 동일
- 앵커 정확도는 KASI 만세력 골든 데이터로 plan 단계에서 cross-check

**시주**:
- branch = `getJiziHour(kst.hour).char` (기존 재사용 — 단, 23:00은 子時)
- stem = `OSEO_DUN[dayStem]`을 子時 시작으로 잡고 branch offset만큼 +

### 5.4 십신 매핑

```ts
function sipSinOf(dayStem: HeavenlyStem, other: HeavenlyStem): SipSin {
  const D = HEAVENLY_STEMS_INDEX[dayStem];  // { element, yinYang }
  const S = HEAVENLY_STEMS_INDEX[other];
  const sameYY = D.yinYang === S.yinYang;

  if (D.element === S.element)            return sameYY ? 'bigyeon'   : 'geopjae';
  if (WUXING_PRODUCE[D.element] === S.element) return sameYY ? 'sikshin'   : 'sanggwan';
  if (WUXING_CONTROL[D.element] === S.element) return sameYY ? 'pyeonjae'  : 'jeongjae';
  if (WUXING_CONTROL[S.element] === D.element) return sameYY ? 'pyeongwan' : 'jeonggwan';
  /* WUXING_PRODUCE[S.element] === D.element */ return sameYY ? 'pyeonin'   : 'jeongin';
}
```

- 천간: 일간 외 3개 위치 직접 적용
- 지지: `primaryHiddenStem` 기준으로 같은 함수 적용
- 일간 자신의 stem은 `sipSin: null`

### 5.5 wuXingBalance

- 4 stems의 `element` + 4 branches의 `element` (시각 known이면 8자, 아니면 6자) 카운트
- 결과: `{ wood: 2, fire: 1, earth: 3, metal: 0, water: 2 }` 형태

### 5.6 비용 & 결정성

- 모든 함수가 동기, 순수, 마이크로초 단위. 외부 호출 없음.
- 같은 input → 같은 output (deterministic) → Server Component에서 매 request 계산해도 부담 없음.

---

## 6. URL/route 처리

### 6.1 URL 스키마

```
/saju?y=1999&m=3&d=15&h=14&min=30&tz=America%2FNew_York
```

| 키 | 타입 | 필수 | 범위 |
|---|---|---|---|
| `y` | int | ✅ | 1900–2050 |
| `m` | int | ✅ | 1–12 |
| `d` | int | ✅ | 1–31 (월별 maxDay 검증) |
| `h` | int | ❌ | 0–23 |
| `min` | int | ❌ | 0–59 (h 있으면 기본 0) |
| `tz` | string | ✅ | IANA name |

### 6.2 `saju-url.ts` 표면

```ts
parseSajuParams(searchParams: URLSearchParams): BirthData | null
sajuHref(birth: BirthData): string
```

- `parseSajuParams`: `z.coerce.number()`로 string→number + 기존 `birthSchema`의 `superRefine`(월별 maxDay) 재사용. 실패 시 `null`.
- `sajuHref`: `URLSearchParams`로 안전 encode (`/` → `%2F` 자동).

### 6.3 Server Component 흐름 (`app/saju/page.tsx`)

```ts
1. params = await searchParams;            // Next.js 15+ async API
2. birth  = parseSajuParams(toUrlParams(params));
3. if (!birth) notFound();
4. try { saju = computeSaju(birth) } catch { notFound() }
5. <main className="hanji-paper">
     <SajuIntro saju={saju} />
     <SajuPillars pillars={saju.pillars} />
     <DayMasterCard dayMaster={saju.dayMaster} balance={saju.wuXingBalance} />
     <Link href="/">← Edit my birth info</Link>
   </main>
```

> Plan 단계에서 `node_modules/next/dist/docs/` 확인 필수 — App Router의 searchParams API 및 force-static/revalidate 옵션 (AGENTS.md 규칙).

### 6.4 `generateMetadata` (SEO/공유)

- title: `"己卯·乙未 · Your Saju · KSaju"` (년주·일주 한자)
- description: `"Your 사주 four pillars and ten gods, computed from your birth time."`
- OG image: 이번 사이클 out of scope (텍스트 메타만)

### 6.5 Landing 연결

`KstResultModal`:
- 신규 prop: `birth: BirthData | null`
- 기존 disabled `<Button>` → `<Link href={sajuHref(birth)}>` (활성)
- 시각 unknown이어도 CTA 활성 (β 정책)

---

## 7. UI 컴포넌트 구조

### 7.1 페이지 구성

```tsx
<main className="hanji-paper">
  <Changsal top />
  <SajuIntro saju={saju} />
  <SajuPillars pillars={saju.pillars} />
  <DayMasterCard dayMaster={saju.dayMaster} balance={saju.wuXingBalance} />
  <Link href="/">← Edit my birth info</Link>
  <Changsal bottom />
</main>
```

### 7.2 SajuPillars (코어)

```
┌──────┐┌──────┐┌══════┐┌──────┐    grid-cols-4 (sm+)
│ 年柱 ││ 月柱 ││ 日柱★││ 時柱 │    grid-cols-2 (모바일 ~< 400px)
│  己  ││  丁  ││  乙  ││  戊  │   stem 한자, font-serif
│  卯  ││  卯  ││  未  ││  寅  │   branch 한자, font-serif
│ 기묘 ││ 정묘 ││ 을미 ││ 무인 │   ko reading
│ 土·木││ 火·木││ 木·土││ 土·木│   element badge stem · branch
│[偏財]││[食神]││[日干]││[正財]│   sipSin chip
└──────┘└──────┘└══════┘└──────┘
```

- 일주 cell: `border-[3px] border-foreground` + 두꺼운 음영. 다른 cell: `border-2 border-<wuxing-color>/50` + 8% 배경
- sipSin chip: 일주는 `[日干]` 배지, 나머지는 십신 한자(영문 tooltip)
- 시각 unknown: 時柱 cell — 한자 자리 `?` + 그레이드 + 하단 `Add a time` 링크

### 7.3 DayMasterCard

- 큰 일간 한자 (예: 乙) + keyword ("Yin Wood — flexible, growing")
- wuXingBalance: 5개 element 가로 막대 또는 dot (`saju.wuXingBalance` 카운트 표시)
- 1-2문장 친절한 영문 설명

### 7.4 SajuIntro

- 페이지 제목: `"Your 사주"` + 영문 부제
- birth 소스: `"Born March 15, 1999 14:30 in New York → KST 1999년 3월 16일 04:30"`

### 7.5 오행 컬러 매핑 (디자인 시스템 확장)

| 五行 | Color (Light) | 토큰 | Dark mode |
|---|---|---|---|
| 木 Wood | green | **신규** `--color-wuxing-mok` | 채도/명도 조정 변종 |
| 火 Fire | crimson | 기존 `--color-jindallae` | 기존 `--color-saju-pink` |
| 土 Earth | ochre | 기존 `--color-dancheong` | 기존 `--color-korean-gold` |
| 金 Metal | silver | **신규** `--color-wuxing-geum` | 채도/명도 조정 변종 |
| 水 Water | celadon | 기존 `--color-cheongja` | 신규 변종 |

→ `globals.css`의 `:root` + `.dark` + `@theme inline` 셋 모두에 신규 토큰 4개 등록 (light 2 + dark 2~4).

### 7.6 한자 렌더링 보장 (외국 OS 대응)

font-family chain (모든 한자 표시 위치에 적용):
```css
font-family:
  "Gowun Batang",          /* 디자인 의도 — 명조 */
  "Noto Serif KR",         /* 한자 fallback (Google Fonts) */
  "Noto Sans CJK KR",      /* 최후의 CJK safety */
  serif;
```

- `Noto Serif KR`를 `next/font/google`로 추가 로드 (subset 옵션으로 KB 최소화)
- 사용 한자 글리프는 Appendix A에 명시 (총 약 50자, 고정)
- Plan에 외국 OS 시각 검증 task 추가 (Windows EN / Linux Docker)

### 7.7 한지 테마 유지

- `.hanji-paper` 배경 (이번 세션에서 사진 적용된 그것)
- `.changsal-band` 상하단
- `.hanja` / `.font-calli` 클래스 재사용
- 신규 컴포넌트들은 시맨틱 토큰만 (`text-foreground`, `bg-card`, `border-border`) — C1 fix 이후 안정

---

## 8. 에러 처리 & 엣지 케이스

### 8.1 `notFound()` 트리거

- 필수 param 누락 / 범위 밖 / 잘못된 월·일 조합 / 잘못된 IANA tz / `computeSaju` 내부 throw

### 8.2 boundary inclusivity 규칙 (모두 `>=` 일관)

| 케이스 | 규칙 |
|---|---|
| 입춘 정시각 | 새 사주년도 시작 |
| 절기 정시각 | 다음 월령 진입 |
| 자시 진입 (KST 23:00:00) | 다음 일주 시작 |

→ 규칙 일관성 = TDD에서 boundary case 단일 패턴 검증. 모든 lookup: "`time >= boundary[i]` → i번째 cell".

### 8.3 자시 컨벤션

- KST 23:00–24:00: 다음날 일주 적용 (정자시 표준)
- 시지지는 子時 (Rat) — `getJiziHour()`에 이미 반영됨

### 8.4 음력 입력 미지원

- 사주 계산은 항상 양력(절기 기준), 사용자 입력도 양력만 받음
- 음력만 아는 사용자는 별도 변환 필요 — 향후 사이클 (현재 사이클 out of scope)
- Landing 폼 placeholder/hint에 `"Solar (Gregorian) date"` 영문 명시 권장 (별도 폴리시)

### 8.5 일주 epoch anchor 검증

- 앵커 `1900-01-01 = 甲戌일`은 KASI 만세력 cross-check 8 case로 검증 (plan 단계)
- 검증 케이스 예: 1984-02-04 입춘 = 甲子년 시작, 2000-01-01 = 庚辰년 / 戊午일주, 1900-01-01 = 甲戌일

### 8.6 런타임 안전망

- `computeSaju`가 절기 룩업 실패 시 throw → page level에서 `notFound()`. 정상 1900–2050 안에서 발생 안 함 (불변).
- `import boundaries from "./saju-boundaries.json"`은 정적 → 런타임 파싱 에러 없음.

### 8.7 UI 에러

- `not-found.tsx` — 친절한 영문 메시지 + "← Back to home". Hanji 테마.
- 일반 500: Next.js 기본 error boundary (도메인 입력 사전 검증으로 사실상 도달 불가)

### 8.8 개인정보 가벼운 메모

- birth date/time이 URL에 노출됨 (사용자 결정 사항 — 공유 가능성 우선)
- 로그인 없이 누구나 같은 URL로 같은 결과 → 비식별 / 공공 데이터
- 향후 admin 분석 도입 시 birth params를 로그에 남길지 별도 결정 (backlog)

---

## 9. 테스트 전략

### 9.1 TDD 단위 (vitest, Node env — 기존 인프라 재사용)

| 파일 | 범위 |
|---|---|
| `saju-boundaries.test.ts` | 절기 lookup boundary 직전/정각/직후, 1900/2050 가장자리 |
| `saju-calculator.test.ts` | KASI 검증 골든 5–8 케이스. 자시 23:00. 입춘 정시각. 시각 unknown → hour null |
| (계속) | 십신 매트릭스 10×10 천간 enumerate 프로그래밍 검증 (100 cells) |
| `saju-url.test.ts` | round-trip · 강제 변환 · 시각 optional · 범위 밖/누락 → null · tz 잘못 → null |
| `saju-data.test.ts` | 사이즈/매핑 무결성 — 천간 10, 지지 12, 오행 5, 십신 10 enum |

### 9.2 UI 시각 검증 (Task 11 패턴, 시크릿 창)

1. /saju 정상 (4기둥 그리드 + 일간 강조 + 오행 컬러 + 십신 칩)
2. /saju 시각 unknown — 시주 cell `?` + "Add a time" 링크
3. /saju invalid params → not-found.tsx
4. /saju 다크 모드 색 조정
5. /saju 모바일 (375px) — 4-col cramp 또는 2x2 break 확인
6. **외국 OS 한자 렌더** — Windows EN / Linux Docker (no CJK pack) — Noto Serif KR fallback 로딩 (DevTools Network) 확인
7. Landing CTA disabled 해제 · params 인코딩
8. URL 공유/북마크 — 시크릿 새 창에서 같은 결과

### 9.3 비기능 게이트 (Task 11 동일)

- `npm test`: 기존 22 + 신규 saju tests 모두 통과
- `npm run lint`: 0 errors (기존 form.tsx unused-ref warning 유지)
- `npm run build`: 성공
- 절기 JSON ~80KB는 server bundle만 (client에 안 들어감 — Server Component 자동)

### 9.4 데이터 정확도 audit

- 절기 boundary JSON 생성 알고리즘 (Meeus solar longitude) + KASI 8 ground truth와 cross-check task를 plan에 명시

### 9.5 Final code review 디스패치 (Task 11 패턴)

도메인 로직 + 라우팅 + UI + 한자 fallback 검증 포함

---

## Appendix A — 사용 한자 글리프 (~50자)

- 천간 (10): 甲 乙 丙 丁 戊 己 庚 辛 壬 癸
- 지지 (12): 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥
- 오행 (5): 木 火 土 金 水
- 십신 (10×2자): 比肩 劫財 食神 傷官 偏財 正財 偏官 正官 偏印 正印 (= 한자 14개, 중복 제거)
- 위치 라벨 (4): 年柱 月柱 日柱 時柱 (한자 6개 중복 제거 후)
- 추가: 立春 (입춘), 日干 (일간), 七煞 (칠살 — 偏官 별칭)

→ 총 약 50자. `next/font/google`의 `subsets` + `display: swap` 으로 효율 로드.

## Appendix B — 절기 데이터 생성 방식

- **알고리즘**: Jean Meeus, *Astronomical Algorithms* (2nd ed., 1998) 의 태양 황경 계산
- **단계**: 매년마다 12절기(월령) 시각을 분 단위 정밀도로 계산 → JSON에 UTC ISO 8601 저장
- **Validation**: KASI 만세력 8 ground truth 케이스와 cross-check (분 단위 일치 요구)
- **재생성 스크립트**: `scripts/generate-saju-boundaries.ts` (Node, plan 단계 작성). CI에서는 실행 안 하고 결과 JSON만 사용.

## Appendix C — 미해결 / 향후 사이클로 미룬 것

`docs/superpowers/backlog.md` 참조:
- 사주 결과 OG 이미지 자동 생성
- 음력 입력 옵션
- 대운(L4) 사이클
- 분석/관리자 페이지 + premium/billing + logging (별도 트랙)
