import { describe, it, expect } from "vitest";
import {
  TAROT_CARDS, getCardById, kstDateString, drawDailyCard, tarotFallbackReading,
} from "./tarot";
import type { UserSaju } from "./saju-types";

const sajuA: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛", isTimeCorrected: false,
};
const sajuB: UserSaju = {
  pillars: { year: "丙寅", month: "甲午", day: "乙丑", hour: "戊寅" },
  dayMaster: "乙", isTimeCorrected: true,
};

describe("getCardById", () => {
  it("returns the matching card", () => {
    expect(getCardById(0)?.name_en).toBe("The Fool");
  });
  it("returns null for unknown id", () => {
    expect(getCardById(999)).toBeNull();
  });
});

describe("kstDateString", () => {
  it("formats YYYY-MM-DD", () => {
    expect(kstDateString(new Date("2026-06-17T03:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("drawDailyCard", () => {
  it("is deterministic for the same saju + date", () => {
    expect(drawDailyCard(sajuA, "2026-06-17").id).toBe(drawDailyCard(sajuA, "2026-06-17").id);
  });
  it("returns a card within the deck", () => {
    const c = drawDailyCard(sajuA, "2026-06-17");
    expect(c.id).toBeGreaterThanOrEqual(0);
    expect(c.id).toBeLessThanOrEqual(77);
    expect(TAROT_CARDS).toContainEqual(c);
  });
  it("varies the card across the week for a given saju", () => {
    const ids = new Set(
      ["2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23"]
        .map((d) => drawDailyCard(sajuA, d).id),
    );
    expect(ids.size).toBeGreaterThan(1);
  });
  it("can differ between two different sajus on the same day", () => {
    const ids = new Set(
      ["2026-06-17", "2026-06-18", "2026-06-19"].flatMap((d) => [
        drawDailyCard(sajuA, d).id, drawDailyCard(sajuB, d).id,
      ]),
    );
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe("tarotFallbackReading", () => {
  it("includes the card name and is non-empty", () => {
    const r = tarotFallbackReading(getCardById(0)!, "Metal");
    expect(r).toContain("The Fool");
    expect(r.length).toBeGreaterThan(20);
  });
});
