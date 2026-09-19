import { expect, test } from "vitest";
import { calcDailyFortune } from "./daily";
import { DAILY_KO } from "../content/ko/daily";
import type { UserSaju } from "./saju-types";

const saju = (dayMaster: string): UserSaju => ({
  pillars: { year: "甲戌", month: "癸酉", day: `${dayMaster}卯`, hour: null },
  dayMaster,
  isTimeCorrected: false,
});

test("같은 사람·같은 날이면 항상 같은 결과 (결정적, 오프라인)", () => {
  const a = calcDailyFortune(saju("辛"), "丙", "2026-09-19");
  const b = calcDailyFortune(saju("辛"), "丙", "2026-09-19");
  expect(a).toEqual(b);
});

test("천간합(丙辛)이면 combo 로 보고 에너지가 최고치다", () => {
  const r = calcDailyFortune(saju("辛"), "丙", "2026-09-19");
  expect(r.relation).toBe("combo");
  expect(r.energy).toBe(5);
});

test("같은 오행이면 same 이다", () => {
  // 辛·庚 둘 다 금(金)
  expect(calcDailyFortune(saju("辛"), "庚", "2026-09-19").relation).toBe("same");
});

test("날짜가 바뀌면 문장도 바뀐다 (매일 같은 말이 아니다)", () => {
  const days = ["2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];
  const seen = new Set(
    days.map((d) => calcDailyFortune(saju("辛"), "庚", d).message),
  );
  expect(seen.size).toBeGreaterThan(1);
});

test("사람이 다르면 같은 날에도 문장이 갈린다", () => {
  const seen = new Set(
    ["甲", "乙", "丙", "丁", "戊"].map(
      (dm) => calcDailyFortune(saju(dm), "庚", "2026-09-19").message,
    ),
  );
  expect(seen.size).toBeGreaterThan(1);
});

test("모든 관계에 문장·행운색 풀이 채워져 있다", () => {
  for (const [rel, v] of Object.entries(DAILY_KO)) {
    expect(v.messages.length, rel).toBeGreaterThan(1);
    expect(v.luckyColors.length, rel).toBeGreaterThan(1);
    expect(v.energy, rel).toBeGreaterThanOrEqual(1);
    expect(v.energy, rel).toBeLessThanOrEqual(5);
  }
});
