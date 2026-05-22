import { describe, it, expect } from "vitest";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_INDEX,
  BRANCH_INDEX,
  WUXING_PRODUCE,
  WUXING_CONTROL,
  OHO_DUN,
  OSEO_DUN,
  DAY_MASTER_KEYWORDS,
  SIPSIN_LABELS,
  SOLAR_TERMS_12,
} from "./saju-data";

describe("saju-data — 무결성", () => {
  it("천간 10개, 모두 unique char", () => {
    expect(HEAVENLY_STEMS).toHaveLength(10);
    const chars = HEAVENLY_STEMS.map(s => s.char);
    expect(new Set(chars).size).toBe(10);
  });

  it("지지 12개, 모두 unique char", () => {
    expect(EARTHLY_BRANCHES).toHaveLength(12);
    const chars = EARTHLY_BRANCHES.map(b => b.char);
    expect(new Set(chars).size).toBe(12);
  });

  it("STEM_INDEX 가 올바른 매핑", () => {
    expect(STEM_INDEX["甲"]).toBe(0);
    expect(STEM_INDEX["癸"]).toBe(9);
  });

  it("BRANCH_INDEX 가 올바른 매핑", () => {
    expect(BRANCH_INDEX["子"]).toBe(0);
    expect(BRANCH_INDEX["亥"]).toBe(11);
  });

  it("오행 생 cycle은 5개 element를 한 바퀴 돈다", () => {
    let current: keyof typeof WUXING_PRODUCE = "wood";
    const visited = new Set<string>([current]);
    for (let i = 0; i < 5; i++) {
      current = WUXING_PRODUCE[current];
      visited.add(current);
    }
    expect(visited.size).toBe(5);
    expect(current).toBe("wood");
  });

  it("오행 극 cycle은 5개 element를 한 바퀴 돈다", () => {
    let current: keyof typeof WUXING_CONTROL = "wood";
    const visited = new Set<string>([current]);
    for (let i = 0; i < 5; i++) {
      current = WUXING_CONTROL[current];
      visited.add(current);
    }
    expect(visited.size).toBe(5);
    expect(current).toBe("wood");
  });

  it("OHO_DUN 10개 천간 모두 매핑", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(OHO_DUN[s.char]).toBeDefined();
    });
  });

  it("OSEO_DUN 10개 천간 모두 매핑", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(OSEO_DUN[s.char]).toBeDefined();
    });
  });

  it("DAY_MASTER_KEYWORDS 10개 천간 모두 매핑, 빈 문자열 없음", () => {
    HEAVENLY_STEMS.forEach(s => {
      expect(DAY_MASTER_KEYWORDS[s.char]).toBeTruthy();
    });
  });

  it("SIPSIN_LABELS 10개 십신, 한자/ko/en 모두 채워짐", () => {
    const expected = ["bigyeon","geopjae","sikshin","sanggwan","pyeonjae","jeongjae","pyeongwan","jeonggwan","pyeonin","jeongin"];
    expected.forEach(k => {
      const l = SIPSIN_LABELS[k as keyof typeof SIPSIN_LABELS];
      expect(l).toBeDefined();
      expect(l.hanja).toBeTruthy();
      expect(l.ko).toBeTruthy();
      expect(l.en).toBeTruthy();
    });
  });

  it("SOLAR_TERMS_12 = 12개 (월령 절기)", () => {
    expect(SOLAR_TERMS_12).toHaveLength(12);
    expect(new Set(SOLAR_TERMS_12).size).toBe(12);
  });

  it("OHO_DUN 값 정확성 (五虎遁): 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲", () => {
    expect(OHO_DUN["甲"]).toBe("丙"); expect(OHO_DUN["己"]).toBe("丙");
    expect(OHO_DUN["乙"]).toBe("戊"); expect(OHO_DUN["庚"]).toBe("戊");
    expect(OHO_DUN["丙"]).toBe("庚"); expect(OHO_DUN["辛"]).toBe("庚");
    expect(OHO_DUN["丁"]).toBe("壬"); expect(OHO_DUN["壬"]).toBe("壬");
    expect(OHO_DUN["戊"]).toBe("甲"); expect(OHO_DUN["癸"]).toBe("甲");
  });

  it("OSEO_DUN 값 정확성 (五鼠遁): 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬", () => {
    expect(OSEO_DUN["甲"]).toBe("甲"); expect(OSEO_DUN["己"]).toBe("甲");
    expect(OSEO_DUN["乙"]).toBe("丙"); expect(OSEO_DUN["庚"]).toBe("丙");
    expect(OSEO_DUN["丙"]).toBe("戊"); expect(OSEO_DUN["辛"]).toBe("戊");
    expect(OSEO_DUN["丁"]).toBe("庚"); expect(OSEO_DUN["壬"]).toBe("庚");
    expect(OSEO_DUN["戊"]).toBe("壬"); expect(OSEO_DUN["癸"]).toBe("壬");
  });

  it("WUXING_PRODUCE 정확한 생 cycle: 木→火→土→金→水→木", () => {
    expect(WUXING_PRODUCE).toEqual({
      wood: "fire",
      fire: "earth",
      earth: "metal",
      metal: "water",
      water: "wood",
    });
  });

  it("WUXING_CONTROL 정확한 극 cycle: 木→土→水→火→金→木", () => {
    expect(WUXING_CONTROL).toEqual({
      wood: "earth",
      earth: "water",
      water: "fire",
      fire: "metal",
      metal: "wood",
    });
  });

  it("EARTHLY_BRANCHES.primaryHiddenStem (지지장간 본기) 값 정확성", () => {
    // 子=癸, 丑=己, 寅=甲, 卯=乙, 辰=戊, 巳=丙
    // 午=丁, 未=己, 申=庚, 酉=辛, 戌=戊, 亥=壬
    expect(EARTHLY_BRANCHES[0].primaryHiddenStem).toBe("癸");  // 子
    expect(EARTHLY_BRANCHES[1].primaryHiddenStem).toBe("己");  // 丑
    expect(EARTHLY_BRANCHES[2].primaryHiddenStem).toBe("甲");  // 寅
    expect(EARTHLY_BRANCHES[3].primaryHiddenStem).toBe("乙");  // 卯
    expect(EARTHLY_BRANCHES[4].primaryHiddenStem).toBe("戊");  // 辰
    expect(EARTHLY_BRANCHES[5].primaryHiddenStem).toBe("丙");  // 巳
    expect(EARTHLY_BRANCHES[6].primaryHiddenStem).toBe("丁");  // 午
    expect(EARTHLY_BRANCHES[7].primaryHiddenStem).toBe("己");  // 未
    expect(EARTHLY_BRANCHES[8].primaryHiddenStem).toBe("庚");  // 申
    expect(EARTHLY_BRANCHES[9].primaryHiddenStem).toBe("辛");  // 酉
    expect(EARTHLY_BRANCHES[10].primaryHiddenStem).toBe("戊"); // 戌
    expect(EARTHLY_BRANCHES[11].primaryHiddenStem).toBe("壬"); // 亥
  });
});
