import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { WuXing } from "./saju-types";
import type { SajuPillars } from "./compatibility";

// 천간 한자 → 오행 (compatibility.ts의 STEM_ELEMENT는 private이라 동일 소스에서 재파생).
const STEM_ELEMENT: Record<string, WuXing> = Object.fromEntries(
  HEAVENLY_STEMS.map((s) => [s.char, s.element]),
);

type ScoreTier = "high" | "mid" | "low";

const lib = readings as {
  pairs: Record<WuXing, Record<WuXing, string>>;
  tiers: Record<ScoreTier, string>;
};

function tierOf(score: number): ScoreTier {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

/**
 * Deterministic 2-3 line fun reading for a compatibility pair.
 * Keyed on (my day-master element × their day-master element × score tier).
 */
export function getReading(
  mePillars: SajuPillars,
  otherPillars: SajuPillars,
  score: number,
): string {
  const myEl = STEM_ELEMENT[mePillars.day[0]];
  const theirEl = STEM_ELEMENT[otherPillars.day[0]];
  const pairLine = lib.pairs[myEl][theirEl];
  return `${pairLine} ${lib.tiers[tierOf(score)]}`;
}
