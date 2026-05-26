import { describe, it, expect } from "vitest";
import {
  calcCompatibility,
  normalizeIdolSaju,
  type SajuPillars,
} from "./compatibility";

// === helpers ===
// 테스트용 SajuPillars 빌더 — day[0]만 의미가 있으므로
// 다른 자리는 기본 안전값(임의)으로 채움.
function pillars(opts: {
  dayStem: string;
  dayBranch?: string;
  year?: string;
  month?: string;
}): SajuPillars {
  return {
    year: opts.year ?? "甲子",
    month: opts.month ?? "甲子",
    day: opts.dayStem + (opts.dayBranch ?? "子"),
  };
}

// === 일간 dayMasterScore — 6 type ===
describe("dayMasterScore (calcCompatibility을 통한 검증)", () => {
  it("combo (천간합) 甲 + 己 → 40, type=combo", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "己" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("combo");
    expect(r.breakdown.dayMaster.score).toBe(40);
  });

  it("clash (천간충) 甲 + 庚 → 15, type=clash", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "庚" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("clash");
    expect(r.breakdown.dayMaster.score).toBe(15);
  });

  it("same (비화) 甲 + 乙 (둘 다 wood) → 28, type=same", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "乙" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("same");
    expect(r.breakdown.dayMaster.score).toBe(28);
  });

  it("generate (상생) 甲(wood) + 丙(fire) → 34, type=generate", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "丙" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("generate");
    expect(r.breakdown.dayMaster.score).toBe(34);
  });

  it("generate 양방향: 丙 + 甲 도 generate (e2→e1 produce)", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "丙" }),
      pillars({ dayStem: "甲" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("generate");
  });

  it("control (상극) 甲(wood) + 戊(earth) → 20, type=control", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "戊" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("control");
    expect(r.breakdown.dayMaster.score).toBe(20);
  });

  it("control 양방향: 戊 + 甲 도 control (e2 controls e1)", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "戊" }),
      pillars({ dayStem: "甲" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("control");
  });

  it("combo가 wuxing-relation보다 우선: 甲(wood)+己(earth)는 control이 아닌 combo", () => {
    // 甲己 = 천간합. wood→earth는 control이지만 combo 검사가 먼저.
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "己" }),
    );
    expect(r.breakdown.dayMaster.type).toBe("combo");
  });
});

// === 지지 branchScore — 5 type ===
describe("branchScore (day branch 기준)", () => {
  it("three-harmony (삼합) 子 + 申 → 30, type=three-harmony", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", dayBranch: "子" }),
      pillars({ dayStem: "丙", dayBranch: "申" }),
    );
    expect(r.breakdown.branch.type).toBe("three-harmony");
    expect(r.breakdown.branch.score).toBe(30);
  });

  it("six-harmony (육합) 子 + 丑 → 28, type=six-harmony", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", dayBranch: "子" }),
      pillars({ dayStem: "丙", dayBranch: "丑" }),
    );
    expect(r.breakdown.branch.type).toBe("six-harmony");
    expect(r.breakdown.branch.score).toBe(28);
  });

  it("same 같은 일지 子 + 子 → 22, type=same", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", dayBranch: "子" }),
      pillars({ dayStem: "丙", dayBranch: "子" }),
    );
    expect(r.breakdown.branch.type).toBe("same");
    expect(r.breakdown.branch.score).toBe(22);
  });

  it("clash (충) 子 + 午 → 11, type=clash", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", dayBranch: "子" }),
      pillars({ dayStem: "丙", dayBranch: "午" }),
    );
    expect(r.breakdown.branch.type).toBe("clash");
    expect(r.breakdown.branch.score).toBe(11);
  });

  it("neutral 子 + 寅 → 18, type=neutral", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", dayBranch: "子" }),
      pillars({ dayStem: "丙", dayBranch: "寅" }),
    );
    expect(r.breakdown.branch.type).toBe("neutral");
    expect(r.breakdown.branch.score).toBe(18);
  });
});

// === elementBalanceScore ===
describe("elementBalanceScore", () => {
  it("0-30 점수 범위", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲", year: "壬申", month: "己酉" }),
      pillars({ dayStem: "辛", year: "壬申", month: "己酉" }),
    );
    expect(r.breakdown.elementBalance.score).toBeGreaterThanOrEqual(0);
    expect(r.breakdown.elementBalance.score).toBeLessThanOrEqual(30);
  });

  it("5개 오행이 더 골고루 분포할수록 점수가 올라간다", () => {
    // 5가지 원소가 모두 등장하는 케이스
    const diverse = calcCompatibility(
      { year: "甲子", month: "丙寅", day: "戊辰" }, // wood, water, fire, wood, earth, earth
      { year: "庚申", month: "壬戌", day: "癸亥" }, // metal, metal, water, earth, water, water
    );
    // 한 원소(wood)만으로만 12자리를 채우는 케이스
    const monotone = calcCompatibility(
      { year: "甲寅", month: "乙卯", day: "甲寅" }, // 전부 wood
      { year: "乙卯", month: "甲寅", day: "乙卯" }, // 전부 wood
    );
    expect(diverse.breakdown.elementBalance.score).toBeGreaterThan(
      monotone.breakdown.elementBalance.score,
    );
  });
});

// === fun label ===
describe("funLabel", () => {
  it("정렬된 키로 lookup: fire-water (丙+壬)", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "丙" }),
      pillars({ dayStem: "壬" }),
    );
    expect(r.label).toBe("Steamy chemistry 🔥💧");
  });

  it("같은 원소: fire-fire (丙+丁)", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "丙" }),
      pillars({ dayStem: "丁" }),
    );
    expect(r.label).toBe("Double the spark 🔥🔥");
  });

  it("water-wood (壬+甲)", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "壬" }),
      pillars({ dayStem: "甲" }),
    );
    expect(r.label).toBe("Quiet growth together 💧🌳");
  });

  it("순서 무관: 甲+壬 도 wood-water 라벨", () => {
    const r1 = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "壬" }),
    );
    const r2 = calcCompatibility(
      pillars({ dayStem: "壬" }),
      pillars({ dayStem: "甲" }),
    );
    expect(r1.label).toBe(r2.label);
  });
});

// === calcCompatibility 통합 ===
describe("calcCompatibility 통합", () => {
  it("score = dayMaster + elementBalance + branch", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "丙" }),
    );
    expect(r.score).toBe(
      r.breakdown.dayMaster.score +
        r.breakdown.elementBalance.score +
        r.breakdown.branch.score,
    );
  });

  it("score 범위는 0-100", () => {
    // 다양한 케이스 sampling
    const cases: [SajuPillars, SajuPillars][] = [
      [pillars({ dayStem: "甲" }), pillars({ dayStem: "己" })], // best-case 후보
      [pillars({ dayStem: "甲" }), pillars({ dayStem: "庚" })], // worst-case 후보
      [
        { year: "壬申", month: "己酉", day: "辛卯" }, // RM (BTS)
        { year: "癸酉", month: "乙卯", day: "己丑" }, // SUGA (BTS)
      ],
    ];
    for (const [a, b] of cases) {
      const r = calcCompatibility(a, b);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("결과 shape: score, label, breakdown 3 필드", () => {
    const r = calcCompatibility(
      pillars({ dayStem: "甲" }),
      pillars({ dayStem: "丙" }),
    );
    expect(r).toHaveProperty("score");
    expect(r).toHaveProperty("label");
    expect(r.breakdown).toHaveProperty("dayMaster");
    expect(r.breakdown).toHaveProperty("elementBalance");
    expect(r.breakdown).toHaveProperty("branch");
    expect(typeof r.label).toBe("string");
    expect(r.label.length).toBeGreaterThan(0);
  });
});

// === normalizeIdolSaju ===
describe("normalizeIdolSaju", () => {
  it("DB 객체 → SajuPillars 문자열로 변환", () => {
    const dbEntry = {
      year: { hanja: "壬申" },
      month: { hanja: "己酉" },
      day: { hanja: "辛卯" },
    };
    expect(normalizeIdolSaju(dbEntry)).toEqual({
      year: "壬申",
      month: "己酉",
      day: "辛卯",
    });
  });
});
