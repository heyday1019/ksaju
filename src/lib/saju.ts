// ============================================================
// KSaju 사용자 사주 변환 (src/lib/saju.ts)
//
// BirthData → KST 일시(convertToKST) → manseryeok(calculateSaju) → UserSaju
// manseryeok(~300KB)을 import 하므로 server-only. Server Action에서만 사용.
// ============================================================
import "server-only";

import { calculateSaju } from "@fullstackfamily/manseryeok";
import { formatInTimeZone } from "date-fns-tz";
import { convertToKST } from "./kst-converter";
import type { BirthData } from "./kst-types";
import type { UserSaju, CurrentLuck } from "./saju-types";
import type { SajuPillars } from "./compatibility";

/**
 * 사용자 생일(현지 시각·타임존) → 한국식 사주 4기둥(한자).
 *
 * 사주는 KST 기준으로 계산해야 하므로 먼저 convertToKST로 KST 일시를 구한 뒤
 * manseryeok에 넘긴다(CLAUDE.md 흐름도). 출생시각 미입력 시 hour pillar는 null.
 * 진태양시 보정은 manseryeok 기본값(서울 127°, 시주에만 영향)을 사용.
 */
export function birthToSaju(birth: BirthData): UserSaju {
  const { kst } = convertToKST(birth);
  const saju = calculateSaju(
    kst.year,
    kst.month,
    kst.day,
    kst.hour ?? undefined,
    kst.minute ?? undefined,
  );
  return {
    pillars: {
      year: saju.yearPillarHanja,
      month: saju.monthPillarHanja,
      day: saju.dayPillarHanja,
      hour: saju.hourPillarHanja,
    },
    dayMaster: saju.dayPillarHanja[0],
    isTimeCorrected: saju.isTimeCorrected,
  };
}

/** UserSaju → 궁합 엔진 입력(year/month/day 3기둥). 시주는 궁합에 쓰지 않음. */
export function toCompatPillars(saju: UserSaju): SajuPillars {
  return {
    year: saju.pillars.year,
    month: saju.pillars.month,
    day: saju.pillars.day,
  };
}

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
