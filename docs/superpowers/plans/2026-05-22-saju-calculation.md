# Saju 4-Pillar Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자의 출생 정보(URL query params)로 사주 4기둥(年/月/日/時) + 오행 + 일간 + 십신을 계산해 `/saju` 별도 페이지에 표시하고, 랜딩의 disabled CTA를 활성화한다.

**Architecture:** 도메인 계산은 100% 순수 함수 + 사전 생성 절기 boundary JSON 룩업. `/saju`는 Next.js Server Component로 server에서 계산 후 정적 HTML 반환 (인터랙티브 JS 없음). 5-layer 분리: boundaries → data constants → calculator → URL → UI.

**Tech Stack:** TypeScript · Next.js App Router (Server Components) · Zod · vitest (Node env) · date-fns-tz (재사용) · Tailwind v4 + 시맨틱 토큰 · shadcn UI · `astronomia` (devDep, 절기 데이터 생성 스크립트 only) · `next/font/google` (Noto Serif KR 추가).

**Spec:** `docs/superpowers/specs/2026-05-22-saju-calculation-design.md`

---

## File Structure

**Create:**
- `scripts/generate-saju-boundaries.ts` — 1회 실행 데이터 생성 (devDep, 빌드/런타임 무관)
- `src/lib/saju-boundaries.json` — 1900-2050 × 12 절기 boundary (~80KB)
- `src/lib/saju-boundaries.ts` — JSON 룩업 함수
- `src/lib/saju-boundaries.test.ts`
- `src/lib/saju-types.ts` — 모든 사주 도메인 타입
- `src/lib/saju-data.ts` — 천간/지지/오행/십신/지지장간 상수
- `src/lib/saju-data.test.ts` — 데이터 무결성
- `src/lib/saju-calculator.ts` — `computeSaju()` + 기둥 계산 helpers
- `src/lib/saju-calculator.test.ts` — 단위 + 골든 케이스
- `src/lib/saju-url.ts` — URL params ↔ BirthData
- `src/lib/saju-url.test.ts`
- `src/app/saju/page.tsx` — Server Component
- `src/app/saju/not-found.tsx`
- `src/components/saju/saju-intro.tsx`
- `src/components/saju/saju-pillars.tsx`
- `src/components/saju/day-master-card.tsx`

**Modify:**
- `src/app/globals.css` — 오행 컬러 토큰 (light + dark + @theme inline)
- `src/app/layout.tsx` — Noto Serif KR 폰트 추가
- `src/components/kst/kst-result-modal.tsx` — `birth` prop 추가, CTA를 `<Link>`로
- `src/app/page.tsx` — modal에 birth 전달

**Test command:** `npm test` (vitest, Node env)
**Lint:** `npm run lint`
**Build:** `npm run build`

---

## Phase 1 — Foundation (Tasks 1-5)

### Task 1: 오행 컬러 토큰 + Noto Serif KR 폰트

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: AGENTS.md 규칙 — Next.js 폰트 문서 확인**

Read: `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`

목적: `next/font/google` API가 우리 next 버전에서 어떤 subsets/weights/variable 옵션을 받는지 확인. 기존 4개 폰트 패턴을 따른다.

- [ ] **Step 2: `src/app/layout.tsx` Noto Serif KR 추가**

기존 import 라인 수정:
```tsx
import { Geist, Inter, Gowun_Batang, Yeon_Sung, Noto_Serif_KR } from "next/font/google";
```

기존 폰트 선언 블록 아래에 추가:
```tsx
const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "700"],
  subsets: ["latin"],          // CJK 글리프는 unicode-range로 자동 subset
});
```

`<body className=...>`의 className에 `${notoSerifKR.variable}` 추가:
```tsx
className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} ${notoSerifKR.variable} antialiased bg-background text-foreground font-sans`}
```

- [ ] **Step 3: `src/app/globals.css` — 오행 컬러 토큰 등록**

`:root` 블록 끝(--ring 다음)에 추가:
```css
  /* === 오행(五行) 컬러 — 사주 페이지 === */
  --color-wuxing-mok:  #5E8B5E;  /* 木 Wood — 녹색 */
  --color-wuxing-hwa:  var(--color-jindallae);   /* 火 Fire — 진달래 재사용 */
  --color-wuxing-to:   var(--color-dancheong);   /* 土 Earth — 단청황 재사용 */
  --color-wuxing-geum: #A8A8B0;  /* 金 Metal — 은빛 */
  --color-wuxing-su:   var(--color-cheongja);    /* 水 Water — 청자 재사용 */
```

`.dark` 블록 끝에 추가 (다크 모드 변종):
```css
  /* === 오행 컬러 (Dark) === */
  --color-wuxing-mok:  #7BA67B;   /* 더 밝은 녹색 */
  --color-wuxing-hwa:  var(--color-saju-pink);
  --color-wuxing-to:   var(--color-korean-gold);
  --color-wuxing-geum: #C6C6CE;   /* 더 밝은 은빛 */
  --color-wuxing-su:   #88B0BC;
```

`@theme inline` 블록 끝(--color-ring 다음)에 추가:
```css
  --color-wuxing-mok:  var(--color-wuxing-mok);
  --color-wuxing-hwa:  var(--color-wuxing-hwa);
  --color-wuxing-to:   var(--color-wuxing-to);
  --color-wuxing-geum: var(--color-wuxing-geum);
  --color-wuxing-su:   var(--color-wuxing-su);
```

`/* === 한자/한글 텍스트 강조 유틸리티 === */` 위에 `.hanja` 보조 클래스 또는 신규 `.font-hanja` 추가는 불필요 — 기존 `.hanja`에 font-family chain만 보강:
```css
.hanja {
  font-family:
    var(--font-gowun-batang),
    var(--font-noto-serif-kr),
    "Noto Sans CJK KR",
    Georgia, serif;
  color: var(--accent);
  letter-spacing: 0.05em;
}
```

- [ ] **Step 4: 빌드 + dev 서버 sanity check**

Run: `npm run build`
Expected: success, 0 errors.

Run: `npm run dev` (백그라운드), 브라우저에서 `localhost:3000` 열어 폰트 로딩(Network 탭에서 Noto Serif KR fetch 확인)과 기존 한지 배경 정상 확인 후 dev 종료.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(saju): add Noto Serif KR font and wuxing color tokens

- Noto Serif KR via next/font for CJK fallback on foreign OS
- 5 wuxing color tokens (light + dark) with @theme inline registration
- Extend .hanja class font-family chain to Gowun Batang → Noto Serif KR → CJK"
```

---

### Task 2: 사주 도메인 타입 정의

**Files:**
- Create: `src/lib/saju-types.ts`

- [ ] **Step 1: `src/lib/saju-types.ts` 작성**

```ts
import type { BirthData } from "./kst-types";

export type HeavenlyStem =
  | "甲" | "乙" | "丙" | "丁" | "戊"
  | "己" | "庚" | "辛" | "壬" | "癸";

export type EarthlyBranch =
  | "子" | "丑" | "寅" | "卯" | "辰" | "巳"
  | "午" | "未" | "申" | "酉" | "戌" | "亥";

export type WuXing = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";

export type SipSin =
  | "bigyeon"    // 比肩
  | "geopjae"    // 劫財
  | "sikshin"    // 食神
  | "sanggwan"   // 傷官
  | "pyeonjae"   // 偏財
  | "jeongjae"   // 正財
  | "pyeongwan"  // 偏官
  | "jeonggwan"  // 正官
  | "pyeonin"    // 偏印
  | "jeongin";   // 正印

export type StemInfo = {
  char: HeavenlyStem;
  ko: string;             // "갑"
  element: WuXing;
  yinYang: YinYang;
};

export type BranchInfo = {
  char: EarthlyBranch;
  ko: string;             // "자"
  element: WuXing;
  yinYang: YinYang;
  primaryHiddenStem: HeavenlyStem;  // 지지장간 본기
};

export type SajuPillar = {
  position: "year" | "month" | "day" | "hour";
  stem: StemInfo & { sipSin: SipSin | null };  // 일주 stem은 null
  branch: BranchInfo & { sipSin: SipSin };
};

export type DayMaster = {
  stem: HeavenlyStem;
  ko: string;
  element: WuXing;
  yinYang: YinYang;
  keyword: string;        // "Yin Wood — flexible, growing"
};

export type SajuResult = {
  source: {
    birthLocal: BirthData;
    kstLabel: string;     // "1999년 3월 16일 04:30 KST"
    timeKnown: boolean;
  };
  pillars: {
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    hour: SajuPillar | null;   // 시각 unknown → null
  };
  dayMaster: DayMaster;
  wuXingBalance: Record<WuXing, number>;
};

export type SipSinLabels = {
  hanja: string;          // "正官"
  ko: string;             // "정관"
  en: string;             // "Direct Officer"
};
```

- [ ] **Step 2: TypeScript 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/saju-types.ts
git commit -m "feat(saju): add domain types (pillars, wuxing, sipSin)"
```

---

### Task 3: 사주 도메인 상수 + 데이터 무결성 test

**Files:**
- Create: `src/lib/saju-data.ts`
- Create: `src/lib/saju-data.test.ts`

- [ ] **Step 1: `src/lib/saju-data.ts` 작성**

```ts
import type {
  HeavenlyStem,
  EarthlyBranch,
  WuXing,
  YinYang,
  SipSin,
  StemInfo,
  BranchInfo,
  SipSinLabels,
} from "./saju-types";

// 천간 10 — 순서대로 0..9 인덱스
export const HEAVENLY_STEMS: readonly StemInfo[] = [
  { char: "甲", ko: "갑", element: "wood",  yinYang: "yang" },
  { char: "乙", ko: "을", element: "wood",  yinYang: "yin"  },
  { char: "丙", ko: "병", element: "fire",  yinYang: "yang" },
  { char: "丁", ko: "정", element: "fire",  yinYang: "yin"  },
  { char: "戊", ko: "무", element: "earth", yinYang: "yang" },
  { char: "己", ko: "기", element: "earth", yinYang: "yin"  },
  { char: "庚", ko: "경", element: "metal", yinYang: "yang" },
  { char: "辛", ko: "신", element: "metal", yinYang: "yin"  },
  { char: "壬", ko: "임", element: "water", yinYang: "yang" },
  { char: "癸", ko: "계", element: "water", yinYang: "yin"  },
] as const;

// 지지 12 — 子 = idx 0
export const EARTHLY_BRANCHES: readonly BranchInfo[] = [
  { char: "子", ko: "자", element: "water", yinYang: "yang", primaryHiddenStem: "癸" },
  { char: "丑", ko: "축", element: "earth", yinYang: "yin",  primaryHiddenStem: "己" },
  { char: "寅", ko: "인", element: "wood",  yinYang: "yang", primaryHiddenStem: "甲" },
  { char: "卯", ko: "묘", element: "wood",  yinYang: "yin",  primaryHiddenStem: "乙" },
  { char: "辰", ko: "진", element: "earth", yinYang: "yang", primaryHiddenStem: "戊" },
  { char: "巳", ko: "사", element: "fire",  yinYang: "yin",  primaryHiddenStem: "丙" },
  { char: "午", ko: "오", element: "fire",  yinYang: "yang", primaryHiddenStem: "丁" },
  { char: "未", ko: "미", element: "earth", yinYang: "yin",  primaryHiddenStem: "己" },
  { char: "申", ko: "신", element: "metal", yinYang: "yang", primaryHiddenStem: "庚" },
  { char: "酉", ko: "유", element: "metal", yinYang: "yin",  primaryHiddenStem: "辛" },
  { char: "戌", ko: "술", element: "earth", yinYang: "yang", primaryHiddenStem: "戊" },
  { char: "亥", ko: "해", element: "water", yinYang: "yin",  primaryHiddenStem: "壬" },
] as const;

// 천간 char → index 룩업
export const STEM_INDEX: Record<HeavenlyStem, number> = Object.freeze(
  HEAVENLY_STEMS.reduce((acc, s, i) => ({ ...acc, [s.char]: i }), {} as Record<HeavenlyStem, number>)
);
export const BRANCH_INDEX: Record<EarthlyBranch, number> = Object.freeze(
  EARTHLY_BRANCHES.reduce((acc, b, i) => ({ ...acc, [b.char]: i }), {} as Record<EarthlyBranch, number>)
);

// 오행 생(生) cycle: 木→火→土→金→水→木
export const WUXING_PRODUCE: Record<WuXing, WuXing> = {
  wood:  "fire",
  fire:  "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

// 오행 극(剋) cycle: 木→土→水→火→金→木
export const WUXING_CONTROL: Record<WuXing, WuXing> = {
  wood:  "earth",
  earth: "water",
  water: "fire",
  fire:  "metal",
  metal: "wood",
};

// 五虎遁(오호둔) — 년간 → 寅月(1번 사주월) 시작 천간
// 甲己之年 丙寅頭 · 乙庚之年 戊寅頭 · 丙辛之年 庚寅頭 · 丁壬之年 壬寅頭 · 戊癸之年 甲寅頭
export const OHO_DUN: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

// 五鼠遁(오서둔) — 일간 → 子時 시작 천간
// 甲己日 甲子時 · 乙庚日 丙子時 · 丙辛日 戊子時 · 丁壬日 庚子時 · 戊癸日 壬子時
export const OSEO_DUN: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "甲", 己: "甲",
  乙: "丙", 庚: "丙",
  丙: "戊", 辛: "戊",
  丁: "庚", 壬: "庚",
  戊: "壬", 癸: "壬",
};

// 일간 keyword — 사주 페이지 DayMasterCard에서 사용
export const DAY_MASTER_KEYWORDS: Record<HeavenlyStem, string> = {
  甲: "Yang Wood — a tall tree, upright and resolute",
  乙: "Yin Wood — flexible vine, gentle but persistent",
  丙: "Yang Fire — the sun, radiant and outgoing",
  丁: "Yin Fire — a candle flame, warm and intimate",
  戊: "Yang Earth — a mountain, grounded and steady",
  己: "Yin Earth — fertile soil, nurturing and adaptable",
  庚: "Yang Metal — raw iron, decisive and tough",
  辛: "Yin Metal — refined jewelry, precise and elegant",
  壬: "Yang Water — the ocean, expansive and free",
  癸: "Yin Water — gentle rain, intuitive and adaptive",
};

// 십신 라벨 (UI 표시용)
export const SIPSIN_LABELS: Record<SipSin, SipSinLabels> = {
  bigyeon:   { hanja: "比肩", ko: "비견", en: "Friend"          },
  geopjae:   { hanja: "劫財", ko: "겁재", en: "Rival"           },
  sikshin:   { hanja: "食神", ko: "식신", en: "Output (gentle)" },
  sanggwan:  { hanja: "傷官", ko: "상관", en: "Output (bold)"   },
  pyeonjae:  { hanja: "偏財", ko: "편재", en: "Indirect Wealth" },
  jeongjae:  { hanja: "正財", ko: "정재", en: "Direct Wealth"   },
  pyeongwan: { hanja: "偏官", ko: "편관", en: "Indirect Officer"},
  jeonggwan: { hanja: "正官", ko: "정관", en: "Direct Officer"  },
  pyeonin:   { hanja: "偏印", ko: "편인", en: "Indirect Mentor" },
  jeongin:   { hanja: "正印", ko: "정인", en: "Direct Mentor"   },
};

// 12 월령 절기 — 입춘부터 순서대로
// idx i = 寅月 + i (i=0: 寅月, i=1: 卯月, ..., i=11: 丑月)
// 입춘 솔라 longitude = 315°, 경칩 = 345°, 청명 = 15°, 입하 = 45°, ...
export const SOLAR_TERMS_12: readonly string[] = [
  "ipchun",     // 立春 (315°) — 寅月
  "gyeongchip", // 驚蟄 (345°) — 卯月
  "cheongmyeong", // 淸明 (15°) — 辰月
  "ipha",       // 立夏 (45°) — 巳月
  "mangjong",   // 芒種 (75°) — 午月
  "soseo",      // 小暑 (105°) — 未月
  "ipchu",      // 立秋 (135°) — 申月
  "baekro",     // 白露 (165°) — 酉月
  "hanro",      // 寒露 (195°) — 戌月
  "ipdong",     // 立冬 (225°) — 亥月
  "daeseol",    // 大雪 (255°) — 子月
  "sohan",      // 小寒 (285°) — 丑月
] as const;
```

- [ ] **Step 2: `src/lib/saju-data.test.ts` 작성**

```ts
import { describe, it, expect } from "vitest";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_INDEX,
  BRANCH_INDEX,
  WUXING_PRODUCE,
  WUXING_CONTROL,
  OHO_DUN,
  OSEO_DUN,
  DAY_MASTER_KEYWORDS,
  SIPSIN_LABELS,
  SOLAR_TERMS_12,
} from "./saju-data";

describe("saju-data — 무결성", () => {
  it("천간 10개, 모두 unique char", () => {
    expect(HEAVENLY_STEMS).toHaveLength(10);
    const chars = HEAVENLY_STEMS.map(s => s.char);
    expect(new Set(chars).size).toBe(10);
  });

  it("지지 12개, 모두 unique char", () => {
    expect(EARTHLY_BRANCHES).toHaveLength(12);
    const chars = EARTHLY_BRANCHES.map(b => b.char);
    expect(new Set(chars).size).toBe(12);
  });

  it("STEM_INDEX 가 올바른 매핑", () => {
    expect(STEM_INDEX["甲"]).toBe(0);
    expect(STEM_INDEX["癸"]).toBe(9);
  });

  it("BRANCH_INDEX 가 올바른 매핑", () => {
    expect(BRANCH_INDEX["子"]).toBe(0);
    expect(BRANCH_INDEX["亥"]).toBe(11);
  });

  it("오행 생 cycle은 5개 element를 한 바퀴 돈다", () => {
    let current: keyof typeof WUXING_PRODUCE = "wood";
    const visited = new Set<string>([current]);
    for (let i = 0; i < 5; i++) {
      current = WUXING_PRODUCE[current];
      visited.add(current);
    }
    expect(visited.size).toBe(5);
    expect(current).toBe("wood");  // 5스텝 뒤 원래로
  });

  it("오행 극 cycle은 5개 element를 한 바퀴 돈다", () => {
    let current: keyof typeof WUXING_CONTROL = "wood";
    const visited = new Set<string>([current]);
    for (let i = 0; i < 5; i++) {
      current = WUXING_CONTROL[current];
      visited.add(current);
    }
    expect(visited.size).toBe(5);
    expect(current).toBe("wood");
  });

  it("OHO_DUN 10개 천간 모두 매핑", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(OHO_DUN[s.char]).toBeDefined();
    });
  });

  it("OSEO_DUN 10개 천간 모두 매핑", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(OSEO_DUN[s.char]).toBeDefined();
    });
  });

  it("DAY_MASTER_KEYWORDS 10개 천간 모두 매핑, 빈 문자열 없음", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(DAY_MASTER_KEYWORDS[s.char]).toBeTruthy();
    });
  });

  it("SIPSIN_LABELS 10개 십신, 한자/ko/en 모두 채워짐", () => {
    const expected = ["bigyeon","geopjae","sikshin","sanggwan","pyeonjae","jeongjae","pyeongwan","jeonggwan","pyeonin","jeongin"];
    expected.forEach(k => {
      const l = SIPSIN_LABELS[k as keyof typeof SIPSIN_LABELS];
      expect(l).toBeDefined();
      expect(l.hanja).toBeTruthy();
      expect(l.ko).toBeTruthy();
      expect(l.en).toBeTruthy();
    });
  });

  it("SOLAR_TERMS_12 = 12개 (월령 절기)", () => {
    expect(SOLAR_TERMS_12).toHaveLength(12);
    expect(new Set(SOLAR_TERMS_12).size).toBe(12);  // unique
  });
});
```

- [ ] **Step 3: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: 새 11개 테스트 통과, 기존 22개 통과, 총 33개 통과.

- [ ] **Step 4: Commit**

```bash
git add src/lib/saju-data.ts src/lib/saju-data.test.ts
git commit -m "feat(saju): add domain constants (stems, branches, sipSin, wuxing cycles)

Includes OHO_DUN (year stem → 寅月 start) and OSEO_DUN (day stem → 子時 start)
lookup tables for month and hour pillar stem derivation.
Data integrity tests cover all 10 stems, 12 branches, 10 sipSin labels."
```

---

### Task 4: 절기 boundary 데이터 생성 스크립트 + JSON

**Files:**
- Create: `scripts/generate-saju-boundaries.ts`
- Create: `src/lib/saju-boundaries.json`
- Modify: `package.json` (devDependency + script)

- [ ] **Step 1: `astronomia` devDependency 설치**

Run: `npm i -D astronomia tsx`
Expected: 설치 성공. `tsx`는 TypeScript 스크립트를 직접 실행하기 위함.

- [ ] **Step 2: `package.json`에 스크립트 등록**

`"scripts"` 블록에 추가:
```json
    "gen:saju-boundaries": "tsx scripts/generate-saju-boundaries.ts"
```

- [ ] **Step 3: `scripts/generate-saju-boundaries.ts` 작성**

```ts
/**
 * 1900-2050 각 연도의 12 월령 절기(立春, 驚蟄, 淸明, 立夏, 芒種, 小暑,
 * 立秋, 白露, 寒露, 立冬, 大雪, 小寒) UTC 시각을 분 단위로 계산해
 * src/lib/saju-boundaries.json 으로 저장.
 *
 * 알고리즘: astronomia의 태양 황경 함수로 binary search.
 * 입력 longitude 값 (degrees, 0..360):
 *   ipchun=315, gyeongchip=345, cheongmyeong=15, ipha=45,
 *   mangjong=75, soseo=105, ipchu=135, baekro=165,
 *   hanro=195, ipdong=225, daeseol=255, sohan=285
 *
 * Validation: KASI 만세력 8 ground truth 케이스와 분 단위 일치 확인.
 *   (스크립트 끝에서 8개 케이스 실행 후 diff 출력)
 *
 * Usage: `npm run gen:saju-boundaries`
 * Output: src/lib/saju-boundaries.json
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { solar, julian } from "astronomia";

const SOLAR_TERMS_12 = [
  { key: "ipchun",       lon: 315 },
  { key: "gyeongchip",   lon: 345 },
  { key: "cheongmyeong", lon:  15 },
  { key: "ipha",         lon:  45 },
  { key: "mangjong",     lon:  75 },
  { key: "soseo",        lon: 105 },
  { key: "ipchu",        lon: 135 },
  { key: "baekro",       lon: 165 },
  { key: "hanro",        lon: 195 },
  { key: "ipdong",       lon: 225 },
  { key: "daeseol",      lon: 255 },
  { key: "sohan",        lon: 285 },
] as const;

// JDE → ISO 8601 UTC string (분 정밀)
function jdeToUtc(jde: number): string {
  const d = julian.JDEToDate(jde);
  return d.toISOString().replace(/\.\d+Z$/, "Z");
}

// 어떤 JDE에서 태양의 apparent ecliptic longitude (degrees)
function solarLon(jde: number): number {
  const lon = solar.apparentLongitude(julian.JDEToJulianCenturies(jde)) * (180 / Math.PI);
  return ((lon % 360) + 360) % 360;
}

// 0..360 degrees 평균 (cross-zero 안전)
function lonDiff(a: number, target: number): number {
  let d = a - target;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// 절기 정확한 JDE를 binary search로 찾기
function findTermJDE(year: number, targetLon: number): number {
  // 절기는 ~15.218일 간격. target longitude의 추정 시각부터 시작.
  // target_lon=315 (ipchun) → 약 Feb 4
  // target_lon=15  (cheongmyeong) → 약 Apr 5
  // 추정: 봄분(longitude 0°)을 Mar 20쯤 잡고 거기서 +/- 계산
  const approxDayOfYear =
    targetLon < 315 ? 79 + (targetLon / 360) * 365.25 : 35;  // 79=Mar 20, 35=Feb 4
  let baseDate = new Date(Date.UTC(year, 0, 1));
  baseDate = new Date(baseDate.getTime() + approxDayOfYear * 86400000);

  let lo = julian.DateToJDE(new Date(baseDate.getTime() - 10 * 86400000));
  let hi = julian.DateToJDE(new Date(baseDate.getTime() + 25 * 86400000));

  // longitude가 lo에서 target보다 작고 hi에서 target보다 클 때까지 확장
  let lonLo = solarLon(lo);
  let lonHi = solarLon(hi);
  let attempts = 0;
  while ((lonDiff(lonLo, targetLon) > 0 || lonDiff(lonHi, targetLon) < 0) && attempts < 10) {
    lo -= 5;
    hi += 5;
    lonLo = solarLon(lo);
    lonHi = solarLon(hi);
    attempts++;
  }

  // Binary search to 1-minute precision (~1/(24*60) of a day)
  while (hi - lo > 1 / (24 * 60)) {
    const mid = (lo + hi) / 2;
    if (lonDiff(solarLon(mid), targetLon) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function generate(): Record<string, { term: string; utc: string }[]> {
  const out: Record<string, { term: string; utc: string }[]> = {};
  for (let y = 1900; y <= 2050; y++) {
    out[String(y)] = SOLAR_TERMS_12.map(t => {
      const jde = findTermJDE(y, t.lon);
      return { term: t.key, utc: jdeToUtc(jde) };
    });
  }
  return out;
}

// 8 KASI ground truth 케이스 — 분 단위 일치 확인
// (출처: KASI 만세력 또는 한국천문연구원 공개 데이터. 작업 시 정확한 값 cross-check 필요)
const GOLDEN = [
  { year: 1984, term: "ipchun",   expected: "1984-02-04T21:19:00Z" }, // KASI 기준 검증
  { year: 1999, term: "gyeongchip", expected: "1999-03-06T08:58:00Z" },
  { year: 2000, term: "ipchun",   expected: "2000-02-04T20:40:00Z" },
  { year: 2020, term: "ipchun",   expected: "2020-02-04T17:03:00Z" },
  { year: 2024, term: "ipchun",   expected: "2024-02-04T16:27:00Z" },
  { year: 1950, term: "ipchu",    expected: "1950-08-08T03:13:00Z" },
  { year: 1900, term: "sohan",    expected: "1900-01-06T05:34:00Z" },
  { year: 2050, term: "daeseol",  expected: "2050-12-07T13:24:00Z" },
];

function diffMinutes(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(da - db) / 60000;
}

function validate(data: ReturnType<typeof generate>): void {
  console.log("\n=== Validation against KASI golden cases ===");
  for (const g of GOLDEN) {
    const yearData = data[String(g.year)];
    const match = yearData.find(d => d.term === g.term);
    if (!match) {
      console.error(`✗ ${g.year} ${g.term}: not found`);
      continue;
    }
    const diff = diffMinutes(match.utc, g.expected);
    const ok = diff <= 2;  // 2분 이내 허용
    console.log(`${ok ? "✓" : "✗"} ${g.year} ${g.term}: computed=${match.utc} expected=${g.expected} diff=${diff.toFixed(1)}min`);
  }
}

function main(): void {
  console.log("Generating saju boundaries 1900-2050...");
  const data = generate();
  const totalEntries = Object.values(data).flat().length;
  console.log(`Generated ${totalEntries} entries (151 years × 12 terms).`);

  validate(data);

  const outPath = resolve("src/lib/saju-boundaries.json");
  writeFileSync(outPath, JSON.stringify(data, null, 0));
  console.log(`Wrote ${outPath}`);
}

main();
```

> **NOTE (실행 시 검증):** `astronomia`의 정확한 API 시그니처(`solar.apparentLongitude` 인자/반환)는 npm 페이지 또는 `node_modules/astronomia/src/solar.d.ts` 확인 후 코드 조정. 위 스크립트는 의도하는 흐름이며 API 미세 차이는 plan 실행자가 수정한다. validation step에서 diff가 5분 넘으면 알고리즘에 버그가 있다는 신호 — 디버깅 후 재실행.

- [ ] **Step 4: 스크립트 실행 + 검증**

Run: `npm run gen:saju-boundaries`
Expected:
- 출력에 `Generated 1812 entries (151 years × 12 terms).`
- Validation 섹션의 8 KASI 케이스 모두 ✓ (diff ≤ 2분)
- `src/lib/saju-boundaries.json` 파일 생성됨

만약 일부 케이스가 ✗ 표시되면:
- astronomia API 사용법 재확인
- `findTermJDE`의 binary search 범위 또는 정밀도 조정
- 모든 ✓ 될 때까지 반복

- [ ] **Step 5: JSON 파일 사이즈 확인**

Run: `ls -lh src/lib/saju-boundaries.json` (Windows: `dir src\lib\saju-boundaries.json`)
Expected: 50-100KB 정도.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-saju-boundaries.ts src/lib/saju-boundaries.json package.json package-lock.json
git commit -m "feat(saju): add solar term boundaries generator + 1900-2050 data

Uses astronomia (Meeus solar longitude) + binary search to compute 12 monthly
solar terms (입춘, 경칩, ...) per year as UTC ISO 8601 strings.
Validated against 8 KASI golden cases within 2-minute tolerance.
Script is a one-shot build-time generator; runtime is pure JSON lookup."
```

---

### Task 5: 절기 boundary 룩업 함수 + 테스트

**Files:**
- Create: `src/lib/saju-boundaries.ts`
- Create: `src/lib/saju-boundaries.test.ts`

- [ ] **Step 1: 실패 테스트 작성 — `src/lib/saju-boundaries.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { findSolarTermBoundary, getMonthBranchIndex } from "./saju-boundaries";

describe("saju-boundaries — findSolarTermBoundary", () => {
  it("입춘 직전: 새 사주년 시작 안 함 (return previous term)", () => {
    // 1999 입춘은 2-04 ~10:57 UTC. 직전 1초 → 작년 11월령(=丑月) 이후, 즉 sohan 구간.
    const at = new Date("1999-02-04T10:50:00Z");
    const result = findSolarTermBoundary(at);
    // 1999 sohan보다 후, 1999 입춘보다 전 → "sohan", year 1999
    expect(result.termKey).toBe("sohan");
  });

  it("입춘 직후: 입춘 boundary 반환", () => {
    const at = new Date("1999-02-04T11:30:00Z");
    const result = findSolarTermBoundary(at);
    expect(result.termKey).toBe("ipchun");
    expect(result.year).toBe(1999);
  });

  it("입춘 정시각: 입춘 boundary (>= 일관)", () => {
    // 우리 JSON에 정확히 1999 ipchun이 있다면 그 정시각에서 >= 규칙
    // 우선 boundary 데이터를 직접 읽어 그 시각으로 테스트
    // (구현에서 sample year의 ipchun 시각을 가져오는 helper 활용 권장)
  });

  it("연 boundary 가장자리: 2050-12-31 23:59 → 2050 sohan 또는 daeseol 구간", () => {
    const at = new Date("2050-12-31T23:59:00Z");
    const result = findSolarTermBoundary(at);
    expect(["sohan", "daeseol"]).toContain(result.termKey);
  });

  it("범위 밖 (1899) → throws", () => {
    expect(() => findSolarTermBoundary(new Date("1899-06-15T00:00:00Z")))
      .toThrow(/out of supported range/i);
  });

  it("범위 밖 (2051) → throws", () => {
    expect(() => findSolarTermBoundary(new Date("2051-01-01T00:00:00Z")))
      .toThrow(/out of supported range/i);
  });
});

describe("saju-boundaries — getMonthBranchIndex", () => {
  it("입춘 직후 = 寅月 (idx 0)", () => {
    const at = new Date("1999-02-05T00:00:00Z");
    expect(getMonthBranchIndex(at)).toBe(0);
  });

  it("경칩 직후 = 卯月 (idx 1)", () => {
    const at = new Date("1999-03-10T00:00:00Z");
    expect(getMonthBranchIndex(at)).toBe(1);
  });

  it("소한 직후 = 丑月 (idx 11)", () => {
    const at = new Date("1999-01-10T00:00:00Z");
    expect(getMonthBranchIndex(at)).toBe(11);
  });
});
```

Run: `npm test src/lib/saju-boundaries.test.ts`
Expected: FAIL — "Cannot find module './saju-boundaries'".

- [ ] **Step 2: `src/lib/saju-boundaries.ts` 구현**

```ts
import { SOLAR_TERMS_12 } from "./saju-data";
import boundariesData from "./saju-boundaries.json";

type BoundaryEntry = { term: string; utc: string };
type BoundariesData = Record<string, BoundaryEntry[]>;

const DATA = boundariesData as BoundariesData;

const MIN_YEAR = 1900;
const MAX_YEAR = 2050;

export type SolarTermResult = {
  termKey: string;       // "ipchun", "gyeongchip", ...
  termIndex: number;     // 0..11 (입춘=0)
  year: number;          // 절기가 속한 그레고리력 연도
  boundaryUtc: string;   // 그 절기의 UTC ISO 8601
};

/**
 * 주어진 UTC 시각이 어느 절기 구간에 속하는지 반환.
 * 규칙: time >= boundary[i] && time < boundary[i+1] → i번째 절기 구간
 * 결과의 termIndex는 SOLAR_TERMS_12의 인덱스 (입춘=0..소한=11)
 */
export function findSolarTermBoundary(at: Date): SolarTermResult {
  const year = at.getUTCFullYear();
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new Error(`Date ${at.toISOString()} is out of supported range (${MIN_YEAR}-${MAX_YEAR})`);
  }

  // 입춘 (idx 0) 이전: 작년 소한(idx 11) 구간으로
  const yearData = DATA[String(year)];
  const ipchun = yearData.find(e => e.term === "ipchun")!;

  if (at < new Date(ipchun.utc)) {
    // 작년 sohan이 마지막 절기로
    const prevYear = year - 1;
    if (prevYear < MIN_YEAR) {
      // 1900-01-01 ~ 1900 입춘 사이는 데이터 없음 → 추후 1899 sohan 필요할 수도.
      // 1900 sohan(1월 초)부터는 1900 데이터에 있으므로 그것 사용.
      const sohan1900 = yearData.find(e => e.term === "sohan")!;
      if (at >= new Date(sohan1900.utc)) {
        return {
          termKey: "sohan",
          termIndex: 11,
          year: 1900,
          boundaryUtc: sohan1900.utc,
        };
      }
      throw new Error(`Date ${at.toISOString()} is before 1900 ipchun and no prior data available`);
    }
    const prevSohan = DATA[String(prevYear)].find(e => e.term === "sohan")!;
    return {
      termKey: "sohan",
      termIndex: 11,
      year: prevYear,
      boundaryUtc: prevSohan.utc,
    };
  }

  // 현재 연도의 절기 12개 중 at >= boundary 인 가장 큰 인덱스
  let latest: BoundaryEntry = ipchun;
  let latestIdx = 0;
  for (let i = 0; i < yearData.length; i++) {
    const entry = yearData[i];
    if (at >= new Date(entry.utc)) {
      latest = entry;
      latestIdx = i;
    }
  }
  return {
    termKey: latest.term,
    termIndex: latestIdx,
    year,
    boundaryUtc: latest.utc,
  };
}

/**
 * 월주의 지지 인덱스 (0=子, ..., 11=亥).
 * 입춘~경칩 = 寅月 (지지 idx 2) 부터 시작 → 12 절기 구간에 대응.
 * SOLAR_TERMS_12의 인덱스 i → 지지 idx = (i + 2) mod 12
 *   i=0 ipchun → 2 (寅)
 *   i=1 gyeongchip → 3 (卯)
 *   ...
 *   i=11 sohan → 1 (丑)
 */
export function getMonthBranchIndex(at: Date): number {
  const term = findSolarTermBoundary(at);
  return (term.termIndex + 2) % 12;
}
```

`tsconfig.json`에 `"resolveJsonModule": true`가 이미 있는지 확인. 없으면 추가.

- [ ] **Step 3: 테스트 실행 → 통과 확인**

Run: `npm test src/lib/saju-boundaries.test.ts`
Expected: 모든 boundary 테스트 통과.

만약 실패하면 boundary 데이터의 정확한 시각 또는 ">=" 비교 로직 디버깅.

- [ ] **Step 4: 전체 테스트 회귀 확인**

Run: `npm test`
Expected: 기존 22 + saju-data 11 + saju-boundaries ~8 = 약 41개 통과.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju-boundaries.ts src/lib/saju-boundaries.test.ts tsconfig.json
git commit -m "feat(saju): add solar term boundary lookup with TDD

findSolarTermBoundary handles the >= boundary rule consistently.
getMonthBranchIndex maps 12 solar terms to 12 earthly branches starting
from 寅月 (after 立春). Out-of-range dates (pre-1900, post-2050) throw."
```

---

## Phase 2 — Domain Calculator (Tasks 6-10)

### Task 6: 십신 계산 helper + 10×10 매트릭스 test

**Files:**
- Create: 새 함수를 `src/lib/saju-calculator.ts`에 추가 (파일 신규)
- Create: `src/lib/saju-calculator.test.ts` (신규)

- [ ] **Step 1: 실패 테스트 작성 — `src/lib/saju-calculator.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { computeSipSin } from "./saju-calculator";
import { HEAVENLY_STEMS } from "./saju-data";

describe("computeSipSin — 매트릭스 enumerate", () => {
  // 일간 D × 비교 S 의 십신 매트릭스 - 룰 기반 표
  // 같은 D에 대해 10 S가 정확히 10 십신을 골고루 (혹은 비견/겁재만 같은 element 한 쌍씩) 생성해야 함

  it("일간 자기 자신 비교 → bigyeon (same element, same yy)", () => {
    expect(computeSipSin("甲", "甲")).toBe("bigyeon");
    expect(computeSipSin("乙", "乙")).toBe("bigyeon");
  });

  it("일간 같은 오행, 다른 yy → geopjae", () => {
    expect(computeSipSin("甲", "乙")).toBe("geopjae");  // 둘 다 wood, 甲yang 乙yin
    expect(computeSipSin("丙", "丁")).toBe("geopjae");
  });

  it("일간 → 생(I produce), 같은 yy → sikshin", () => {
    expect(computeSipSin("甲", "丙")).toBe("sikshin");  // wood→fire, both yang
    expect(computeSipSin("乙", "丁")).toBe("sikshin");
  });

  it("일간 → 생, 다른 yy → sanggwan", () => {
    expect(computeSipSin("甲", "丁")).toBe("sanggwan");  // wood→fire, yang/yin
  });

  it("일간 → 극(I control), 같은 yy → pyeonjae", () => {
    expect(computeSipSin("甲", "戊")).toBe("pyeonjae");  // wood→earth, both yang
  });

  it("일간 → 극, 다른 yy → jeongjae", () => {
    expect(computeSipSin("甲", "己")).toBe("jeongjae");  // wood→earth, yang/yin
  });

  it("일간 ← 극(controls me), 같은 yy → pyeongwan", () => {
    expect(computeSipSin("甲", "庚")).toBe("pyeongwan");  // metal→wood, both yang
  });

  it("일간 ← 극, 다른 yy → jeonggwan", () => {
    expect(computeSipSin("甲", "辛")).toBe("jeonggwan");  // metal→wood, yang/yin
  });

  it("일간 ← 생(produces me), 같은 yy → pyeonin", () => {
    expect(computeSipSin("甲", "壬")).toBe("pyeonin");  // water→wood, both yang
  });

  it("일간 ← 생, 다른 yy → jeongin", () => {
    expect(computeSipSin("甲", "癸")).toBe("jeongin");  // water→wood, yang/yin
  });

  it("10×10 매트릭스: 모든 (D, S) 조합에서 정확히 1개 십신 반환 (no undefined)", () => {
    HEAVENLY_STEMS.forEach(D => {
      HEAVENLY_STEMS.forEach(S => {
        const result = computeSipSin(D.char, S.char);
        expect(result).toBeDefined();
        expect([
          "bigyeon","geopjae","sikshin","sanggwan",
          "pyeonjae","jeongjae","pyeongwan","jeonggwan",
          "pyeonin","jeongin",
        ]).toContain(result);
      });
    });
  });

  it("10×10 매트릭스 분포: 각 일간에 대해 10 S → 10가지 십신 모두 등장", () => {
    HEAVENLY_STEMS.forEach(D => {
      const sipSins = HEAVENLY_STEMS.map(S => computeSipSin(D.char, S.char));
      expect(new Set(sipSins).size).toBe(10);  // 10가지 모두
    });
  });
});
```

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: FAIL — "Cannot find module './saju-calculator'".

- [ ] **Step 2: `src/lib/saju-calculator.ts` 작성 (computeSipSin만)**

```ts
import type { HeavenlyStem, SipSin } from "./saju-types";
import { HEAVENLY_STEMS, STEM_INDEX, WUXING_PRODUCE, WUXING_CONTROL } from "./saju-data";

/**
 * 일간 dayStem 기준으로 other 천간의 십신을 결정.
 * 규칙:
 *   같은 오행, 같은 yy           → bigyeon (比肩)
 *   같은 오행, 다른 yy           → geopjae (劫財)
 *   day → produces → other, same yy  → sikshin (食神)
 *   day → produces → other, diff yy  → sanggwan (傷官)
 *   day → controls → other, same yy  → pyeonjae (偏財)
 *   day → controls → other, diff yy  → jeongjae (正財)
 *   other → controls → day, same yy  → pyeongwan (偏官)
 *   other → controls → day, diff yy  → jeonggwan (正官)
 *   other → produces → day, same yy  → pyeonin  (偏印)
 *   other → produces → day, diff yy  → jeongin  (正印)
 */
export function computeSipSin(dayStem: HeavenlyStem, other: HeavenlyStem): SipSin {
  const D = HEAVENLY_STEMS[STEM_INDEX[dayStem]];
  const S = HEAVENLY_STEMS[STEM_INDEX[other]];
  const sameYY = D.yinYang === S.yinYang;

  if (D.element === S.element) {
    return sameYY ? "bigyeon" : "geopjae";
  }
  if (WUXING_PRODUCE[D.element] === S.element) {
    return sameYY ? "sikshin" : "sanggwan";
  }
  if (WUXING_CONTROL[D.element] === S.element) {
    return sameYY ? "pyeonjae" : "jeongjae";
  }
  if (WUXING_CONTROL[S.element] === D.element) {
    return sameYY ? "pyeongwan" : "jeonggwan";
  }
  // 마지막 경우: WUXING_PRODUCE[S.element] === D.element
  return sameYY ? "pyeonin" : "jeongin";
}
```

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: 11개 십신 테스트 모두 통과.

- [ ] **Step 4: Commit**

```bash
git add src/lib/saju-calculator.ts src/lib/saju-calculator.test.ts
git commit -m "feat(saju): add computeSipSin with 10x10 matrix coverage

Implements the 10 god (十神) relationship rules based on wuxing
production/control cycles + yin/yang parity. Test enumerates the full
10x10 stem matrix and asserts each day stem produces all 10 sipSin."
```

---

### Task 7: 년주 + 월주 계산 함수 + 테스트

**Files:**
- Modify: `src/lib/saju-calculator.ts` (함수 추가)
- Modify: `src/lib/saju-calculator.test.ts`

- [ ] **Step 1: 실패 테스트 추가 — `src/lib/saju-calculator.test.ts` 끝에 append**

```ts
import { computeYearPillar, computeMonthPillar } from "./saju-calculator";

describe("computeYearPillar", () => {
  it("1984-02-04 입춘 정시각 직후 → 甲子년", () => {
    // 1984 입춘은 KASI 기준 2/4 21:19 UTC ≈ 2/5 06:19 KST
    const at = new Date("1984-02-04T22:00:00Z");
    const p = computeYearPillar(at);
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("子");
  });

  it("1984-02-04 입춘 정시각 직전 → 작년(1983) 년주 (癸亥)", () => {
    const at = new Date("1984-02-04T10:00:00Z");
    const p = computeYearPillar(at);
    expect(p.stem.char).toBe("癸");
    expect(p.branch.char).toBe("亥");
  });

  it("2024-02-04 입춘 직후 → 甲辰년", () => {
    const at = new Date("2024-02-04T18:00:00Z");
    const p = computeYearPillar(at);
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("辰");
  });

  it("position = 'year'", () => {
    const at = new Date("2000-06-01T00:00:00Z");
    expect(computeYearPillar(at).position).toBe("year");
  });
});

describe("computeMonthPillar", () => {
  it("1984-02-05 (甲子년, 입춘 직후) → 丙寅 월주 (oho_dun: 甲→丙)", () => {
    const at = new Date("1984-02-05T00:00:00Z");
    const yearStem: HeavenlyStem = "甲";
    const p = computeMonthPillar(at, yearStem);
    expect(p.stem.char).toBe("丙");
    expect(p.branch.char).toBe("寅");
  });

  it("1984-03-06 직전 (경칩 전) → 여전히 丙寅 월", () => {
    const at = new Date("1984-03-05T00:00:00Z");
    const p = computeMonthPillar(at, "甲");
    expect(p.branch.char).toBe("寅");
  });

  it("1984-03-06 경칩 직후 → 丁卯 월주", () => {
    const at = new Date("1984-03-06T10:00:00Z");
    const p = computeMonthPillar(at, "甲");
    expect(p.branch.char).toBe("卯");
    expect(p.stem.char).toBe("丁");  // 寅:丙, 卯:丁
  });

  it("乙년의 寅月 시작 천간 = 戊 (oho_dun: 乙→戊)", () => {
    const at = new Date("1985-02-05T00:00:00Z");
    const p = computeMonthPillar(at, "乙");
    expect(p.stem.char).toBe("戊");
    expect(p.branch.char).toBe("寅");
  });
});
```

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: FAIL — "computeYearPillar/computeMonthPillar is not a function".

- [ ] **Step 2: `src/lib/saju-calculator.ts` — 년주/월주 추가**

기존 파일에 import 추가:
```ts
import type { SajuPillar, HeavenlyStem, EarthlyBranch } from "./saju-types";
import { EARTHLY_BRANCHES, OHO_DUN, BRANCH_INDEX } from "./saju-data";
import { findSolarTermBoundary, getMonthBranchIndex } from "./saju-boundaries";
```

`computeSipSin` 아래 추가:
```ts
/**
 * SajuPillar 빌더 — sipSin 매핑은 호출자가 별도 적용 (일간 컨텍스트 필요).
 * 여기서는 stem.sipSin/branch.sipSin을 임시로 "bigyeon"으로 채우고,
 * 호출자가 computeSipSin으로 덮어쓴다.
 */
function buildPillar(
  position: SajuPillar["position"],
  stemIdx: number,
  branchIdx: number
): SajuPillar {
  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[branchIdx];
  return {
    position,
    stem: { ...stem, sipSin: null },           // 일간이면 null 유지
    branch: { ...branch, sipSin: "bigyeon" },  // placeholder, 호출자 덮어쓰기
  };
}

/**
 * 년주: 입춘 이전이면 전년도 기준.
 * 앵커: 1984 = 甲子년 ((1984 - 4) % 10 = 0, % 12 = 0)
 */
export function computeYearPillar(at: Date): SajuPillar {
  const term = findSolarTermBoundary(at);
  // term.year는 입춘 이전이면 이미 전년도로 조정됨 (saju-boundaries.ts에서 처리)
  const yearUsed = term.year;
  const stemIdx = ((yearUsed - 4) % 10 + 10) % 10;
  const branchIdx = ((yearUsed - 4) % 12 + 12) % 12;
  return buildPillar("year", stemIdx, branchIdx);
}

/**
 * 월주: 절기 boundary로 지지 결정, oho_dun으로 천간 결정.
 */
export function computeMonthPillar(at: Date, yearStem: HeavenlyStem): SajuPillar {
  const branchIdx = getMonthBranchIndex(at);   // 0=子, ..., 2=寅, ...

  // 寅月 시작 천간 (oho_dun)
  const startStem = OHO_DUN[yearStem];
  const startStemIdx = STEM_INDEX[startStem];

  // 寅月(branchIdx=2)이 startStemIdx부터 시작 → branch offset from 寅
  // 寅 = 2, 卯 = 3, ..., 丑 = 1
  // offsetFromYin = (branchIdx - 2 + 12) % 12
  const offsetFromYin = (branchIdx - 2 + 12) % 12;
  const stemIdx = (startStemIdx + offsetFromYin) % 10;

  return buildPillar("month", stemIdx, branchIdx);
}
```

> **WAIT** — `computeYearPillar`에서 `term.year` 가 입춘 전이면 prevYear로 되어있다고 가정함. `findSolarTermBoundary` (Task 5)는 이미 입춘 전이면 prevYear의 sohan을 리턴. 그러므로 `term.year` 가 곧 사주년도. OK.

> 또한 `STEM_INDEX`는 이미 saju-data에서 export됨. 이미 import에 추가했는지 확인.

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: 모든 년주/월주 테스트 통과. 만약 1984 입춘 boundary 케이스가 빗나가면 boundaries.json의 정확한 1984 입춘 시각을 확인하여 테스트 시각 조정.

- [ ] **Step 4: 회귀 + lint**

Run: `npm test && npm run lint`
Expected: 모든 테스트 통과, lint 기존 form.tsx warning만.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju-calculator.ts src/lib/saju-calculator.test.ts
git commit -m "feat(saju): add year and month pillar calculation (TDD)

- computeYearPillar uses 입춘 boundary check + (year-4) mod 10/12
- computeMonthPillar uses solar term lookup + 五虎遁(OHO_DUN) for stem
- Verified with 1984 (甲子년 anchor) and 2024 (甲辰년) golden cases"
```

---

### Task 8: 일주 계산 함수 (자시 boundary 포함) + 테스트

**Files:**
- Modify: `src/lib/saju-calculator.ts`
- Modify: `src/lib/saju-calculator.test.ts`

> **앵커 확인:** 1900-01-01 KST 00:00 = 甲戌 일주 (KASI 기준). 이 앵커의 정확성을 KASI 만세력 또는 trusted reference로 cross-check. 빗나가면 다른 well-known anchor (예: 1984-02-04 입춘 = 갑자년 시작과 함께 알려진 일주)로 보정.

- [ ] **Step 1: 실패 테스트 추가**

`src/lib/saju-calculator.test.ts` 끝에 append:

```ts
import { computeDayPillar } from "./saju-calculator";

describe("computeDayPillar — KST anchor + 자시 boundary", () => {
  // 앵커: 1900-01-01 KST 00:00 = 甲戌
  it("1900-01-01 00:00 KST → 甲戌 일주 (anchor)", () => {
    // KST 00:00 = UTC 15:00 of 1899-12-31
    const at = new Date("1899-12-31T15:00:00Z");
    const p = computeDayPillar(at);
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("戌");
  });

  it("1900-01-02 00:00 KST → 乙亥 일주 (다음 일)", () => {
    const at = new Date("1900-01-01T15:00:00Z");
    const p = computeDayPillar(at);
    expect(p.stem.char).toBe("乙");
    expect(p.branch.char).toBe("亥");
  });

  it("자시 22:59 KST → 같은 날 일주", () => {
    // 1900-01-01 22:59 KST = UTC 13:59
    const at = new Date("1900-01-01T13:59:00Z");
    const p = computeDayPillar(at);
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("戌");
  });

  it("자시 23:00 KST → 다음날 일주 (정자시 규칙)", () => {
    // 1900-01-01 23:00 KST = UTC 14:00
    const at = new Date("1900-01-01T14:00:00Z");
    const p = computeDayPillar(at);
    expect(p.stem.char).toBe("乙");
    expect(p.branch.char).toBe("亥");
  });

  it("자시 23:59 KST → 다음날 일주", () => {
    const at = new Date("1900-01-01T14:59:00Z");
    const p = computeDayPillar(at);
    expect(p.stem.char).toBe("乙");
    expect(p.branch.char).toBe("亥");
  });

  it("60일 후 → 같은 일주 (60갑자 cycle)", () => {
    // 1900-01-01 → 1900-03-02 (60일)
    const start = new Date("1899-12-31T15:00:00Z");
    const sixtyDaysLater = new Date(start.getTime() + 60 * 86400000);
    const p = computeDayPillar(sixtyDaysLater);
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("戌");
  });

  it("position = 'day'", () => {
    const at = new Date("2000-06-01T03:00:00Z");
    expect(computeDayPillar(at).position).toBe("day");
  });
});
```

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: FAIL — "computeDayPillar is not a function".

- [ ] **Step 2: `computeDayPillar` 구현 — `src/lib/saju-calculator.ts`에 추가**

```ts
// KST 앵커: 1900-01-01 KST 00:00 = 甲戌일
// 甲 = stem idx 0, 戌 = branch idx 10
// 60갑자 인덱스: stem*0 + 0 = 60갑자 sequence position
// 갑자(子) = 0, 을축 = 1, ..., 갑술 = 10, 갑자 시작 60갑자 인덱스 = 10
const ANCHOR_UTC_MS = Date.parse("1899-12-31T15:00:00Z"); // 1900-01-01 KST midnight
const ANCHOR_STEM_IDX = 0;    // 甲
const ANCHOR_BRANCH_IDX = 10; // 戌
const ANCHOR_SEXAGENARY = 10; // 60갑자에서 甲戌의 인덱스

/**
 * KST 일자에서 0시 자정 시작 일주를 계산.
 * 자시 보정: KST 23:00 이상이면 다음날 일주로 (정자시 규칙).
 */
export function computeDayPillar(at: Date): SajuPillar {
  // KST = UTC + 9h
  const kstMs = at.getTime() + 9 * 3600 * 1000;
  const kstDate = new Date(kstMs);  // 이 UTC 시각이 KST 시각인 것처럼 다룸

  // KST 시각의 hour
  const kstHour = kstDate.getUTCHours();

  // KST 자정 기준 일자 (00:00 KST 시점)
  const kstMidnightMs = Math.floor(kstMs / 86400000) * 86400000;

  // 자시 보정: KST 23:00 이상 → +1일
  let effectiveMidnightMs = kstMidnightMs;
  if (kstHour >= 23) {
    effectiveMidnightMs += 86400000;
  }

  // 앵커로부터 며칠 차이
  // 앵커: 1900-01-01 KST 00:00 (= UTC 1899-12-31 15:00, ms = ANCHOR_UTC_MS)
  // KST 자정 ms (UTC 기준)에서 9h 빼면 anchor와 동일 base
  const anchorKstMs = ANCHOR_UTC_MS + 9 * 3600 * 1000;
  const dayDiff = Math.round((effectiveMidnightMs - anchorKstMs) / 86400000);

  // 60갑자 sequence: anchor가 sexagenary idx 10 (甲戌)
  const sex = ((ANCHOR_SEXAGENARY + dayDiff) % 60 + 60) % 60;

  const stemIdx = sex % 10;
  const branchIdx = sex % 12;

  return buildPillar("day", stemIdx, branchIdx);
}
```

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: 모든 일주 테스트 통과.

만약 1900-01-01 KST = 甲戌 가정이 빗나가면 (다른 reference에서 다른 값을 보고하면), `ANCHOR_*` 상수를 정확한 값으로 보정 후 재실행.

- [ ] **Step 4: Commit**

```bash
git add src/lib/saju-calculator.ts src/lib/saju-calculator.test.ts
git commit -m "feat(saju): add day pillar calculation with 자시 23:00 boundary

KST anchor: 1900-01-01 KST 00:00 = 甲戌 (sexagenary idx 10).
자시 rule: KST 23:00+ advances to next day's pillar (정자시 standard).
TDD covers anchor, day+1, 60-day cycle return, and 23:00 boundary."
```

---

### Task 9: 시주 계산 함수 + 테스트

**Files:**
- Modify: `src/lib/saju-calculator.ts`
- Modify: `src/lib/saju-calculator.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`src/lib/saju-calculator.test.ts` 끝:

```ts
import { computeHourPillar } from "./saju-calculator";

describe("computeHourPillar — 五鼠遁 + 12지지 시간", () => {
  // OSEO_DUN: 甲日 → 子時 시작 천간 = 甲
  // 子時 = 23:00 ~ 01:00 KST (자시는 다음날 일주에 속함)

  it("甲일 子時(00:00 KST) → 甲子 시주", () => {
    const at = new Date("1900-01-01T15:00:00Z");  // 1900-01-02 00:00 KST = 乙亥일 ... 위 잘못. 다시.
    // 1900-01-01 KST 00:00 = 甲戌일. KST 00:00 = 子時 (자시 23-01중 00 portion).
    // 甲戌일 子時 stem = OSEO_DUN[甲] = 甲. branch = 子. → 甲子 시주.
    const p = computeHourPillar(at, "甲");  // 명시적으로 dayStem 전달
    expect(p.stem.char).toBe("甲");
    expect(p.branch.char).toBe("子");
  });

  it("甲일 寅時(03:00 KST) → 丙寅 시주", () => {
    // 寅時 = 03:00~05:00 KST. 子時 시작=甲, 丑時=乙, 寅時=丙
    const at = new Date("1899-12-31T18:00:00Z");  // 1900-01-01 03:00 KST
    const p = computeHourPillar(at, "甲");
    expect(p.stem.char).toBe("丙");
    expect(p.branch.char).toBe("寅");
  });

  it("乙일 子時(00:00 KST) → 丙子 시주 (OSEO: 乙→丙)", () => {
    const at = new Date("1900-01-01T15:00:00Z");  // 1900-01-02 00:00 KST
    const p = computeHourPillar(at, "乙");
    expect(p.stem.char).toBe("丙");
    expect(p.branch.char).toBe("子");
  });

  it("position = 'hour'", () => {
    const at = new Date("2000-06-01T03:00:00Z");
    expect(computeHourPillar(at, "甲").position).toBe("hour");
  });
});
```

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: FAIL.

- [ ] **Step 2: `computeHourPillar` 구현**

`src/lib/saju-calculator.ts`에 import 추가:
```ts
import { OSEO_DUN } from "./saju-data";
```

함수 추가:
```ts
/**
 * 시주: 12지지 시간(branch) + OSEO_DUN(일간 → 子時 시작 천간) + branch offset.
 *
 * 12지지 시간 매핑 (KST hour):
 *   23-00 → 子(0)
 *   01-02 → 丑(1)
 *   03-04 → 寅(2)
 *   ...
 *   21-22 → 亥(11)
 *
 * 인덱스 계산: branchIdx = floor(((kstHour + 1) % 24) / 2)
 * (이미 kst-converter.ts의 getJiziHour에 동일 로직 있음 — 여기서는 재구현)
 */
export function computeHourPillar(at: Date, dayStem: HeavenlyStem): SajuPillar {
  const kstMs = at.getTime() + 9 * 3600 * 1000;
  const kstDate = new Date(kstMs);
  const kstHour = kstDate.getUTCHours();

  const branchIdx = Math.floor(((kstHour + 1) % 24) / 2);  // 0=子, 1=丑, ...

  // OSEO_DUN: 일간 → 子時 시작 천간
  const startStem = OSEO_DUN[dayStem];
  const startStemIdx = STEM_INDEX[startStem];

  // 시 천간 = 子時 시작 + branch offset (子=0이므로 그대로)
  const stemIdx = (startStemIdx + branchIdx) % 10;

  return buildPillar("hour", stemIdx, branchIdx);
}
```

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: 모든 시주 테스트 통과.

- [ ] **Step 4: Commit**

```bash
git add src/lib/saju-calculator.ts src/lib/saju-calculator.test.ts
git commit -m "feat(saju): add hour pillar with 五鼠遁 (OSEO_DUN) lookup

Branch: 12지지 hours derived from KST hour with 子時 anchored at 23:00.
Stem: OSEO_DUN[dayStem] + branch offset from 子."
```

---

### Task 10: computeSaju 통합 + 골든 케이스

**Files:**
- Modify: `src/lib/saju-calculator.ts`
- Modify: `src/lib/saju-calculator.test.ts`

- [ ] **Step 1: 실패 테스트 추가 (통합)**

```ts
import { computeSaju } from "./saju-calculator";
import type { BirthData } from "./kst-types";

describe("computeSaju — 통합 골든 케이스", () => {
  it("1984-02-05 12:00 KST → 甲子년·丙寅월·甲申일·庚午시 (예시 골든)", () => {
    // 1984-02-04 22:00 입춘 직후. 1984-02-05 KST 12:00 = UTC 03:00
    // 정확한 일주 + 시주는 KASI 만세력 cross-check 후 expected 값 보정.
    const birth: BirthData = {
      year: 1984, month: 2, day: 5,
      hour: 12, minute: 0,
      timezone: "Asia/Seoul",
    };
    const r = computeSaju(birth);
    expect(r.pillars.year.stem.char).toBe("甲");
    expect(r.pillars.year.branch.char).toBe("子");
    expect(r.pillars.month.stem.char).toBe("丙");
    expect(r.pillars.month.branch.char).toBe("寅");
    // 일주/시주는 KASI에서 cross-check 후 실제 값으로 expect 수정
    expect(r.pillars.day.position).toBe("day");
    expect(r.pillars.hour?.position).toBe("hour");
  });

  it("시각 unknown → hour pillar null, timeKnown false", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    };
    const r = computeSaju(birth);
    expect(r.pillars.hour).toBeNull();
    expect(r.source.timeKnown).toBe(false);
  });

  it("일간이 dayMaster에 정확히 매핑 + keyword 비어있지 않음", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      hour: 14, minute: 30,
      timezone: "America/New_York",
    };
    const r = computeSaju(birth);
    expect(r.dayMaster.stem).toBe(r.pillars.day.stem.char);
    expect(r.dayMaster.keyword.length).toBeGreaterThan(10);
  });

  it("wuXingBalance 카운트가 자연수, 합이 6 또는 8", () => {
    const birthWithHour: BirthData = {
      year: 1999, month: 3, day: 15,
      hour: 14, minute: 30,
      timezone: "America/New_York",
    };
    const r1 = computeSaju(birthWithHour);
    const sum1 = Object.values(r1.wuXingBalance).reduce((a, b) => a + b, 0);
    expect(sum1).toBe(8);

    const birthNoHour: BirthData = {
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    };
    const r2 = computeSaju(birthNoHour);
    const sum2 = Object.values(r2.wuXingBalance).reduce((a, b) => a + b, 0);
    expect(sum2).toBe(6);
  });

  it("일주 stem의 sipSin은 null (자기 자신)", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      hour: 14, minute: 30,
      timezone: "America/New_York",
    };
    const r = computeSaju(birth);
    expect(r.pillars.day.stem.sipSin).toBeNull();
  });

  it("다른 기둥의 stem.sipSin은 null이 아님", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      hour: 14, minute: 30,
      timezone: "America/New_York",
    };
    const r = computeSaju(birth);
    expect(r.pillars.year.stem.sipSin).not.toBeNull();
    expect(r.pillars.month.stem.sipSin).not.toBeNull();
    expect(r.pillars.hour?.stem.sipSin).not.toBeNull();
  });
});
```

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: FAIL — "computeSaju is not a function".

- [ ] **Step 2: `computeSaju` 통합 함수 구현**

`src/lib/saju-calculator.ts`에 import 추가:
```ts
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { convertToKST } from "./kst-converter";
import { DAY_MASTER_KEYWORDS } from "./saju-data";
import type { SajuResult, DayMaster, WuXing } from "./saju-types";
```

함수 추가:
```ts
const pad2 = (n: number) => n.toString().padStart(2, "0");

/**
 * BirthData를 UTC Date로 변환 (date-fns-tz 사용).
 * 시각 unknown이면 12:00 noon 기준 (날짜 boundary 안전).
 */
function birthToUtc(birth: BirthData): Date {
  const minute = birth.hour !== undefined && birth.minute === undefined ? 0 : birth.minute;
  const hasTime = birth.hour !== undefined && minute !== undefined;
  const naiveStr = hasTime
    ? `${birth.year}-${pad2(birth.month)}-${pad2(birth.day)}T${pad2(birth.hour!)}:${pad2(minute!)}:00`
    : `${birth.year}-${pad2(birth.month)}-${pad2(birth.day)}T12:00:00`;
  return fromZonedTime(naiveStr, birth.timezone);
}

/**
 * SajuPillar에 sipSin을 결정해 새 객체 반환 (immutable).
 * dayStem = null이면 자기 자신 (sipSin = null on stem) 처리.
 */
function applySipSin(pillar: SajuPillar, dayStem: HeavenlyStem, isDayPillar: boolean): SajuPillar {
  const stemSipSin = isDayPillar ? null : computeSipSin(dayStem, pillar.stem.char);
  const branchSipSin = computeSipSin(dayStem, pillar.branch.primaryHiddenStem);
  return {
    ...pillar,
    stem: { ...pillar.stem, sipSin: stemSipSin },
    branch: { ...pillar.branch, sipSin: branchSipSin },
  };
}

function buildDayMaster(dayStem: HeavenlyStem): DayMaster {
  const info = HEAVENLY_STEMS[STEM_INDEX[dayStem]];
  return {
    stem: dayStem,
    ko: info.ko,
    element: info.element,
    yinYang: info.yinYang,
    keyword: DAY_MASTER_KEYWORDS[dayStem],
  };
}

function buildWuXingBalance(pillars: {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar | null;
}): Record<WuXing, number> {
  const balance: Record<WuXing, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as SajuPillar[];
  for (const p of all) {
    balance[p.stem.element] += 1;
    balance[p.branch.element] += 1;
  }
  return balance;
}

export function computeSaju(birth: BirthData): SajuResult {
  const utcDate = birthToUtc(birth);
  const kst = convertToKST(birth);
  const timeKnown = kst.kst.hour !== null;

  const rawYear = computeYearPillar(utcDate);
  const rawMonth = computeMonthPillar(utcDate, rawYear.stem.char);
  const rawDay = computeDayPillar(utcDate);
  const rawHour = timeKnown ? computeHourPillar(utcDate, rawDay.stem.char) : null;

  const dayStem = rawDay.stem.char;

  const yearPillar = applySipSin(rawYear, dayStem, false);
  const monthPillar = applySipSin(rawMonth, dayStem, false);
  const dayPillar = applySipSin(rawDay, dayStem, true);
  const hourPillar = rawHour ? applySipSin(rawHour, dayStem, false) : null;

  const pillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };

  const kstLabel = timeKnown
    ? `${kst.kst.dateLabelKo} ${kst.kst.timeLabel} KST`
    : `${kst.kst.dateLabelKo} KST`;

  return {
    source: { birthLocal: birth, kstLabel, timeKnown },
    pillars,
    dayMaster: buildDayMaster(dayStem),
    wuXingBalance: buildWuXingBalance(pillars),
  };
}
```

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-calculator.test.ts`
Expected: 모든 통합 테스트 통과.

만약 1984-02-05 일주가 빗나가면:
- KASI 만세력 또는 검증된 만세력에서 1984-02-05 일주를 확인
- 예상 일주를 테스트에 명시 (현재 "position === 'day'" 같은 약식 검증 사용)
- 또는 ANCHOR 보정

- [ ] **Step 4: 전체 회귀 확인**

Run: `npm test && npm run lint && npm run build`
Expected: 모두 통과.

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju-calculator.ts src/lib/saju-calculator.test.ts
git commit -m "feat(saju): integrate computeSaju end-to-end with golden cases

Composes year/month/day/hour pillar functions, applies sipSin relative
to day stem (null for day stem itself), builds dayMaster from keyword
table, and computes 6- or 8-character wuxing balance distribution."
```

---

## Phase 3 — URL/Route (Tasks 11-12)

### Task 11: saju-url 모듈 + 테스트

**Files:**
- Create: `src/lib/saju-url.ts`
- Create: `src/lib/saju-url.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { parseSajuParams, sajuHref } from "./saju-url";
import type { BirthData } from "./kst-types";

describe("saju-url — sajuHref + parseSajuParams round-trip", () => {
  it("필수 필드만 → round-trip", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    };
    const href = sajuHref(birth);
    expect(href).toMatch(/^\/saju\?/);
    const params = new URLSearchParams(href.split("?")[1]);
    const parsed = parseSajuParams(params);
    expect(parsed).toEqual(birth);
  });

  it("시각 포함 → round-trip", () => {
    const birth: BirthData = {
      year: 1984, month: 2, day: 5,
      hour: 12, minute: 30,
      timezone: "Asia/Seoul",
    };
    const href = sajuHref(birth);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(parseSajuParams(params)).toEqual(birth);
  });

  it("URL encoding: tz의 / 가 %2F로 인코딩", () => {
    const birth: BirthData = {
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    };
    const href = sajuHref(birth);
    expect(href).toContain("America%2FNew_York");
  });
});

describe("saju-url — parseSajuParams validation", () => {
  it("문자열 → 숫자 강제 변환", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15",
      tz: "America/New_York",
    });
    const parsed = parseSajuParams(params);
    expect(parsed).toEqual({
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    });
  });

  it("연도 범위 밖 (1899) → null", () => {
    const params = new URLSearchParams({
      y: "1899", m: "3", d: "15", tz: "Asia/Seoul",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("연도 범위 밖 (2051) → null", () => {
    const params = new URLSearchParams({
      y: "2051", m: "3", d: "15", tz: "Asia/Seoul",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("월별 maxDay 위반 (2-30) → null", () => {
    const params = new URLSearchParams({
      y: "2000", m: "2", d: "30", tz: "Asia/Seoul",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("필수 누락 (y) → null", () => {
    const params = new URLSearchParams({
      m: "3", d: "15", tz: "Asia/Seoul",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("필수 누락 (tz) → null", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("시각 optional: h만 있고 min 없으면 minute undefined", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15", h: "14",
      tz: "Asia/Seoul",
    });
    const parsed = parseSajuParams(params);
    expect(parsed?.hour).toBe(14);
    expect(parsed?.minute).toBeUndefined();
  });

  it("h, min 둘 다 있는 경우", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15", h: "14", min: "30",
      tz: "Asia/Seoul",
    });
    const parsed = parseSajuParams(params);
    expect(parsed?.hour).toBe(14);
    expect(parsed?.minute).toBe(30);
  });

  it("hour 범위 밖 (24) → null", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15", h: "24",
      tz: "Asia/Seoul",
    });
    expect(parseSajuParams(params)).toBeNull();
  });

  it("alphanumeric tz (실제 IANA name) → 통과", () => {
    const params = new URLSearchParams({
      y: "1999", m: "3", d: "15",
      tz: "Europe/Paris",
    });
    expect(parseSajuParams(params)).not.toBeNull();
  });
});
```

Run: `npm test src/lib/saju-url.test.ts`
Expected: FAIL — "Cannot find module './saju-url'".

- [ ] **Step 2: `src/lib/saju-url.ts` 구현**

```ts
import { z } from "zod";
import { birthSchema } from "./kst-types";
import type { BirthData } from "./kst-types";

const sajuParamsSchema = z.object({
  y: z.coerce.number().int().min(1900).max(2050),
  m: z.coerce.number().int().min(1).max(12),
  d: z.coerce.number().int().min(1).max(31),
  h: z.coerce.number().int().min(0).max(23).optional(),
  min: z.coerce.number().int().min(0).max(59).optional(),
  tz: z.string().min(1),
});

/**
 * URLSearchParams → BirthData. 잘못된/누락된 값이면 null.
 * 검증 단계:
 *   1. sajuParamsSchema로 타입/범위
 *   2. birthSchema로 월별 maxDay 검증 (기존 superRefine 재사용)
 */
export function parseSajuParams(searchParams: URLSearchParams): BirthData | null {
  const obj: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    obj[k] = v;
  }
  // h나 min이 없으면 omit (z.coerce가 빈 문자열을 NaN으로 만들지 않도록)
  for (const key of ["h", "min"]) {
    if (obj[key] === "" || obj[key] == null) delete obj[key];
  }

  const parsed = sajuParamsSchema.safeParse(obj);
  if (!parsed.success) return null;

  const birth: BirthData = {
    year: parsed.data.y,
    month: parsed.data.m,
    day: parsed.data.d,
    hour: parsed.data.h,
    minute: parsed.data.min,
    timezone: parsed.data.tz,
  };

  const validated = birthSchema.safeParse(birth);
  return validated.success ? validated.data : null;
}

/**
 * BirthData → /saju?... URL string.
 */
export function sajuHref(birth: BirthData): string {
  const params = new URLSearchParams();
  params.set("y", String(birth.year));
  params.set("m", String(birth.month));
  params.set("d", String(birth.day));
  if (birth.hour !== undefined) params.set("h", String(birth.hour));
  if (birth.minute !== undefined) params.set("min", String(birth.minute));
  params.set("tz", birth.timezone);
  return `/saju?${params.toString()}`;
}
```

- [ ] **Step 3: 테스트 실행 → 통과**

Run: `npm test src/lib/saju-url.test.ts`
Expected: 모든 URL 테스트 통과.

- [ ] **Step 4: Commit**

```bash
git add src/lib/saju-url.ts src/lib/saju-url.test.ts
git commit -m "feat(saju): add URL params encoding/decoding for /saju route

sajuHref serializes BirthData to /saju?y=&m=&d=&h=&min=&tz=...
parseSajuParams runs sajuParamsSchema (z.coerce) then existing birthSchema
superRefine to catch month-specific maxDay (e.g. Feb 30 rejected).
Round-trip + range + missing field tests pass."
```

---

### Task 12: /saju Server Component (skeleton) + not-found

**Files:**
- Create: `src/app/saju/page.tsx`
- Create: `src/app/saju/not-found.tsx`

- [ ] **Step 1: Next.js 문서 읽기 (AGENTS.md 규칙)**

Read:
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/notFound.md` (있다면)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generateMetadata.md` (있다면)

목적:
- App Router의 `page.tsx` `searchParams` 시그니처 확인 (Promise 여부)
- Server Component default 여부 확인
- `notFound()` API
- `generateMetadata` 시그니처

- [ ] **Step 2: `src/app/saju/not-found.tsx` 작성**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="hanji-paper min-h-screen relative overflow-hidden">
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Saju not found
        </h1>
        <p className="font-serif italic text-lg text-foreground/80 mt-4 max-w-md">
          The birth information in your link is missing or invalid. Try entering your birth details again from the home page.
        </p>
        <Link
          href="/"
          className="mt-8 px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity"
        >
          ← Back to home
        </Link>
      </div>
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

- [ ] **Step 3: `src/app/saju/page.tsx` 작성 (skeleton — UI는 Phase 4에서)**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseSajuParams } from "@/lib/saju-url";
import { computeSaju } from "@/lib/saju-calculator";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlParams(obj: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      v.forEach(x => params.append(k, x));
    } else {
      params.set(k, v);
    }
  }
  return params;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const birth = parseSajuParams(toUrlParams(params));
  if (!birth) {
    return {
      title: "Saju not found · KSaju",
    };
  }
  try {
    const saju = computeSaju(birth);
    const yp = saju.pillars.year;
    const dp = saju.pillars.day;
    return {
      title: `${yp.stem.char}${yp.branch.char} · ${dp.stem.char}${dp.branch.char} · Your Saju · KSaju`,
      description: "Your 사주 four pillars and ten gods, computed from your birth time.",
    };
  } catch {
    return { title: "Saju · KSaju" };
  }
}

export default async function SajuPage({ searchParams }: Props) {
  const params = await searchParams;
  const birth = parseSajuParams(toUrlParams(params));
  if (!birth) notFound();

  let saju;
  try {
    saju = computeSaju(birth);
  } catch {
    notFound();
  }

  return (
    <main className="hanji-paper min-h-screen relative overflow-hidden">
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent text-center">
          Your 사주
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Born in source TZ → {saju.source.kstLabel}
        </p>

        {/* 임시 placeholder — Phase 4에서 SajuPillars / DayMasterCard로 교체 */}
        <pre className="mt-8 p-4 bg-card border border-border rounded-md text-xs overflow-x-auto">
          {JSON.stringify(saju, null, 2)}
        </pre>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary hover:underline">
            ← Edit my birth info
          </Link>
        </div>
      </div>
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

> **NOTE:** Next.js 15+ App Router에서 `searchParams`는 `Promise`. 위 시그니처는 그것 가정. Step 1에서 docs 확인하여 다르면 조정.

- [ ] **Step 4: dev 서버에서 페이지 노출 확인**

Run: `npm run dev` (백그라운드)

브라우저:
- `localhost:3000/saju?y=1999&m=3&d=15&h=14&min=30&tz=America/New_York` → JSON dump가 나오면 성공
- `localhost:3000/saju?y=1899` → not-found 페이지 노출
- `localhost:3000/saju` (params 없음) → not-found

확인 후 dev 종료.

- [ ] **Step 5: lint + build**

Run: `npm run lint && npm run build`
Expected: 0 errors, build success.

- [ ] **Step 6: Commit**

```bash
git add src/app/saju/page.tsx src/app/saju/not-found.tsx
git commit -m "feat(saju): add /saju Server Component with metadata + not-found

URL params → parseSajuParams → computeSaju → JSON dump (placeholder UI).
generateMetadata builds title from year and day pillars for share preview.
Invalid/missing params trigger Next.js notFound() → custom not-found.tsx
with hanji-themed back-to-home link."
```

---

## Phase 4 — UI Components (Tasks 13-15)

### Task 13: SajuPillars 컴포넌트 (코어 4열 그리드)

**Files:**
- Create: `src/components/saju/saju-pillars.tsx`

- [ ] **Step 1: `src/components/saju/saju-pillars.tsx` 작성**

```tsx
import Link from "next/link";
import type { SajuPillar, SajuResult, WuXing } from "@/lib/saju-types";
import { SIPSIN_LABELS } from "@/lib/saju-data";

const WUXING_LABEL: Record<WuXing, { ko: string; en: string }> = {
  wood:  { ko: "木", en: "Wood"  },
  fire:  { ko: "火", en: "Fire"  },
  earth: { ko: "土", en: "Earth" },
  metal: { ko: "金", en: "Metal" },
  water: { ko: "水", en: "Water" },
};

const WUXING_BORDER_CLASS: Record<WuXing, string> = {
  wood:  "border-wuxing-mok",
  fire:  "border-wuxing-hwa",
  earth: "border-wuxing-to",
  metal: "border-wuxing-geum",
  water: "border-wuxing-su",
};

const WUXING_BG_CLASS: Record<WuXing, string> = {
  wood:  "bg-wuxing-mok/10",
  fire:  "bg-wuxing-hwa/10",
  earth: "bg-wuxing-to/10",
  metal: "bg-wuxing-geum/10",
  water: "bg-wuxing-su/10",
};

const POSITION_LABEL: Record<SajuPillar["position"], { hanja: string; en: string; ko: string }> = {
  year:  { hanja: "年柱", en: "Year",  ko: "년주" },
  month: { hanja: "月柱", en: "Month", ko: "월주" },
  day:   { hanja: "日柱", en: "Day",   ko: "일주" },
  hour:  { hanja: "時柱", en: "Hour",  ko: "시주" },
};

type PillarCardProps = {
  pillar: SajuPillar;
  isDay: boolean;
};

function PillarCard({ pillar, isDay }: PillarCardProps) {
  const { stem, branch, position } = pillar;
  const label = POSITION_LABEL[position];
  const stemBorder = isDay
    ? "border-[3px] border-foreground"
    : `border-2 ${WUXING_BORDER_CLASS[stem.element]}/60`;
  const cardBg = isDay ? "bg-card" : WUXING_BG_CLASS[stem.element];

  return (
    <div className={`${stemBorder} ${cardBg} rounded-lg p-3 text-center flex flex-col gap-1`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="hanja text-[11px]">{label.hanja}</span> · {label.en}
        {isDay && <span className="ml-1 text-primary">★</span>}
      </div>
      <div className="hanja text-3xl sm:text-4xl font-bold leading-none mt-2">
        {stem.char}
      </div>
      <div className="hanja text-3xl sm:text-4xl font-bold leading-none">
        {branch.char}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {stem.ko}{branch.ko}
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span className="hanja">{WUXING_LABEL[stem.element].ko}</span>
        ·
        <span className="hanja">{WUXING_LABEL[branch.element].ko}</span>
      </div>
      <div className="mt-2 flex justify-center">
        {isDay ? (
          <span className="inline-block px-2 py-0.5 rounded-full bg-foreground text-background text-[9px] font-bold">
            日干
          </span>
        ) : (
          <span
            className="inline-block px-2 py-0.5 rounded-full bg-card border border-border text-[9px] font-semibold"
            title={SIPSIN_LABELS[stem.sipSin!].en}
          >
            <span className="hanja">{SIPSIN_LABELS[stem.sipSin!].hanja}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function HourUnknownCard() {
  const label = POSITION_LABEL.hour;
  return (
    <div className="border-2 border-dashed border-border bg-muted/30 rounded-lg p-3 text-center flex flex-col gap-1 opacity-70">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="hanja">{label.hanja}</span> · {label.en}
      </div>
      <div className="hanja text-3xl sm:text-4xl font-bold leading-none mt-2 text-muted-foreground">
        ?
      </div>
      <div className="hanja text-3xl sm:text-4xl font-bold leading-none text-muted-foreground">
        ?
      </div>
      <Link
        href="/"
        className="text-[10px] text-primary hover:underline mt-2"
      >
        Add a time
      </Link>
    </div>
  );
}

export function SajuPillars({ pillars }: { pillars: SajuResult["pillars"] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
      <PillarCard pillar={pillars.year}  isDay={false} />
      <PillarCard pillar={pillars.month} isDay={false} />
      <PillarCard pillar={pillars.day}   isDay={true}  />
      {pillars.hour ? <PillarCard pillar={pillars.hour} isDay={false} /> : <HourUnknownCard />}
    </div>
  );
}
```

- [ ] **Step 2: page.tsx에 임시 사용 → 빌드 확인**

`src/app/saju/page.tsx`의 JSON dump 자리에 잠시 추가 (검증만):

```tsx
import { SajuPillars } from "@/components/saju/saju-pillars";
// ...
{/* JSON dump 위에 */}
<SajuPillars pillars={saju.pillars} />
```

- [ ] **Step 3: dev 서버에서 시각 확인**

Run: `npm run dev`
브라우저: `localhost:3000/saju?y=1984&m=2&d=5&h=12&min=0&tz=Asia/Seoul`
확인:
- 4열 그리드 표시 (모바일 viewport는 2x2)
- 일주 cell 두꺼운 border + 별표
- 다른 cell은 stem element 컬러 보더
- 한자 정상 렌더 (외국 OS 검증은 Phase 5)

`localhost:3000/saju?y=1999&m=3&d=15&tz=America/New_York` (시각 unknown):
- 4번째 cell이 `?`로 표시 + "Add a time" 링크

dev 종료.

- [ ] **Step 4: build + lint**

Run: `npm run lint && npm run build`
Expected: 0 errors.

> Tailwind v4의 `border-wuxing-mok` 같은 utility는 토큰 등록이 되어있어야 컴파일됨. Task 1에서 `@theme inline`에 등록했으므로 OK. 빌드 시 unused warning만 무시.

- [ ] **Step 5: Commit**

```bash
git add src/components/saju/saju-pillars.tsx src/app/saju/page.tsx
git commit -m "feat(saju): add SajuPillars 4-column grid with sipSin chips

Day pillar gets thick foreground border + ★ + 日干 badge.
Other pillars get wuxing element border + tinted bg + sipSin hanja chip.
Hour-unknown variant: dashed cell with ?? + 'Add a time' link to home.
Mobile breakpoint: 2x2 grid below sm breakpoint."
```

---

### Task 14: DayMasterCard 컴포넌트

**Files:**
- Create: `src/components/saju/day-master-card.tsx`

- [ ] **Step 1: `src/components/saju/day-master-card.tsx` 작성**

```tsx
import type { DayMaster, WuXing } from "@/lib/saju-types";

const WUXING_LABEL: Record<WuXing, { ko: string; en: string }> = {
  wood:  { ko: "木", en: "Wood"  },
  fire:  { ko: "火", en: "Fire"  },
  earth: { ko: "土", en: "Earth" },
  metal: { ko: "金", en: "Metal" },
  water: { ko: "水", en: "Water" },
};

const WUXING_BG: Record<WuXing, string> = {
  wood:  "bg-wuxing-mok",
  fire:  "bg-wuxing-hwa",
  earth: "bg-wuxing-to",
  metal: "bg-wuxing-geum",
  water: "bg-wuxing-su",
};

type Props = {
  dayMaster: DayMaster;
  balance: Record<WuXing, number>;
};

export function DayMasterCard({ dayMaster, balance }: Props) {
  const total = Object.values(balance).reduce((a, b) => a + b, 0);
  const elements: WuXing[] = ["wood", "fire", "earth", "metal", "water"];

  return (
    <div className="mt-8 border border-border bg-card rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Day Master</div>
          <div className="hanja text-6xl font-bold text-primary mt-1">{dayMaster.stem}</div>
          <div className="text-xs text-muted-foreground mt-1">{dayMaster.ko}</div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground leading-relaxed">
            You are <strong className="hanja">{dayMaster.stem}</strong> — {dayMaster.keyword}.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your sajus's <strong>day master</strong> is your core self. Other pillars relate to it through the ten gods (十神).
          </p>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          <span className="hanja">五行</span> Balance · {total} characters
        </div>
        <div className="space-y-1">
          {elements.map(el => {
            const count = balance[el];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={el} className="flex items-center gap-2">
                <span className="w-16 text-xs flex items-center gap-1">
                  <span className="hanja text-sm">{WUXING_LABEL[el].ko}</span>
                  <span className="text-muted-foreground">{WUXING_LABEL[el].en}</span>
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${WUXING_BG[el]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: page.tsx에서 사용**

`src/app/saju/page.tsx`의 JSON dump 자리에 SajuPillars 다음에 추가:

```tsx
import { DayMasterCard } from "@/components/saju/day-master-card";
// ...
<DayMasterCard dayMaster={saju.dayMaster} balance={saju.wuXingBalance} />
```

JSON dump (`<pre>...`) 블록은 이제 삭제 가능. 단, Phase 4 마지막(Task 15) 후 한 번에 정리 권장.

- [ ] **Step 3: dev 서버 시각 확인**

Run: `npm run dev`
브라우저: `/saju?y=1984&m=2&d=5&h=12&min=0&tz=Asia/Seoul`
확인:
- 일간 큰 한자 + keyword 한 줄
- 오행 balance 5색 가로 막대
- 작 표시 OK

dev 종료.

- [ ] **Step 4: Commit**

```bash
git add src/components/saju/day-master-card.tsx src/app/saju/page.tsx
git commit -m "feat(saju): add DayMasterCard with wuxing balance bars

Big day stem hanja + keyword sentence + explanation.
Horizontal 5-element bars showing distribution across 6 or 8 characters,
each bar in its wuxing color from globals.css tokens."
```

---

### Task 15: SajuIntro 컴포넌트 + page wiring 정리

**Files:**
- Create: `src/components/saju/saju-intro.tsx`
- Modify: `src/app/saju/page.tsx` (JSON dump 제거, intro 통합)

- [ ] **Step 1: `src/components/saju/saju-intro.tsx` 작성**

```tsx
import type { SajuResult } from "@/lib/saju-types";

export function SajuIntro({ saju }: { saju: SajuResult }) {
  const { source } = saju;
  const tzCity = source.birthLocal.timezone.split("/").pop()?.replace(/_/g, " ") ?? source.birthLocal.timezone;
  const dateStr = new Date(source.birthLocal.year, source.birthLocal.month - 1, source.birthLocal.day)
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = source.birthLocal.hour !== undefined
    ? ` ${String(source.birthLocal.hour).padStart(2, "0")}:${String(source.birthLocal.minute ?? 0).padStart(2, "0")}`
    : "";

  return (
    <header className="text-center">
      <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
        Your <span className="hangul">사주</span>
      </h1>
      <p className="font-serif italic text-base text-foreground/70 mt-2">
        Four pillars · 十神 · 五行
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        Born {dateStr}{timeStr} in {tzCity}
        {source.timeKnown && (
          <>
            {" → "}
            <span className="text-foreground">{source.kstLabel}</span>
          </>
        )}
        {!source.timeKnown && (
          <span className="text-muted-foreground"> · Korea date: {source.kstLabel}</span>
        )}
      </p>
    </header>
  );
}
```

- [ ] **Step 2: `src/app/saju/page.tsx` — 최종 구조로 정리**

전체 파일을 다음으로 교체 (JSON dump 제거):

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { parseSajuParams } from "@/lib/saju-url";
import { computeSaju } from "@/lib/saju-calculator";
import { SajuIntro } from "@/components/saju/saju-intro";
import { SajuPillars } from "@/components/saju/saju-pillars";
import { DayMasterCard } from "@/components/saju/day-master-card";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlParams(obj: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach(x => params.append(k, x));
    else params.set(k, v);
  }
  return params;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const birth = parseSajuParams(toUrlParams(params));
  if (!birth) {
    return { title: "Saju not found · KSaju" };
  }
  try {
    const saju = computeSaju(birth);
    const yp = saju.pillars.year;
    const dp = saju.pillars.day;
    return {
      title: `${yp.stem.char}${yp.branch.char} · ${dp.stem.char}${dp.branch.char} · Your Saju · KSaju`,
      description: "Your 사주 four pillars and ten gods, computed from your birth time.",
    };
  } catch {
    return { title: "Saju · KSaju" };
  }
}

export default async function SajuPage({ searchParams }: Props) {
  const params = await searchParams;
  const birth = parseSajuParams(toUrlParams(params));
  if (!birth) notFound();

  let saju;
  try {
    saju = computeSaju(birth);
  } catch {
    notFound();
  }

  return (
    <main className="hanji-paper min-h-screen relative overflow-hidden">
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <SajuIntro saju={saju} />
        <SajuPillars pillars={saju.pillars} />
        <DayMasterCard dayMaster={saju.dayMaster} balance={saju.wuXingBalance} />
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Edit my birth info
          </Link>
        </div>
      </div>
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

- [ ] **Step 3: dev 시각 확인 (한 번 더)**

Run: `npm run dev`
브라우저:
1. `/saju?y=1984&m=2&d=5&h=12&min=0&tz=Asia/Seoul` — 풀 결과
2. `/saju?y=1999&m=3&d=15&tz=America/New_York` — 시각 unknown variant
3. 다크 모드 토글 → 색 조정 확인 (랜딩으로 한 번 가서 토글 후 돌아오기)
4. 모바일 viewport (DevTools 375px) → 2x2 그리드

dev 종료.

- [ ] **Step 4: build + lint**

Run: `npm run lint && npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/saju/saju-intro.tsx src/app/saju/page.tsx
git commit -m "feat(saju): wire /saju page with intro + pillars + day master

Removes JSON dump placeholder. SajuIntro shows birth source and KST label.
Final page composition: changsal bands, hero title, pillars grid,
day master card, edit-info back link."
```

---

## Phase 5 — Integration & Verification (Tasks 16-18)

### Task 16: KstResultModal CTA 활성화 + landing 페이지 birth 전달

**Files:**
- Modify: `src/components/kst/kst-result-modal.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `src/components/kst/kst-result-modal.tsx` 수정**

```tsx
// import 변경
import Link from "next/link";
import { sajuHref } from "@/lib/saju-url";
import type { KSTResult, BirthData } from "@/lib/kst-types";
```

`KstResultModalProps` 수정 — `birth` prop 추가:
```tsx
type KstResultModalProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  result: KSTResult | null;
  birth: BirthData | null;
};
```

함수 signature:
```tsx
export function KstResultModal({ open, onClose, onEdit, result, birth }: KstResultModalProps) {
```

기존 disabled `<Button>` + Coming Soon 배지 블록 (96-102 라인 부근):
```tsx
{/* 기존:
  <div className="relative">
    <Button disabled className="w-full">
      Discover your saju →
    </Button>
    <span className="absolute -top-2 -right-1 bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-[9px] font-bold">
      Coming Soon
    </span>
  </div>
*/}
{birth && (
  <Link
    href={sajuHref(birth)}
    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity"
  >
    Discover your saju →
  </Link>
)}
```

- [ ] **Step 2: `src/app/page.tsx` 수정 — modal에 birth 전달**

`useState`에 birth 추가:
```tsx
const [submittedBirth, setSubmittedBirth] = useState<BirthData | null>(null);
```

`handleSubmit` 안에서 setSubmittedBirth(data):
```tsx
const handleSubmit = (data: BirthData) => {
  setErrorMessage(null);
  try {
    const r = convertToKST(data);
    setResult(r);
    setSubmittedBirth(data);  // ← 추가
    setModalOpen(true);
  } catch (err) {
    console.error("KST conversion failed:", err);
    setErrorMessage(
      "Couldn't convert this birth time. Please double-check the timezone and try again."
    );
  }
};
```

Modal 호출에 birth 전달:
```tsx
<KstResultModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onEdit={() => setModalOpen(false)}
  result={result}
  birth={submittedBirth}
/>
```

`import` 라인에 `BirthData` 추가 (이미 있다면 skip):
```tsx
import type { BirthData, KSTResult } from "@/lib/kst-types";
```

- [ ] **Step 3: dev 시각 확인 — 풀 사이클**

Run: `npm run dev`
브라우저:
1. 랜딩 → 폼 입력 (예: 1984 / 2 / 5 / 12:00 / Asia/Seoul) → 제출
2. Modal 열림 → "Discover your saju →" 버튼 클릭
3. `/saju?...`로 이동, 사주 결과 페이지 노출
4. "← Edit my birth info" 클릭 → 랜딩으로 돌아옴

dev 종료.

- [ ] **Step 4: build + lint + test 회귀**

Run: `npm test && npm run lint && npm run build`
Expected: 모두 통과.

- [ ] **Step 5: Commit**

```bash
git add src/components/kst/kst-result-modal.tsx src/app/page.tsx
git commit -m "feat(saju): enable Discover-your-saju CTA, link from modal to /saju

- KstResultModal accepts birth: BirthData prop
- Disabled Button + Coming Soon badge replaced by Link to sajuHref(birth)
- Landing tracks submitted birth in state and passes to modal
- End-to-end: form → modal → /saju route works"
```

---

### Task 17: 수동 시각 검증 (시크릿 창 + 외국 OS 한자)

**Files:** 없음 (검증 작업)

이 task는 사용자 협조 필요 — checklist를 따라 브라우저에서 직접 확인 후 보고.

- [ ] **Step 1: 시크릿 창에서 정상 케이스 검증**

`npm run dev`
시크릿 창에서 `localhost:3000` 열기.

- [ ] 1. 폼 초기 상태 정상 (timezone 자동 감지)
- [ ] 2. 폼 제출 (1984-02-05, 12:00, Asia/Seoul) → modal에 KST 표시
- [ ] 3. Modal CTA "Discover your saju →" 클릭 → /saju 페이지로 이동
- [ ] 4. /saju 페이지: 4기둥 + 일간 강조 + 오행 컬러 + 십신 칩 + DayMasterCard
- [ ] 5. "← Edit my birth info" → 랜딩으로 돌아옴

- [ ] **Step 2: 시각 unknown β 정책 검증**

- [ ] 6. 시각 미입력 (1999-03-15, no time, Asia/Seoul) 제출
- [ ] 7. Modal에 CTA 활성 상태 ("Discover your saju →" 클릭 가능)
- [ ] 8. /saju 페이지: 시주 cell이 `?` 표시 + "Add a time" 링크
- [ ] 9. "Add a time" 클릭 → 랜딩으로 돌아옴

- [ ] **Step 3: invalid params 검증**

- [ ] 10. URL 직접 입력: `/saju?y=1899&m=3&d=15&tz=Asia/Seoul` → not-found.tsx 노출
- [ ] 11. URL 직접 입력: `/saju` (params 없음) → not-found.tsx
- [ ] 12. URL: `/saju?y=2000&m=2&d=30&tz=Asia/Seoul` (2월 30일) → not-found

- [ ] **Step 4: 다크 모드**

- [ ] 13. 토글 → /saju 페이지에서 오행 컬러가 다크 mode 변종으로 전환
- [ ] 14. 한지 배경 → 코스믹 그라데이션 + 사진 텍스처로 변경

- [ ] **Step 5: 모바일 viewport (DevTools 375px)**

- [ ] 15. /saju 모바일에서 4기둥 → 2x2 그리드 break
- [ ] 16. 한자 글리프 정상 (시스템 폰트 fallback 동작)
- [ ] 17. DayMasterCard 모바일에서 가로 막대 깨지지 않음

- [ ] **Step 6: 한자 fallback 검증 (외국 OS 시뮬레이션)**

Option A — Docker:
```bash
docker run --rm -p 8080:8080 -v "$(pwd)":/app -w /app \
  node:20-bookworm-slim \
  bash -c "apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
  npm ci && npm run build && npm start"
# 컨테이너에는 CJK 폰트 없음 → 브라우저가 웹폰트 (Noto Serif KR)로 fallback
```
브라우저: `localhost:8080/saju?y=1984&m=2&d=5&h=12&min=0&tz=Asia/Seoul`

Option B — Windows English (CJK pack 없는 환경):
실제 영문 Windows 머신 또는 가상 머신에서 같은 URL 방문.

- [ ] 18. DevTools Network 탭에서 Noto Serif KR fetch 확인 (Google Fonts CDN)
- [ ] 19. 모든 한자(천간/지지/오행/십신 라벨) 깨지지 않고 명조체로 렌더
- [ ] 20. 페이지 전체 일관된 폰트

- [ ] **Step 7: 비기능 게이트**

```bash
npm test       # 모든 단위 테스트 통과
npm run lint   # 0 errors (form.tsx warning 1건 제외)
npm run build  # success
```

- [ ] **Step 8: 검증 결과 commit (필요 시 발견된 버그 fix)**

검증 통과 시 commit 없음. 버그 발견 시 별도 fix commit 후 검증 재시행.

체크리스트 모두 ✅ 표시 후 다음 task로.

---

### Task 18: Final code review 디스패치

**Files:** 없음 (review 작업)

- [ ] **Step 1: subagent로 final code review 디스패치**

(executing-plans 또는 subagent-driven-development에서 자동 처리되는 단계 — 수동 trigger 가능)

Review 대상 commits: 이번 saju 사이클의 Task 1~17 commits 전체.

리뷰어에게 요청:
> 다음 spec/plan에 따라 작성된 commits를 리뷰해주세요:
> - Spec: `docs/superpowers/specs/2026-05-22-saju-calculation-design.md`
> - Plan: `docs/superpowers/plans/2026-05-22-saju-calculation.md`
> - Commit 범위: Task 1 시작 commit ~ Task 17 마지막 commit
>
> 다음을 평가해주세요:
> 1. spec/plan과의 일치도 (구현 누락이나 변경)
> 2. 도메인 계산 정확성 (특히 자시 23:00 boundary, 입춘 boundary, 십신 매트릭스)
> 3. TypeScript 타입 안전성
> 4. UI 컴포넌트 시맨틱 토큰 사용 (C1 fix 패턴 준수)
> 5. 외국 OS 한자 fallback 보장
> 6. Server Component 사용 적절성 (Next.js 15+ API)
> 7. 보안 (XSS, URL injection 등)
>
> 등급: No / No with fixes / Yes.

- [ ] **Step 2: 리뷰 결과 응답**

리뷰가 No-with-fixes를 반환하면 deferred items별로:
- C (Critical): 즉시 fix commit
- I (Important): 추가 commit 또는 사유 명시 후 defer
- M (Minor): defer or fix

수정 후 npm test + lint + build 회귀 확인 → 새 fix commits 생성.

- [ ] **Step 3: task-log 업데이트**

`task-log.md` 상단에 새 일자(예: 2026-05-29 가정) 섹션 추가:

```markdown
## YYYY-MM-DD (요일)

### 오늘 한 일 — 사주 4기둥 계산 사이클

(commits 요약 + 검증 통과 + final review 결과)

### 현재 상태
- 활성 브랜치: ...
- 빌드/lint/test: 모두 통과
- Dev 서버: 중지됨

### 다음 사이클 결정
backlog.md 참고. 다음 후보: A1 Vercel Web Analytics or A3 SEO basics or E1 음력 옵션.
```

- [ ] **Step 4: finishing-a-development-branch (사용자 결정)**

새 dev 브랜치를 만든 경우 finishing 스킬 진입.
main에 직접 작업한 경우: push 결정.

- [ ] **Step 5: 사이클 종료 commit**

```bash
git add task-log.md
git commit -m "docs: task-log — 사주 4기둥 계산 사이클 완료"
```

---

## Self-Review Summary

**Spec coverage:**
- §2 목표 #1-10 모두 task에 매핑 ✓
- §3 5-layer 아키텍처 → Task 2-15에 layer별 분리 ✓
- §4 데이터 모델 → Task 2 (types), Task 3 (constants) ✓
- §5 계산 로직 → Task 6-10 (sipSin, year, month, day, hour, integration) ✓
- §6 URL/route → Task 11-12 ✓
- §7 UI 컴포넌트 + 한자 fallback → Task 1, 13-15 ✓
- §8 에러/엣지 → Task 12 (not-found), 5 (range throw), 9 (자시 boundary) ✓
- §9 테스트 전략 → 모든 lib task에 vitest TDD + Task 17 시각 검증 ✓
- Appendix A 한자 글리프 → 사용 자동 (next/font subset auto-handled) ✓
- Appendix B 데이터 생성 → Task 4 ✓

**Placeholder scan:** 없음 (모든 step에 실제 코드/명령/expected output) ✓

**Type consistency:**
- `BirthData` 일관 (kst-types에서 import) ✓
- `SajuResult.pillars.hour: SajuPillar | null` Task 2 정의 → Task 10 통합/Task 13 사용 일관 ✓
- `STEM_INDEX`, `BRANCH_INDEX` Task 3 정의 → Task 6/7/8/9 import 일관 ✓
- `OHO_DUN`, `OSEO_DUN` Task 3 정의 → Task 7/9 사용 일관 ✓

**갈등/모호 발견 사항 없음.**

---

## Execution Notes

- 각 task는 2-30분 단위. TDD 사이클 (실패 테스트 → 구현 → 통과 → commit) 반복.
- 데이터 정확성에 의존하는 task (4, 7, 8, 10)는 KASI 만세력 또는 trusted reference로 cross-check 필요. 골든 케이스 expected 값은 plan 실행 시 검증해 조정.
- Task 12, 15는 Next.js docs (`node_modules/next/dist/docs/`)를 먼저 읽어 정확한 API 사용 (AGENTS.md 규칙).
- Task 17 검증은 사용자 협조. 외국 OS 시뮬레이션 (Docker 또는 VM)으로 한자 fallback 확인.
- Task 18 review 후 발견된 버그는 별도 fix commit.

**총 commits:** Task 1~17 = 약 17개 + 검증/fix/task-log = 총 20-25 commit 예상.
