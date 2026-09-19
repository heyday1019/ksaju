import { stemRelation, type TimeRel } from "./fortune";
import { DAILY_KO } from "../content/ko/daily";
import type { UserSaju } from "./saju-types";

export type DailyFortune = {
  relation: TimeRel;
  /** 1~5. 관계가 정하며 날짜로 흔들리지 않는다. */
  energy: number;
  message: string;
  luckyColor: string;
};

/** Deterministic 32-bit FNV-1a hash (tarot.ts 와 같은 방식). */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 오늘의 운세 한 줄.
 *
 * 일간과 오늘 일주 천간의 관계로 기운을 정하고, (일간 × 날짜) 해시로 문장과
 * 행운색을 고른다. 같은 사람·같은 날이면 항상 같고, 날이 바뀌면 바뀐다.
 * 외부 통신·LLM 없이 완전히 오프라인으로 결정된다.
 *
 * @param saju      사용자 사주 (일간을 쓴다)
 * @param todayStem 오늘 일주의 천간 (KST 기준)
 * @param dateStr   KST 날짜 `YYYY-MM-DD` — 같은 날 안에서는 결과가 고정된다
 */
export function calcDailyFortune(
  saju: UserSaju,
  todayStem: string,
  dateStr: string,
): DailyFortune {
  const relation = stemRelation(saju.dayMaster, todayStem);
  const entry = DAILY_KO[relation];
  const seed = fnv1a(`${saju.dayMaster}|${dateStr}`);

  return {
    relation,
    energy: entry.energy,
    message: entry.messages[seed % entry.messages.length],
    // 문장과 다른 자리에서 뽑아 둘이 같이 붙어 다니지 않게 한다
    luckyColor: entry.luckyColors[(seed >>> 8) % entry.luckyColors.length],
  };
}
