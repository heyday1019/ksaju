// ============================================================
// 사주 표시용 헬퍼 (src/lib/saju-display.ts)
// 클라이언트 안전 — saju-data만 import (manseryeok 미포함).
// UserSaju(한자 기둥)를 화면 표시용 오행 정보로 변환.
// ============================================================
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, DAY_MASTER_KEYWORDS } from "./saju-data";
import type { WuXing, HeavenlyStem } from "./saju-types";
import type { UserSaju } from "./saju-types";

// 한자 → 오행 (천간·지지 합본)
const ELEMENT: Record<string, WuXing> = Object.fromEntries([
  ...HEAVENLY_STEMS.map((s) => [s.char, s.element]),
  ...EARTHLY_BRANCHES.map((b) => [b.char, b.element]),
]);

/** 천간/지지 한자 → 오행 */
export function elementOf(char: string): WuXing {
  return ELEMENT[char];
}

// 한자 → 한글 음 (천간·지지 합본)
const KO: Record<string, string> = Object.fromEntries([
  ...HEAVENLY_STEMS.map((s) => [s.char, s.ko]),
  ...EARTHLY_BRANCHES.map((b) => [b.char, b.ko]),
]);

/** 기둥 한자 "辛卯" → 한글 "신묘" */
export function pillarKo(pillar: string): string {
  return (KO[pillar[0]] ?? "") + (KO[pillar[1]] ?? "");
}

/** 오행 → 색 토큰(globals.css `--color-wuxing-*`) + 라벨 메타 */
export const WUXING_META: Record<
  WuXing,
  { token: "mok" | "hwa" | "to" | "geum" | "su"; label: string; hanja: string; emoji: string }
> = {
  wood: { token: "mok", label: "Wood", hanja: "木", emoji: "🌳" },
  fire: { token: "hwa", label: "Fire", hanja: "火", emoji: "🔥" },
  earth: { token: "to", label: "Earth", hanja: "土", emoji: "🏔️" },
  metal: { token: "geum", label: "Metal", hanja: "金", emoji: "⚙️" },
  water: { token: "su", label: "Water", hanja: "水", emoji: "💧" },
};

/** "辛卯" → 천간/지지 각 글자 + 오행 */
export function pillarBreakdown(pillar: string) {
  return {
    stem: { char: pillar[0], element: elementOf(pillar[0]) },
    branch: { char: pillar[1], element: elementOf(pillar[1]) },
  };
}

const EMPTY_BALANCE = (): Record<WuXing, number> => ({
  wood: 0,
  fire: 0,
  earth: 0,
  metal: 0,
  water: 0,
});

/** 가용 기둥(year/month/day + 있으면 hour)의 오행 분포 count */
export function wuxingBalance(saju: UserSaju): Record<WuXing, number> {
  const counts = EMPTY_BALANCE();
  const pillars = [
    saju.pillars.year,
    saju.pillars.month,
    saju.pillars.day,
    saju.pillars.hour,
  ].filter((p): p is string => p !== null);
  for (const pillar of pillars) {
    counts[elementOf(pillar[0])]++;
    counts[elementOf(pillar[1])]++;
  }
  return counts;
}

/** 일간(Day Master) 한자 → 오행 + fun 키워드 */
export function dayMasterInfo(dm: string) {
  return {
    char: dm,
    element: elementOf(dm),
    keyword: DAY_MASTER_KEYWORDS[dm as HeavenlyStem],
  };
}
