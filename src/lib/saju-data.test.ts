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
});
