import type { BirthData } from "./kst-types";

export type HeavenlyStem =
  | "甲" | "乙" | "丙" | "丁" | "戊"
  | "己" | "庚" | "辛" | "壬" | "癸";

export type EarthlyBranch =
  | "子" | "丑" | "寅" | "卯" | "辰" | "巳"
  | "午" | "未" | "申" | "酉" | "戌" | "亥";

export type WuXing = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";

export type SipSin =
  | "bigyeon"    // 比肩
  | "geopjae"    // 劫財
  | "sikshin"    // 食神
  | "sanggwan"   // 傷官
  | "pyeonjae"   // 偏財
  | "jeongjae"   // 正財
  | "pyeongwan"  // 偏官
  | "jeonggwan"  // 正官
  | "pyeonin"    // 偏印
  | "jeongin";   // 正印

export type StemInfo = {
  char: HeavenlyStem;
  ko: string;             // "갑"
  element: WuXing;
  yinYang: YinYang;
};

export type BranchInfo = {
  char: EarthlyBranch;
  ko: string;             // "자"
  element: WuXing;
  yinYang: YinYang;
  primaryHiddenStem: HeavenlyStem;  // 지지장간 본기
};

export type SajuPillar = {
  position: "year" | "month" | "day" | "hour";
  stem: StemInfo & { sipSin: SipSin | null };  // 일주 stem은 null
  branch: BranchInfo & { sipSin: SipSin };
};

export type DayMaster = {
  stem: HeavenlyStem;
  ko: string;
  element: WuXing;
  yinYang: YinYang;
  keyword: string;        // "Yin Wood — flexible, growing"
};

export type SajuResult = {
  source: {
    birthLocal: BirthData;
    kstLabel: string;     // "1999년 3월 16일 04:30 KST"
    timeKnown: boolean;
  };
  pillars: {
    year: SajuPillar;
    month: SajuPillar;
    day: SajuPillar;
    hour: SajuPillar | null;   // 시각 unknown → null
  };
  dayMaster: DayMaster;
  wuXingBalance: Record<WuXing, number>;
};

export type SipSinLabels = {
  hanja: string;          // "正官"
  ko: string;             // "정관"
  en: string;             // "Direct Officer"
};

/**
 * manseryeok 변환 결과(사용자 사주). 궁합 me-측 입력 + 공유카드 사주미니용.
 * 위의 풍부한 `SajuResult`(보류된 자체계산 사이클)와는 별개의 경량 타입.
 * 클라이언트는 manseryeok import 없이 이 타입만 `import type` 한다.
 */
export type UserSaju = {
  pillars: {
    year: string; // 예 "壬申"
    month: string; // 예 "己酉"
    day: string; // 예 "辛卯"  ← day[0] = 일간(Day Master)
    hour: string | null; // 출생시각 unknown → null
  };
  dayMaster: string; // 일간 한자 (day[0])
  isTimeCorrected: boolean; // 진태양시 보정 적용 여부
};

/**
 * 현재 시점의 세운(연주)/월운(월주) 간지. fortune.ts가 'This Year' 카드 계산에 사용.
 * 시각 무관(절기/입춘은 날짜 기준)이므로 서버에서 오늘 KST 정오 기준으로 산출.
 */
export type CurrentLuck = {
  yearPillar: string; // 예 "丙午"
  monthPillar: string; // 예 "癸巳"
};
