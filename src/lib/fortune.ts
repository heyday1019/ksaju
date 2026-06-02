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
import type { WuXing, HeavenlyStem, UserSaju, CurrentLuck } from "./saju-types";

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

// HeavenlyStem 키로 강제 → 10천간 완전성을 컴파일 타임에 보장(누락 시 tsc 에러).
const LOVE: Record<HeavenlyStem, { tierLabel: string; line: string }> = {
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

  // Love — 일간 천간 아키타입 (dayMaster는 string 타입이라 cast)
  const loveEntry = LOVE[dmStem as HeavenlyStem];
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
