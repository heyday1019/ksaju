// ============================================================
// KSaju 운세 엔진 (src/lib/fortune.ts)
// 규칙기반·짧고 fun · 클라이언트 안전 (manseryeok 미포함)
//
// 입력: UserSaju(한자 기둥) + CurrentLuck(세운/월운) + locale
// 출력: 4개 FortuneCard (Money / Love / Career / This Year)
// 주의: "깊은 리딩" 아님. 십신(十神) lite 규칙 → fun 다국어 테이블. LLM 미사용.
// ============================================================
import { WUXING_PRODUCE, WUXING_CONTROL, STEM_COMBO } from "./saju-data";
import { elementOf, wuxingBalance } from "./saju-display";
import type { WuXing, HeavenlyStem, UserSaju, CurrentLuck } from "./saju-types";
import i18n from "../../data/ksaju-fortune-i18n.json";

export type FortuneKey = "money" | "love" | "career" | "time";

export interface FortuneCard {
  key: FortuneKey;
  emoji: string;
  element: WuXing;
  tierLabel: string;
  line: string;
  subLine?: string;
}

const inPairs = (
  a: string,
  b: string,
  list: readonly (readonly [string, string])[],
) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

type Tier = "none" | "some" | "strong";
function tierOf(count: number): Tier {
  if (count === 0) return "none";
  if (count <= 2) return "some";
  return "strong";
}

function controllerOf(el: WuXing): WuXing {
  const found = (Object.keys(WUXING_CONTROL) as WuXing[]).find(
    (k) => WUXING_CONTROL[k] === el,
  );
  return found!;
}

export type TimeRel = "combo" | "same" | "generate-me" | "i-generate" | "control" | "neutral";

export function stemRelation(dmStem: string, otherStem: string): TimeRel {
  if (inPairs(dmStem, otherStem, STEM_COMBO)) return "combo";
  const e1 = elementOf(dmStem);
  const e2 = elementOf(otherStem);
  if (e1 === e2) return "same";
  if (WUXING_PRODUCE[e2] === e1) return "generate-me";
  if (WUXING_PRODUCE[e1] === e2) return "i-generate";
  if (WUXING_CONTROL[e1] === e2 || WUXING_CONTROL[e2] === e1) return "control";
  return "neutral";
}

type LocaleKey = "en" | "ko" | "ja" | "zh-TW";
const VALID_LOCALES = new Set<string>(["en", "ko", "ja", "zh-TW"]);

function loc(locale: string): LocaleKey {
  return (VALID_LOCALES.has(locale) ? locale : "en") as LocaleKey;
}

/**
 * 사용자 사주 + 현재 세운/월운 → 4개 fun 운세 카드.
 * @param userSaju manseryeok 변환 결과(일간·기둥)
 * @param luck     현재 연주/월주 (calcCurrentLuck)
 * @param locale   표시 언어 (기본 "en")
 */
export function calcFortune(userSaju: UserSaju, luck: CurrentLuck, locale = "en"): FortuneCard[] {
  const l = loc(locale);
  const dmStem = userSaju.dayMaster;
  const dmEl = elementOf(dmStem);
  const balance = wuxingBalance(userSaju);

  // Money — 재성(일간이 극하는 오행)
  const wealthEl = WUXING_CONTROL[dmEl];
  const moneyTier = tierOf(balance[wealthEl]);
  const moneyData = i18n.money[moneyTier];
  const money: FortuneCard = {
    key: "money",
    emoji: "💰",
    element: wealthEl,
    tierLabel: moneyData.tierLabel[l],
    line: moneyData.line[l],
  };

  // Love — 일간 천간 아키타입
  const loveData = (i18n.love as Record<string, { tierLabel: Record<string, string>; line: Record<string, string> }>)[dmStem];
  const love: FortuneCard = {
    key: "love",
    emoji: "💘",
    element: dmEl,
    tierLabel: loveData.tierLabel[l],
    line: loveData.line[l],
  };

  // Career — 관성(일간을 극하는 오행)
  const officerEl = controllerOf(dmEl);
  const careerTier = tierOf(balance[officerEl]);
  const careerData = i18n.career[careerTier];
  const career: FortuneCard = {
    key: "career",
    emoji: "👑",
    element: officerEl,
    tierLabel: careerData.tierLabel[l],
    line: careerData.line[l],
  };

  // This Year — 일간 vs 올해 연간(+이번달 월간 서브라인)
  const yearStem = luck.yearPillar[0];
  const monthStem = luck.monthPillar[0];
  const yearRel = stemRelation(dmStem, yearStem);
  const monthRel = stemRelation(dmStem, monthStem);
  const timeData = i18n.time[yearRel];
  const monthSubLine = i18n.time[monthRel].subLine[l];
  const prefix = i18n.thisMonthPrefix[l];
  const time: FortuneCard = {
    key: "time",
    emoji: "✨",
    element: elementOf(yearStem),
    tierLabel: timeData.tierLabel[l],
    line: timeData.line[l],
    subLine: `${prefix} ${monthSubLine}`,
  };

  return [money, love, career, time];
}
