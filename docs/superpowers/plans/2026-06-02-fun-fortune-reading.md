# Fun 운세 리딩 (사이클 9) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** '내 사주' 결과 뷰에 규칙기반·짧고 fun한 영문 운세 카드 4종(Money / Love / Career / This Year)을 추가한다.

**Architecture:** 순수 클라이언트 규칙 엔진 `src/lib/fortune.ts`(`compatibility.ts` 패턴 차용)가 `(userSaju, currentLuck)` → 4개 `FortuneCard`를 결정적으로 산출. 현재 세운(연주)/월운(월주)은 `calcCurrentLuck` 서버액션이 manseryeok 재사용으로 계산해 클라로 전달. 표시는 `src/components/fortune/`의 Section/Card. 공유는 비활성 티저 버튼만(실제 이미지 export는 후속).

**Tech Stack:** TypeScript, React 19, Next.js 16 (App Router, Server Actions), Tailwind v4, shadcn/ui, vitest(node + happy-dom/RTL), `@fullstackfamily/manseryeok`, date-fns-tz.

**Spec:** `docs/superpowers/specs/2026-06-02-fun-fortune-reading-design.md`

---

## 파일 구조

| 파일 | 책임 | 액션 |
|------|------|------|
| `src/lib/saju-types.ts` | `CurrentLuck` 타입 추가 | Modify |
| `src/lib/saju-data.ts` | `STEM_COMBO` 상수 추가(단일 출처) | Modify |
| `src/lib/compatibility.ts` | 로컬 `STEM_COMBO` → saju-data import로 교체 | Modify |
| `src/lib/saju.ts` | `dateToLuck(now)` 추가(server-only, manseryeok 재사용) | Modify |
| `src/lib/saju.test.ts` | `dateToLuck` known-answer 테스트 | Modify |
| `src/app/actions/saju.ts` | `calcCurrentLuck()` 서버액션 추가 | Modify |
| `src/lib/fortune.ts` | 규칙 엔진 `calcFortune` (신규, client-safe) | Create |
| `src/lib/fortune.test.ts` | 규칙 엔진 테스트 (node) | Create |
| `src/components/fortune/fortune-card.tsx` | 카드 1개 프레젠테이션 | Create |
| `src/components/fortune/fortune-section.tsx` | 컨테이너 + Share 티저 | Create |
| `src/components/fortune/fortune-section.test.tsx` | RTL 테스트 | Create |
| `src/components/saju/saju-result.tsx` | `<FortuneSection>` 삽입 + `currentLuck` prop | Modify |
| `src/app/page.tsx` | `calcCurrentLuck` 호출 + state + 전달 | Modify |

---

## Task 1: `CurrentLuck` 타입 + `STEM_COMBO` 단일 출처

**Files:**
- Modify: `src/lib/saju-types.ts`
- Modify: `src/lib/saju-data.ts`
- Modify: `src/lib/compatibility.ts`
- Test: 기존 `src/lib/compatibility.test.ts` (회귀)

- [ ] **Step 1: `CurrentLuck` 타입 추가**

`src/lib/saju-types.ts` 파일 맨 끝(UserSaju 정의 다음)에 추가:

```ts
/**
 * 현재 시점의 세운(연주)/월운(월주) 간지. fortune.ts가 'This Year' 카드 계산에 사용.
 * 시각 무관(절기/입춘은 날짜 기준)이므로 서버에서 오늘 KST 정오 기준으로 산출.
 */
export type CurrentLuck = {
  yearPillar: string; // 예 "丙午"
  monthPillar: string; // 예 "癸巳"
};
```

- [ ] **Step 2: `STEM_COMBO`를 saju-data.ts로 승격**

`src/lib/saju-data.ts`에서 `DAY_MASTER_KEYWORDS` 정의 바로 위에 추가:

```ts
// 천간 합(끌림) — 5쌍. 궁합·운세 양쪽에서 재사용하는 단일 출처.
// 甲己 · 乙庚 · 丙辛 · 丁壬 · 戊癸
export const STEM_COMBO: readonly [HeavenlyStem, HeavenlyStem][] = [
  ["甲", "己"],
  ["乙", "庚"],
  ["丙", "辛"],
  ["丁", "壬"],
  ["戊", "癸"],
] as const;
```

- [ ] **Step 3: `compatibility.ts`가 saju-data의 STEM_COMBO를 쓰도록 교체**

`src/lib/compatibility.ts` 상단 import에 `STEM_COMBO` 추가:

```ts
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  WUXING_PRODUCE,
  WUXING_CONTROL,
  STEM_COMBO,
} from "./saju-data";
```

그리고 파일 내 로컬 `STEM_COMBO` 정의(아래 블록)를 **삭제**:

```ts
// --- 천간 합(끌림) / 충(충돌) ---
const STEM_COMBO: [string, string][] = [
  ["甲", "己"],
  ["乙", "庚"],
  ["丙", "辛"],
  ["丁", "壬"],
  ["戊", "癸"],
];
```

→ 삭제 후엔 바로 아래 `const STEM_CLASH: ...`부터 시작하도록 둔다(`STEM_CLASH`는 그대로 유지). `inPairs` 헬퍼는 `readonly [string,string][]`도 받으므로 타입 호환됨(STEM_COMBO 원소가 `[HeavenlyStem,HeavenlyStem]`이라 `inPairs(a,b, STEM_COMBO)` 호출 시 `[string,string][]` 파라미터에 readonly 튜플 배열을 넘기게 됨 → 호출부 시그니처를 `readonly (readonly [string, string])[]`로 넓혀야 함). `inPairs` 시그니처를 다음으로 변경:

```ts
const inPairs = (
  a: string,
  b: string,
  list: readonly (readonly [string, string])[],
) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
```

- [ ] **Step 4: 컴파일 + 기존 궁합 테스트 회귀 확인**

Run: `npx tsc --noEmit; npx vitest run src/lib/compatibility.test.ts`
Expected: tsc 에러 없음. 궁합 테스트 23개 전부 PASS (STEM_COMBO 출처만 바뀌고 동작 동일).

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju-types.ts src/lib/saju-data.ts src/lib/compatibility.ts
git commit -m "refactor(saju): add CurrentLuck type + promote STEM_COMBO to saju-data"
```

---

## Task 2: `dateToLuck` (saju.ts, server-only) + 테스트

**Files:**
- Modify: `src/lib/saju.ts`
- Test: `src/lib/saju.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/saju.test.ts` 파일에 import와 테스트를 추가. 파일 상단 import에 `dateToLuck`를 추가하고(기존 `import { birthToSaju, toCompatPillars } from "./saju";` 형태를 `dateToLuck` 포함하도록 수정), 파일 끝에 다음 describe 추가:

```ts
describe("dateToLuck", () => {
  it("2026-06-02(KST) → 세운 연주 = 丙午", () => {
    // 정오 UTC로 만들어도 Asia/Seoul 기준 같은 날짜
    const now = new Date("2026-06-02T03:00:00Z"); // = 2026-06-02 12:00 KST
    const luck = dateToLuck(now);
    expect(luck.yearPillar).toBe("丙午");
  });

  it("월운 월주는 천간+지지 2글자 한자", () => {
    const now = new Date("2026-06-02T03:00:00Z");
    const luck = dateToLuck(now);
    expect(luck.monthPillar).toHaveLength(2);
    expect(luck.yearPillar).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/saju.test.ts -t dateToLuck`
Expected: FAIL — `dateToLuck is not a function` / import 에러.

- [ ] **Step 3: 최소 구현**

`src/lib/saju.ts` 상단 import에 date-fns-tz와 CurrentLuck 타입 추가:

```ts
import { formatInTimeZone } from "date-fns-tz";
```
그리고 기존 `import type { UserSaju } from "./saju-types";`를 다음으로 변경:
```ts
import type { UserSaju, CurrentLuck } from "./saju-types";
```

`toCompatPillars` 함수 아래(파일 끝)에 추가:

```ts
/**
 * 주어진 시각의 세운(연주)/월운(월주) 간지. 오늘 KST 날짜 정오로 manseryeok 호출.
 * 연·월 기둥은 시각 무관(절기/입춘은 날짜 기준)이라 정오 고정으로 충분.
 * @param now 기준 시각(보통 new Date()). 테스트 주입용으로 인자화.
 */
export function dateToLuck(now: Date): CurrentLuck {
  const year = Number(formatInTimeZone(now, "Asia/Seoul", "yyyy"));
  const month = Number(formatInTimeZone(now, "Asia/Seoul", "M"));
  const day = Number(formatInTimeZone(now, "Asia/Seoul", "d"));
  const saju = birthToSaju({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    timezone: "Asia/Seoul",
  });
  return {
    yearPillar: saju.pillars.year,
    monthPillar: saju.pillars.month,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/saju.test.ts -t dateToLuck`
Expected: PASS (2개).

- [ ] **Step 5: Commit**

```bash
git add src/lib/saju.ts src/lib/saju.test.ts
git commit -m "feat(saju): add dateToLuck (current 세운/월운 via manseryeok reuse)"
```

---

## Task 3: `calcCurrentLuck` 서버액션

**Files:**
- Modify: `src/app/actions/saju.ts`

> 서버액션은 단위 테스트하지 않는다(얇은 래퍼, manseryeok=server-only). 로직은 `dateToLuck`가 Task 2에서 검증됨. 빌드로 검증.

- [ ] **Step 1: 액션 추가**

`src/app/actions/saju.ts`의 import를 다음으로 수정:

```ts
import { birthSchema } from "@/lib/kst-types";
import { birthToSaju, dateToLuck } from "@/lib/saju";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";
```

`calcUserSaju` 함수 아래에 추가:

```ts
/**
 * 현재 시점의 세운(연주)/월운(월주). fortune.ts의 'This Year' 카드용.
 * 사용자 입력에 의존하지 않으며 서버 시각(KST)으로 산출.
 */
export async function calcCurrentLuck(): Promise<CurrentLuck> {
  return dateToLuck(new Date());
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/saju.ts
git commit -m "feat(saju): add calcCurrentLuck server action"
```

---

## Task 4: 규칙 엔진 `src/lib/fortune.ts` (TDD)

**Files:**
- Create: `src/lib/fortune.ts`
- Test: `src/lib/fortune.test.ts`

규칙(일간 오행 = `dm`): 재성(Money) = `WUXING_CONTROL[dm]`, 관성(Career) = `dm`을 극하는 오행. 개수는 `wuxingBalance`(saju-display) 사용. Love = 일간 천간 10종 테이블. This Year = `dm` vs 올해 연간 오행 관계.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/fortune.test.ts` 생성:

```ts
import { describe, it, expect } from "vitest";
import { calcFortune } from "./fortune";
import type { UserSaju, CurrentLuck } from "./saju-types";

// RM: 壬申/己酉/辛卯, 일간 辛(metal). 오행: water1, metal3, earth1, wood1, fire0
const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK_2026: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("calcFortune", () => {
  it("4개 카드를 money/love/career/time 순서로 반환", () => {
    const cards = calcFortune(RM, LUCK_2026);
    expect(cards.map((c) => c.key)).toEqual(["money", "love", "career", "time"]);
  });

  it("Money: 재성=일간이 극하는 오행. 辛(metal)→재성 wood, count 1 → Steady", () => {
    const money = calcFortune(RM, LUCK_2026)[0];
    expect(money.element).toBe("wood");
    expect(money.tierLabel).toBe("Steady"); // count 1 → some
  });

  it("Career: 관성=일간을 극하는 오행. 辛(metal)→관성 fire, count 0 → Free Agent", () => {
    const career = calcFortune(RM, LUCK_2026)[2];
    expect(career.element).toBe("fire");
    expect(career.tierLabel).toBe("Free Agent"); // count 0 → none
  });

  it("Love: 일간 천간 테이블. 辛 → Refined, element=metal", () => {
    const love = calcFortune(RM, LUCK_2026)[1];
    expect(love.element).toBe("metal");
    expect(love.tierLabel).toBe("Refined");
  });

  it("This Year: 辛 일간 + 丙午年 → 천간합(丙辛) → Magnetic", () => {
    const time = calcFortune(RM, LUCK_2026)[3];
    expect(time.tierLabel).toBe("Magnetic");
    expect(time.element).toBe("fire"); // 연간 丙 = fire
    expect(time.subLine).toBeTruthy();
  });

  it("Money 강함: 재성 오행 3개 → Magnet", () => {
    // 일간 甲(wood) → 재성 earth. earth 3개 이상 구성
    const earthy: UserSaju = {
      pillars: { year: "戊辰", month: "己丑", day: "甲戌", hour: null },
      dayMaster: "甲",
      isTimeCorrected: false,
    };
    // 戊(earth)辰(earth) 己(earth)丑(earth) 甲(wood)戌(earth) → earth 5
    const money = calcFortune(earthy, LUCK_2026)[0];
    expect(money.element).toBe("earth");
    expect(money.tierLabel).toBe("Magnet"); // count>=3
  });

  it("This Year 비합 관계: 甲(wood) 일간 + 丙(fire)年 → 일간이 생(상생) → Giving", () => {
    const woody: UserSaju = {
      pillars: { year: "甲子", month: "甲子", day: "甲子", hour: null },
      dayMaster: "甲",
      isTimeCorrected: false,
    };
    const time = calcFortune(woody, LUCK_2026)[3];
    expect(time.tierLabel).toBe("Giving"); // wood→fire 생
  });

  it("결정적: 동일 입력 → 동일 출력", () => {
    expect(calcFortune(RM, LUCK_2026)).toEqual(calcFortune(RM, LUCK_2026));
  });

  it("Love 테이블은 10천간 전부 정의", () => {
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    for (const s of stems) {
      const saju: UserSaju = {
        pillars: { year: "甲子", month: "甲子", day: s + "子", hour: null },
        dayMaster: s,
        isTimeCorrected: false,
      };
      const love = calcFortune(saju, LUCK_2026)[1];
      expect(love.line.length).toBeGreaterThan(0);
      expect(love.tierLabel.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/fortune.test.ts`
Expected: FAIL — `Cannot find module './fortune'`.

- [ ] **Step 3: `src/lib/fortune.ts` 구현**

```ts
// ============================================================
// KSaju 운세 엔진 (src/lib/fortune.ts)
// 규칙기반·짧고 fun · 클라이언트 안전 (manseryeok 미포함)
//
// 입력: UserSaju(한자 기둥) + CurrentLuck(세운/월운)
// 출력: 4개 FortuneCard (Money / Love / Career / This Year)
// 주의: "깊은 리딩" 아님. 십신(十神) lite 규칙 → fun 영문 테이블. LLM 미사용.
// ============================================================
import { WUXING_PRODUCE, WUXING_CONTROL, STEM_COMBO } from "./saju-data";
import { elementOf, wuxingBalance } from "./saju-display";
import type { WuXing, UserSaju, CurrentLuck } from "./saju-types";

export type FortuneKey = "money" | "love" | "career" | "time";

export interface FortuneCard {
  key: FortuneKey;
  title: string;
  emoji: string;
  element: WuXing; // 액센트색 토큰용 (WUXING_META)
  tierLabel: string; // 짧은 등급/무드 워드
  line: string; // fun 한 줄
  subLine?: string; // This Year 카드의 이번 달 월운 라인
}

const inPairs = (
  a: string,
  b: string,
  list: readonly (readonly [string, string])[],
) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// 오행 count → tier
type Tier = "none" | "some" | "strong";
function tierOf(count: number): Tier {
  if (count === 0) return "none";
  if (count <= 2) return "some";
  return "strong";
}

// 일간 오행을 극하는 오행(관성). WUXING_CONTROL의 역방향.
function controllerOf(el: WuXing): WuXing {
  const found = (Object.keys(WUXING_CONTROL) as WuXing[]).find(
    (k) => WUXING_CONTROL[k] === el,
  );
  return found!; // 5원소 사이클이라 항상 존재
}

const MONEY: Record<Tier, { tierLabel: string; line: string }> = {
  none: {
    tierLabel: "Free Spirit",
    line: "Wealth's playing hard to get — adventure-budget era 🪙",
  },
  some: { tierLabel: "Steady", line: "Steady coins and smart little moves 💰" },
  strong: { tierLabel: "Magnet", line: "Money-magnet energy in this life 🧲" },
};

const CAREER: Record<Tier, { tierLabel: string; line: string }> = {
  none: {
    tierLabel: "Free Agent",
    line: "No boss energy boxing you in — born freelancer 🎈",
  },
  some: {
    tierLabel: "Climber",
    line: "Climbing steady, one solid step at a time 📈",
  },
  strong: {
    tierLabel: "Leader",
    line: "Natural-leader signal — people just follow you 👑",
  },
};

const LOVE: Record<string, { tierLabel: string; line: string }> = {
  甲: { tierLabel: "Devoted", line: "Loyal — you love with steady, rooted devotion 🌳" },
  乙: { tierLabel: "Tender", line: "Soft-hearted — you wrap gently around the right one 🌿" },
  丙: { tierLabel: "Radiant", line: "You fall fast and bright — a whole sunrise ☀️" },
  丁: { tierLabel: "Slow-burn", line: "Warm and intimate — a candle that stays lit 🕯️" },
  戊: { tierLabel: "Steady", line: "Your love is a safe, solid mountain 🏔️" },
  己: { tierLabel: "Nurturing", line: "The comfort partner everyone feels at home with 🌾" },
  庚: { tierLabel: "All-in", line: "Bold and all-or-nothing in romance ⚔️" },
  辛: { tierLabel: "Refined", line: "Picky in the best possible way — quality only 💎" },
  壬: { tierLabel: "Free", line: "A free spirit who loves deep and wide 🌊" },
  癸: { tierLabel: "Intuitive", line: "You read hearts like gentle rain 🌧️" },
};

type TimeRel = "combo" | "same" | "generate-me" | "i-generate" | "control" | "neutral";

const TIME: Record<TimeRel, { tierLabel: string; line: string }> = {
  combo: { tierLabel: "Magnetic", line: "A magnetic year — say yes to the spark ✨" },
  same: { tierLabel: "At Home", line: "Your element's year — you feel right at home 🏠" },
  "generate-me": { tierLabel: "Lucky", line: "Carried and supported all year long 🍀" },
  "i-generate": { tierLabel: "Giving", line: "You give a lot this year — remember to refill 🫖" },
  control: { tierLabel: "Spicy", line: "A spicy year — growth through a little friction 🌶️" },
  neutral: { tierLabel: "Easy", line: "An easygoing, do-your-own-thing year 🌤️" },
};

const TIME_MONTH: Record<TimeRel, string> = {
  combo: "sparks fly ✨",
  same: "in your element 🙂",
  "generate-me": "you're supported 🍀",
  "i-generate": "pace yourself 🫖",
  control: "push through 🌶️",
  neutral: "smooth sailing 🌤️",
};

// 일간 stem vs 다른 stem(연간/월간)의 관계
function stemRelation(dmStem: string, otherStem: string): TimeRel {
  if (inPairs(dmStem, otherStem, STEM_COMBO)) return "combo";
  const e1 = elementOf(dmStem);
  const e2 = elementOf(otherStem);
  if (e1 === e2) return "same";
  if (WUXING_PRODUCE[e2] === e1) return "generate-me"; // 상대가 나를 생
  if (WUXING_PRODUCE[e1] === e2) return "i-generate"; // 내가 상대를 생
  if (WUXING_CONTROL[e1] === e2 || WUXING_CONTROL[e2] === e1) return "control";
  return "neutral";
}

/**
 * 사용자 사주 + 현재 세운/월운 → 4개 fun 운세 카드.
 * @param userSaju manseryeok 변환 결과(일간·기둥)
 * @param luck     현재 연주/월주 (calcCurrentLuck)
 */
export function calcFortune(userSaju: UserSaju, luck: CurrentLuck): FortuneCard[] {
  const dmStem = userSaju.dayMaster;
  const dmEl = elementOf(dmStem);
  const balance = wuxingBalance(userSaju);

  // Money — 재성(일간이 극하는 오행)
  const wealthEl = WUXING_CONTROL[dmEl];
  const moneyTier = tierOf(balance[wealthEl]);
  const money: FortuneCard = {
    key: "money",
    title: "Money",
    emoji: "💰",
    element: wealthEl,
    ...MONEY[moneyTier],
  };

  // Love — 일간 천간 아키타입
  const loveEntry = LOVE[dmStem];
  const love: FortuneCard = {
    key: "love",
    title: "Love",
    emoji: "💘",
    element: dmEl,
    ...loveEntry,
  };

  // Career — 관성(일간을 극하는 오행)
  const officerEl = controllerOf(dmEl);
  const careerTier = tierOf(balance[officerEl]);
  const career: FortuneCard = {
    key: "career",
    title: "Career",
    emoji: "👑",
    element: officerEl,
    ...CAREER[careerTier],
  };

  // This Year — 일간 vs 올해 연간(+이번달 월간 서브라인)
  const yearStem = luck.yearPillar[0];
  const monthStem = luck.monthPillar[0];
  const yearRel = stemRelation(dmStem, yearStem);
  const monthRel = stemRelation(dmStem, monthStem);
  const time: FortuneCard = {
    key: "time",
    title: "This Year",
    emoji: "✨",
    element: elementOf(yearStem),
    ...TIME[yearRel],
    subLine: `This month: ${TIME_MONTH[monthRel]}`,
  };

  return [money, love, career, time];
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/fortune.test.ts`
Expected: PASS (9개).

> 참고: `i-generate` 케이스 테스트(woody, 甲 일간 + 丙年)에서 wood→fire는 `WUXING_PRODUCE[wood]==="fire"`이므로 `i-generate` → "Giving"이 맞다. combo 우선순위가 위라서 甲+丙(비합)은 combo 아님.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fortune.ts src/lib/fortune.test.ts
git commit -m "feat(fortune): rule-based fortune engine (money/love/career/time)"
```

---

## Task 5: `FortuneCard` 컴포넌트

**Files:**
- Create: `src/components/fortune/fortune-card.tsx`

> 순수 프레젠테이션. 단독 테스트는 Section 테스트(Task 6)에서 함께 커버.

- [ ] **Step 1: 구현**

`src/components/fortune/fortune-card.tsx` 생성:

```tsx
import { WUXING_META } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { FortuneCard as FortuneCardData } from "@/lib/fortune";

// 정적 오행 색 클래스 (Tailwind v4 JIT 스캔용 리터럴) — wuxing-balance.tsx와 동일 패턴.
const ACCENT: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

/** 운세 카드 1개 (제목·이모지·tier 배지·fun 라인). */
export function FortuneCard({ card }: { card: FortuneCardData }) {
  const meta = WUXING_META[card.element];
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {card.emoji} {card.title}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[card.element]}`}
          title={meta.label}
        >
          {card.tierLabel}
        </span>
      </div>
      <p className="text-sm leading-snug">{card.line}</p>
      {card.subLine && (
        <p className="text-xs text-muted-foreground">{card.subLine}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/components/fortune/fortune-card.tsx
git commit -m "feat(fortune): FortuneCard presentational component"
```

---

## Task 6: `FortuneSection` 컨테이너 + RTL 테스트

**Files:**
- Create: `src/components/fortune/fortune-section.tsx`
- Test: `src/components/fortune/fortune-section.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/fortune/fortune-section.test.tsx` 생성:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneSection } from "./fortune-section";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneSection", () => {
  it("운세 4카드 제목을 렌더한다", () => {
    render(<FortuneSection userSaju={RM} luck={LUCK} />);
    expect(screen.getByText(/Money/)).toBeInTheDocument();
    expect(screen.getByText(/Love/)).toBeInTheDocument();
    expect(screen.getByText(/Career/)).toBeInTheDocument();
    expect(screen.getByText(/This Year/)).toBeInTheDocument();
  });

  it("Share 티저 버튼은 비활성(disabled)이다", () => {
    render(<FortuneSection userSaju={RM} luck={LUCK} />);
    const share = screen.getByRole("button", { name: /share/i });
    expect(share).toBeDisabled();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/fortune/fortune-section.test.tsx`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`src/components/fortune/fortune-section.tsx` 생성:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { FortuneCard } from "./fortune-card";
import { calcFortune } from "@/lib/fortune";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

/**
 * '내 사주' 뷰 안의 운세 섹션. calcFortune → 4카드 그리드 + 비활성 Share 티저.
 * 실제 공유(이미지 export)는 후속 공통기반 사이클.
 */
export function FortuneSection({
  userSaju,
  luck,
}: {
  userSaju: UserSaju;
  luck: CurrentLuck;
}) {
  const cards = calcFortune(userSaju, luck);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Your Fortune · 운세
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <FortuneCard key={card.key} card={card} />
        ))}
      </div>

      <div className="space-y-1 text-center">
        <Button variant="outline" size="sm" disabled className="w-full">
          Share ☮ (soon)
        </Button>
        <p className="text-[10px] text-muted-foreground">For entertainment 🌙</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/fortune/fortune-section.test.tsx`
Expected: PASS (2개).

- [ ] **Step 5: Commit**

```bash
git add src/components/fortune/fortune-section.tsx src/components/fortune/fortune-section.test.tsx
git commit -m "feat(fortune): FortuneSection container with disabled share teaser"
```

---

## Task 7: `SajuResult` + `page.tsx` 통합

**Files:**
- Modify: `src/components/saju/saju-result.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `SajuResult`에 FortuneSection 삽입**

`src/components/saju/saju-result.tsx` 수정:

import 추가(`CompatibilitySection` import 아래):
```tsx
import { FortuneSection } from "@/components/fortune/fortune-section";
```
import 추가(`KSTResult` import 아래):
```tsx
import type { CurrentLuck } from "@/lib/saju-types";
```

`SajuResultProps` 타입에 `currentLuck` 추가:
```tsx
type SajuResultProps = {
  userSaju: UserSaju;
  kst: KSTResult;
  currentLuck: CurrentLuck;
  onEdit: () => void;
};
```

함수 시그니처 구조분해도 수정:
```tsx
export function SajuResult({ userSaju, kst, currentLuck, onEdit }: SajuResultProps) {
```

오행 밸런스 `</section>`(주석 "오행 밸런스" 섹션의 닫는 태그)와 "KST · 12지지 · fun fact" 섹션 사이에 삽입:
```tsx
      {/* 운세 (Your Fortune) */}
      <FortuneSection userSaju={userSaju} luck={currentLuck} />
```

> 배치: [4기둥 → 일간 → 오행 → **운세** → KST/funfact → 궁합 → Edit] 순.

- [ ] **Step 2: `page.tsx`에서 calcCurrentLuck 호출 + 전달**

`src/app/page.tsx` 수정:

import 수정:
```tsx
import { calcUserSaju, calcCurrentLuck } from "@/app/actions/saju";
```
타입 import 수정(`UserSaju` import을 다음으로):
```tsx
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";
```

state 추가(`kst` state 아래):
```tsx
  const [currentLuck, setCurrentLuck] = useState<CurrentLuck | null>(null);
```

`handleSubmit` 내부의 saju 계산 부분을 병렬 호출로 수정:
```tsx
      const kstResult = convertToKST(data);
      const [saju, luck] = await Promise.all([
        calcUserSaju(data),
        calcCurrentLuck(),
      ]);
      setKst(kstResult);
      setUserSaju(saju);
      setCurrentLuck(luck);
      setView("result");
```

결과 뷰 분기 조건과 SajuResult 호출 수정. 기존:
```tsx
            {view === "form" || !userSaju || !kst ? (
```
을:
```tsx
            {view === "form" || !userSaju || !kst || !currentLuck ? (
```
로, 그리고 SajuResult 사용처:
```tsx
                <SajuResult
                  userSaju={userSaju}
                  kst={kst}
                  currentLuck={currentLuck}
                  onEdit={() => setView("form")}
                />
```

- [ ] **Step 3: 타입체크 + 전체 테스트 회귀**

Run: `npx tsc --noEmit; npx vitest run`
Expected: tsc 에러 없음. 전체 테스트 PASS (기존 111 + dateToLuck 2 + fortune 9 + fortune-section 2 = 124개 내외, 모두 통과).

- [ ] **Step 4: 빌드 회귀**

Run: `npx next build`
Expected: 빌드 성공. (calcCurrentLuck은 서버액션이라 클라 번들·static 영향 없음.)

- [ ] **Step 5: Commit**

```bash
git add src/components/saju/saju-result.tsx src/app/page.tsx
git commit -m "feat(fortune): wire FortuneSection into saju result view"
```

---

## Task 8: 수동 시각 검증 + 문서 갱신

**Files:**
- Modify: `task-log.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 수동 시각 검증 (사용자 협조)**

`npm run dev` 후 시크릿 창에서:
1. 생일 입력(예: 1992-09-12, NY) → 제출
2. 결과 뷰에 "Your Fortune · 운세" 섹션이 오행과 KST 사이에 노출
3. Money / Love / Career / This Year 4카드 + 각 tier 배지 + fun 라인
4. This Year 카드에 "This month: …" 서브라인
5. "Share ☮ (soon)" 버튼 비활성
6. 다크 모드 토글 → 카드 색 대비 정상
7. 모바일 viewport → 2열 그리드

- [ ] **Step 2: 검증 회귀**

Run: `npx vitest run; npx tsc --noEmit; npx eslint .`
Expected: 전체 PASS, tsc 0 에러, eslint 기존 경고 외 신규 0.

- [ ] **Step 3: task-log.md + CLAUDE.md 갱신**

`task-log.md`에 "사이클 9: Fun 운세 리딩 — 완료 ✅" 항목 추가(구현 결과·커밋·결정 요약). `CLAUDE.md` 로드맵 step 10을 ✅로, 사주 흐름 섹션에 fortune.ts/calcCurrentLuck 추가 언급.

- [ ] **Step 4: Commit**

```bash
git add task-log.md CLAUDE.md
git commit -m "docs: mark cycle 9 complete (fun fortune reading)"
```

---

## Self-Review (작성자 체크 결과)

**Spec 커버리지:**
- fortune.ts 4카드 규칙 → Task 4 ✅
- calcCurrentLuck (manseryeok 재사용) → Task 2+3 ✅
- fortune-section/card → Task 5+6 ✅
- SajuResult 삽입 위치(오행↔궁합 사이) → Task 7 ✅
- page.tsx 전달 → Task 7 ✅
- 비활성 Share 티저 → Task 6 ✅
- 테스트(node + RTL) → Task 4/6 ✅
- 부정 표현 금지 톤(0개도 긍정) → MONEY/CAREER none 레이블 긍정 프레이밍 ✅
- STEM_COMBO 단일 출처 → Task 1 ✅

**Placeholder 스캔:** 모든 코드 블록 실제 구현 포함. TBD/TODO 없음.

**타입 일관성:** `FortuneCard`/`CurrentLuck`/`FortuneKey` 시그니처가 Task 1·4·5·6·7에서 일관. `calcFortune(userSaju, luck)` 인자 순서 전 Task 동일. `dateToLuck(now)` Task 2 정의 = Task 3 사용 일치.

**비범위 확인:** 이미지 export/멀티페이지/인연/LLM 제외 — Task에 없음(의도대로).
