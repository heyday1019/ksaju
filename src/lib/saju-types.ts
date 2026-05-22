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
