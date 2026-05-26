import { describe, it, expect } from "vitest";
import {
  elementOf,
  WUXING_META,
  pillarBreakdown,
  wuxingBalance,
  dayMasterInfo,
} from "./saju-display";
import { DAY_MASTER_KEYWORDS } from "./saju-data";
import type { UserSaju } from "./saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("elementOf", () => {
  it("천간 오행", () => {
    expect(elementOf("壬")).toBe("water");
    expect(elementOf("己")).toBe("earth");
    expect(elementOf("辛")).toBe("metal");
  });
  it("지지 오행", () => {
    expect(elementOf("申")).toBe("metal");
    expect(elementOf("卯")).toBe("wood");
  });
});

describe("WUXING_META", () => {
  it("오행 → 색 토큰 매핑", () => {
    expect(WUXING_META.wood.token).toBe("mok");
    expect(WUXING_META.fire.token).toBe("hwa");
    expect(WUXING_META.earth.token).toBe("to");
    expect(WUXING_META.metal.token).toBe("geum");
    expect(WUXING_META.water.token).toBe("su");
  });
});

describe("pillarBreakdown", () => {
  it("천간/지지 글자와 오행을 분해한다", () => {
    expect(pillarBreakdown("辛卯")).toEqual({
      stem: { char: "辛", element: "metal" },
      branch: { char: "卯", element: "wood" },
    });
  });
});

describe("wuxingBalance", () => {
  it("가용 기둥의 오행 분포를 센다 (시주 없으면 6자)", () => {
    expect(wuxingBalance(RM)).toEqual({
      wood: 1,
      fire: 0,
      earth: 1,
      metal: 3,
      water: 1,
    });
  });
  it("시주가 있으면 8자를 센다", () => {
    const withHour: UserSaju = {
      ...RM,
      pillars: { ...RM.pillars, hour: "戊子" },
    };
    const b = wuxingBalance(withHour);
    expect(Object.values(b).reduce((s, n) => s + n, 0)).toBe(8);
  });
});

describe("dayMasterInfo", () => {
  it("일간의 오행과 키워드를 준다", () => {
    expect(dayMasterInfo("辛")).toEqual({
      char: "辛",
      element: "metal",
      keyword: DAY_MASTER_KEYWORDS["辛"],
    });
  });
});
