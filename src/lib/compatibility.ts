// ============================================================
// KSaju 궁합 계산 엔진 (src/lib/compatibility.ts)
// 명리학 규칙 기반 · fun 지향
//
// 입력: 두 사람의 사주 (year/month/day 천간지지 한자 문자열)
// 출력: 0-100 점수 + fun 레이블 + breakdown
// 주의: "깊은 해석"이 아니라 "재밌는 궁합 점수". 짧은 리딩은 LLM이 별도 생성.
// ============================================================

import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  WUXING_PRODUCE,
  WUXING_CONTROL,
  STEM_COMBO,
} from "./saju-data";
import type { WuXing } from "./saju-types";

/** 한 사람의 사주 (각 기둥은 2글자 한자: 천간+지지, 예 "甲辰") */
export interface SajuPillars {
  year: string; // 예 "壬申"
  month: string; // 예 "己酉"
  day: string; // 예 "辛卯"  ← day[0]이 일간(Day Master)
}

export type DayMasterType =
  | "combo"
  | "clash"
  | "same"
  | "generate"
  | "control"
  | "neutral";

export type BranchType =
  | "three-harmony"
  | "six-harmony"
  | "same"
  | "clash"
  | "neutral";

export interface CompatibilityResult {
  score: number; // 0-100
  label: string; // fun 레이블 (예 "Steamy chemistry 🔥💧")
  breakdown: {
    dayMaster: { score: number; type: DayMasterType; note: string };
    elementBalance: { score: number };
    branch: { score: number; type: BranchType; note: string };
  };
}

// --- 한자 → 오행 (saju-data에서 derive, 중복 정의 회피) ---
const STEM_ELEMENT: Record<string, WuXing> = Object.fromEntries(
  HEAVENLY_STEMS.map((s) => [s.char, s.element]),
);
const BRANCH_ELEMENT: Record<string, WuXing> = Object.fromEntries(
  EARTHLY_BRANCHES.map((b) => [b.char, b.element]),
);

// --- 천간 충(충돌) ---
const STEM_CLASH: [string, string][] = [
  ["甲", "庚"],
  ["乙", "辛"],
  ["丙", "壬"],
  ["丁", "癸"],
];

// --- 지지 합(육합/삼합) / 충 ---
const SIX_HARMONY: [string, string][] = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];
const THREE_HARMONY: string[][] = [
  ["申", "子", "辰"],
  ["巳", "酉", "丑"],
  ["寅", "午", "戌"],
  ["亥", "卯", "未"],
];
const BRANCH_CLASH: [string, string][] = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

const inPairs = (
  a: string,
  b: string,
  list: readonly (readonly [string, string])[],
) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const inTrio = (a: string, b: string, list: string[][]) =>
  list.some((t) => t.includes(a) && t.includes(b) && a !== b);

// === 1. 일간 궁합 (Day Master) : 최대 40점 ===
function dayMasterScore(dm1: string, dm2: string) {
  const e1 = STEM_ELEMENT[dm1];
  const e2 = STEM_ELEMENT[dm2];
  if (inPairs(dm1, dm2, STEM_COMBO))
    return {
      score: 40,
      type: "combo" as const,
      note: "Magnetic attraction (천간합)",
    };
  if (inPairs(dm1, dm2, STEM_CLASH))
    return {
      score: 15,
      type: "clash" as const,
      note: "Volatile spark (천간충)",
    };
  if (e1 === e2)
    return {
      score: 28,
      type: "same" as const,
      note: "Kindred spirits (비화)",
    };
  if (WUXING_PRODUCE[e1] === e2 || WUXING_PRODUCE[e2] === e1)
    return {
      score: 34,
      type: "generate" as const,
      note: "One nurtures the other (상생)",
    };
  if (WUXING_CONTROL[e1] === e2 || WUXING_CONTROL[e2] === e1)
    return {
      score: 20,
      type: "control" as const,
      note: "Push-and-pull tension (상극)",
    };
  return {
    score: 24,
    type: "neutral" as const,
    note: "Easygoing balance",
  };
}

// === 2. 오행 밸런스 (Five Element complement) : 최대 30점 ===
// 두 사람의 6기둥(천간+지지 12원소)이 오행을 얼마나 골고루 채우는지
function elementBalanceScore(p1: SajuPillars, p2: SajuPillars) {
  const all: WuXing[] = [];
  for (const p of [p1, p2]) {
    for (const pillar of [p.year, p.month, p.day]) {
      all.push(STEM_ELEMENT[pillar[0]], BRANCH_ELEMENT[pillar[1]]);
    }
  }
  const counts: Record<WuXing, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  all.forEach((e) => counts[e]++);
  const distinct = Object.values(counts).filter((c) => c > 0).length; // 0-5
  const mean = all.length / 5;
  const variance =
    Object.values(counts).reduce((s, v) => s + (v - mean) ** 2, 0) / 5;
  const evenness = Math.max(0, 1 - variance / 8); // 0-1
  return { score: Math.round((distinct / 5) * 18 + evenness * 12) };
}

// === 3. 지지 궁합 (일지 Branch) : 최대 30점 ===
function branchScore(p1: SajuPillars, p2: SajuPillars) {
  const b1 = p1.day[1];
  const b2 = p2.day[1];
  if (inTrio(b1, b2, THREE_HARMONY))
    return {
      score: 30,
      type: "three-harmony" as const,
      note: "Deep harmony (삼합)",
    };
  if (inPairs(b1, b2, SIX_HARMONY))
    return {
      score: 28,
      type: "six-harmony" as const,
      note: "Natural fit (육합)",
    };
  if (b1 === b2)
    return { score: 22, type: "same" as const, note: "Same wavelength" };
  if (inPairs(b1, b2, BRANCH_CLASH))
    return {
      score: 11,
      type: "clash" as const,
      note: "Opposites collide (충)",
    };
  return {
    score: 18,
    type: "neutral" as const,
    note: "Comfortable distance",
  };
}

// === fun 레이블 (두 사람 일간 오행 조합) ===
function funLabel(dm1: string, dm2: string): string {
  const e1 = STEM_ELEMENT[dm1];
  const e2 = STEM_ELEMENT[dm2];
  const key = [e1, e2].sort().join("-");
  const labels: Record<string, string> = {
    "fire-water": "Steamy chemistry 🔥💧",
    "fire-wood": "You fuel their fire 🌳🔥",
    "earth-fire": "Warm & grounding 🔥🏔️",
    "earth-metal": "Grounded power couple 🏔️⚙️",
    "metal-water": "Cool, deep & clear ⚙️💧",
    "water-wood": "Quiet growth together 💧🌳",
    "metal-wood": "Sharp tension, strong pull ⚙️🌳",
    "earth-water": "Steady & flowing 🏔️💧",
    "fire-metal": "Intense & refining 🔥⚙️",
    "earth-wood": "Rooted & rising 🌳🏔️",
    "fire-fire": "Double the spark 🔥🔥",
    "water-water": "Two deep souls 💧💧",
    "wood-wood": "Growing side by side 🌳🌳",
    "earth-earth": "Solid as mountains 🏔️🏔️",
    "metal-metal": "Sleek & unstoppable ⚙️⚙️",
  };
  return labels[key] || "A one-of-a-kind bond ✨";
}

/**
 * 두 사람의 사주로 궁합 점수(0-100) + fun 레이블 + breakdown 계산.
 * @param me   사용자 사주 (year/month/day 한자)
 * @param idol 아이돌 사주 (ksaju-idol-db.json의 saju를 {year,month,day} 한자 문자열로 정규화해서 전달)
 */
export function calcCompatibility(
  me: SajuPillars,
  idol: SajuPillars,
): CompatibilityResult {
  const dm = dayMasterScore(me.day[0], idol.day[0]);
  const eb = elementBalanceScore(me, idol);
  const br = branchScore(me, idol);
  return {
    score: dm.score + eb.score + br.score, // 0-100
    label: funLabel(me.day[0], idol.day[0]),
    breakdown: {
      dayMaster: dm,
      elementBalance: eb,
      branch: br,
    },
  };
}

/**
 * ksaju-idol-db.json의 saju({year:{hanja},...}) → SajuPillars(한자 문자열) 정규화 헬퍼
 */
export function normalizeIdolSaju(saju: {
  year: { hanja: string };
  month: { hanja: string };
  day: { hanja: string };
}): SajuPillars {
  return {
    year: saju.year.hanja,
    month: saju.month.hanja,
    day: saju.day.hanja,
  };
}
