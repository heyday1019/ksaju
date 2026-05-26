// ============================================================
// KSaju 사용자 사주 변환 (src/lib/saju.ts)
//
// BirthData → KST 일시(convertToKST) → manseryeok(calculateSaju) → UserSaju
// manseryeok(~300KB)을 import 하므로 server-only. Server Action에서만 사용.
// ============================================================
import "server-only";

import { calculateSaju } from "@fullstackfamily/manseryeok";
import { convertToKST } from "./kst-converter";
import type { BirthData } from "./kst-types";
import type { UserSaju } from "./saju-types";
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
