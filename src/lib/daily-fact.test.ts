import { describe, it, expect } from "vitest";
import { getDailyFact, getTodayKST } from "./daily-fact";

describe("getDailyFact", () => {
  const day1 = new Date("2026-01-01T00:00:00");
  const day2 = new Date("2026-01-02T00:00:00");

  it("returns a non-empty string", () => {
    expect(getDailyFact("甲", day1).length).toBeGreaterThan(10);
  });

  it("changes from one day to the next for the same day master", () => {
    const factDay1 = getDailyFact("甲", day1);
    const factDay2 = getDailyFact("甲", day2);
    expect(factDay1).not.toBe(factDay2);
  });

  it("differs for different day masters on the same day", () => {
    const factJia = getDailyFact("甲", day1);
    const factRen = getDailyFact("壬", day1);
    expect(factJia).not.toBe(factRen);
  });

  it("returns a fact for unknown day master (offset = 0)", () => {
    const fact = getDailyFact("X", day1);
    expect(fact.length).toBeGreaterThan(10);
  });

  it("returns deterministic result for same inputs", () => {
    expect(getDailyFact("丙", day1)).toBe(getDailyFact("丙", day1));
  });

  it("cycles through all 10 stems without index error", () => {
    const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    for (const s of stems) {
      expect(() => getDailyFact(s, day1)).not.toThrow();
    }
  });
});

describe("getTodayKST", () => {
  it("returns a Date object", () => {
    const d = getTodayKST();
    expect(d).toBeInstanceOf(Date);
  });
});
