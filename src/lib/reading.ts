import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { WuXing } from "./saju-types";
import type { SajuPillars } from "./compatibility";

const STEM_ELEMENT: Record<string, WuXing> = Object.fromEntries(
  HEAVENLY_STEMS.map((s) => [s.char, s.element]),
);

type ScoreTier = "high" | "mid" | "low";
type LocaleKey = "en" | "ko" | "ja" | "zh-TW";
const VALID_LOCALES = new Set<string>(["en", "ko", "ja", "zh-TW"]);

const lib = readings as {
  pairs: Record<WuXing, Record<WuXing, Record<LocaleKey, string>>>;
  tiers: Record<ScoreTier, Record<LocaleKey, string>>;
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
  locale = "en",
): string {
  const myEl = STEM_ELEMENT[mePillars.day[0]];
  const theirEl = STEM_ELEMENT[otherPillars.day[0]];
  const locKey = (VALID_LOCALES.has(locale) ? locale : "en") as LocaleKey;
  const pairLine = lib.pairs[myEl][theirEl][locKey];
  return `${pairLine} ${lib.tiers[tierOf(score)][locKey]}`;
}
