import { JIZI_HOURS } from "./kst-data";
import type { JiziHour } from "./kst-types";

export function getJiziHour(kstHour: number): JiziHour {
  // 자시(子)는 23-01시 wraparound. (hour + 1) mod 24를 2로 나눈 floor가 인덱스.
  const idx = Math.floor(((kstHour + 1) % 24) / 2);
  return JIZI_HOURS[idx];
}
