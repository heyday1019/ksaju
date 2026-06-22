import type {
  HeavenlyStem,
  EarthlyBranch,
  WuXing,
  YinYang,
  SipSin,
  StemInfo,
  BranchInfo,
  SipSinLabels,
} from "./saju-types";

// 천간 10 — 순서대로 0..9 인덱스
export const HEAVENLY_STEMS: readonly StemInfo[] = [
  { char: "甲", ko: "갑", element: "wood",  yinYang: "yang" },
  { char: "乙", ko: "을", element: "wood",  yinYang: "yin"  },
  { char: "丙", ko: "병", element: "fire",  yinYang: "yang" },
  { char: "丁", ko: "정", element: "fire",  yinYang: "yin"  },
  { char: "戊", ko: "무", element: "earth", yinYang: "yang" },
  { char: "己", ko: "기", element: "earth", yinYang: "yin"  },
  { char: "庚", ko: "경", element: "metal", yinYang: "yang" },
  { char: "辛", ko: "신", element: "metal", yinYang: "yin"  },
  { char: "壬", ko: "임", element: "water", yinYang: "yang" },
  { char: "癸", ko: "계", element: "water", yinYang: "yin"  },
] as const;

// 지지 12 — 子 = idx 0
export const EARTHLY_BRANCHES: readonly BranchInfo[] = [
  { char: "子", ko: "자", element: "water", yinYang: "yang", primaryHiddenStem: "癸" },
  { char: "丑", ko: "축", element: "earth", yinYang: "yin",  primaryHiddenStem: "己" },
  { char: "寅", ko: "인", element: "wood",  yinYang: "yang", primaryHiddenStem: "甲" },
  { char: "卯", ko: "묘", element: "wood",  yinYang: "yin",  primaryHiddenStem: "乙" },
  { char: "辰", ko: "진", element: "earth", yinYang: "yang", primaryHiddenStem: "戊" },
  { char: "巳", ko: "사", element: "fire",  yinYang: "yin",  primaryHiddenStem: "丙" },
  { char: "午", ko: "오", element: "fire",  yinYang: "yang", primaryHiddenStem: "丁" },
  { char: "未", ko: "미", element: "earth", yinYang: "yin",  primaryHiddenStem: "己" },
  { char: "申", ko: "신", element: "metal", yinYang: "yang", primaryHiddenStem: "庚" },
  { char: "酉", ko: "유", element: "metal", yinYang: "yin",  primaryHiddenStem: "辛" },
  { char: "戌", ko: "술", element: "earth", yinYang: "yang", primaryHiddenStem: "戊" },
  { char: "亥", ko: "해", element: "water", yinYang: "yin",  primaryHiddenStem: "壬" },
] as const;

// 천간 char → index 룩업
export const STEM_INDEX: Record<HeavenlyStem, number> = Object.freeze(
  HEAVENLY_STEMS.reduce((acc, s, i) => ({ ...acc, [s.char]: i }), {} as Record<HeavenlyStem, number>)
);
export const BRANCH_INDEX: Record<EarthlyBranch, number> = Object.freeze(
  EARTHLY_BRANCHES.reduce((acc, b, i) => ({ ...acc, [b.char]: i }), {} as Record<EarthlyBranch, number>)
);

// 오행 생(生) cycle: 木→火→土→金→水→木
export const WUXING_PRODUCE: Record<WuXing, WuXing> = {
  wood:  "fire",
  fire:  "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

// 오행 극(剋) cycle: 木→土→水→火→金→木
export const WUXING_CONTROL: Record<WuXing, WuXing> = {
  wood:  "earth",
  earth: "water",
  water: "fire",
  fire:  "metal",
  metal: "wood",
};

// 五虎遁(오호둔) — 년간 → 寅月(1번 사주월) 시작 천간
// 甲己之年 丙寅頭 · 乙庚之年 戊寅頭 · 丙辛之年 庚寅頭 · 丁壬之年 壬寅頭 · 戊癸之年 甲寅頭
export const OHO_DUN: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

// 五鼠遁(오서둔) — 일간 → 子時 시작 천간
// 甲己日 甲子時 · 乙庚日 丙子時 · 丙辛日 戊子時 · 丁壬日 庚子時 · 戊癸日 壬子時
export const OSEO_DUN: Record<HeavenlyStem, HeavenlyStem> = {
  甲: "甲", 己: "甲",
  乙: "丙", 庚: "丙",
  丙: "戊", 辛: "戊",
  丁: "庚", 壬: "庚",
  戊: "壬", 癸: "壬",
};

// 천간 합(끌림) — 5쌍. 궁합·운세 양쪽에서 재사용하는 단일 출처.
// 甲己 · 乙庚 · 丙辛 · 丁壬 · 戊癸
export const STEM_COMBO: readonly [HeavenlyStem, HeavenlyStem][] = [
  ["甲", "己"],
  ["乙", "庚"],
  ["丙", "辛"],
  ["丁", "壬"],
  ["戊", "癸"],
] as const;

// 일간 keyword — 사주 페이지 DayMasterCard에서 사용
export const DAY_MASTER_KEYWORDS: Record<HeavenlyStem, string> = {
  甲: "Yang Wood — a tall tree, upright and resolute",
  乙: "Yin Wood — flexible vine, gentle but persistent",
  丙: "Yang Fire — the sun, radiant and outgoing",
  丁: "Yin Fire — a candle flame, warm and intimate",
  戊: "Yang Earth — a mountain, grounded and steady",
  己: "Yin Earth — fertile soil, nurturing and adaptable",
  庚: "Yang Metal — raw iron, decisive and tough",
  辛: "Yin Metal — refined jewelry, precise and elegant",
  壬: "Yang Water — the ocean, expansive and free",
  癸: "Yin Water — gentle rain, intuitive and adaptive",
};

// 십신 라벨 (UI 표시용)
export const SIPSIN_LABELS: Record<SipSin, SipSinLabels> = {
  bigyeon:   { hanja: "比肩", ko: "비견", en: "Friend"          },
  geopjae:   { hanja: "劫財", ko: "겁재", en: "Rival"           },
  sikshin:   { hanja: "食神", ko: "식신", en: "Output (gentle)" },
  sanggwan:  { hanja: "傷官", ko: "상관", en: "Output (bold)"   },
  pyeonjae:  { hanja: "偏財", ko: "편재", en: "Indirect Wealth" },
  jeongjae:  { hanja: "正財", ko: "정재", en: "Direct Wealth"   },
  pyeongwan: { hanja: "偏官", ko: "편관", en: "Indirect Officer"},
  jeonggwan: { hanja: "正官", ko: "정관", en: "Direct Officer"  },
  pyeonin:   { hanja: "偏印", ko: "편인", en: "Indirect Mentor" },
  jeongin:   { hanja: "正印", ko: "정인", en: "Direct Mentor"   },
};

// 12 월령 절기 — 입춘부터 순서대로
// idx i = 寅月 + i (i=0: 寅月, i=1: 卯月, ..., i=11: 丑月)
// 입춘 솔라 longitude = 315°, 경칩 = 345°, 청명 = 15°, 입하 = 45°, ...
export const SOLAR_TERMS_12: readonly string[] = [
  "ipchun",     // 立春 (315°) — 寅月
  "gyeongchip", // 驚蟄 (345°) — 卯月
  "cheongmyeong", // 淸明 (15°) — 辰月
  "ipha",       // 立夏 (45°) — 巳月
  "mangjong",   // 芒種 (75°) — 午月
  "soseo",      // 小暑 (105°) — 未月
  "ipchu",      // 立秋 (135°) — 申月
  "baekro",     // 白露 (165°) — 酉月
  "hanro",      // 寒露 (195°) — 戌月
  "ipdong",     // 立冬 (225°) — 亥月
  "daeseol",    // 大雪 (255°) — 子月
  "sohan",      // 小寒 (285°) — 丑月
] as const;
