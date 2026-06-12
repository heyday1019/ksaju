import { describe, it, expect } from "vitest";
import { getReading } from "./reading";
import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { SajuPillars } from "./compatibility";

const lib = readings as {
  pairs: Record<string, Record<string, Record<string, string>>>;
  tiers: Record<string, Record<string, string>>;
};

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

function pillarsFor(element: string): SajuPillars {
  const stem = HEAVENLY_STEMS.find((s) => s.element === element)!.char;
  return { year: `${stem}子`, month: `${stem}子`, day: `${stem}子` };
}

describe("getReading", () => {
  it("is deterministic — same inputs give the same reading", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("fire");
    expect(getReading(me, other, 80)).toBe(getReading(me, other, 80));
  });

  it("composes the pair line + score-tier tail (en default)", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("water");
    const out = getReading(me, other, 80);
    expect(out).toContain(lib.pairs.fire.water.en);
    expect(out).toContain(lib.tiers.high.en);
  });

  it("tier boundaries: 75=high, 74=mid, 50=mid, 49=low", () => {
    const me = pillarsFor("wood");
    const other = pillarsFor("wood");
    expect(getReading(me, other, 75)).toContain(lib.tiers.high.en);
    expect(getReading(me, other, 74)).toContain(lib.tiers.mid.en);
    expect(getReading(me, other, 50)).toContain(lib.tiers.mid.en);
    expect(getReading(me, other, 49)).toContain(lib.tiers.low.en);
  });

  it("every element pair resolves to a non-empty line (no missing cells)", () => {
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        expect(typeof lib.pairs[a][b].en).toBe("string");
        expect(lib.pairs[a][b].en.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns ko locale reading", () => {
    const me = pillarsFor("earth");
    const other = pillarsFor("wood");
    const out = getReading(me, other, 80, "ko");
    expect(out).toContain(lib.pairs.earth.wood.ko);
    expect(out).toContain(lib.tiers.high.ko);
  });

  it("returns ja locale reading", () => {
    const me = pillarsFor("water");
    const other = pillarsFor("fire");
    const out = getReading(me, other, 40, "ja");
    expect(out).toContain(lib.pairs.water.fire.ja);
    expect(out).toContain(lib.tiers.low.ja);
  });

  it("returns zh-TW locale reading", () => {
    const me = pillarsFor("metal");
    const other = pillarsFor("metal");
    const out = getReading(me, other, 60, "zh-TW");
    expect(out).toContain(lib.pairs.metal.metal["zh-TW"]);
    expect(out).toContain(lib.tiers.mid["zh-TW"]);
  });

  it("falls back to en for unknown locale", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("fire");
    const out = getReading(me, other, 80, "fr");
    expect(out).toContain(lib.pairs.fire.fire.en);
  });

  it("all locales have non-empty strings for every pair and tier", () => {
    const locales = ["en", "ko", "ja", "zh-TW"];
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        for (const loc of locales) {
          expect(typeof lib.pairs[a][b][loc]).toBe("string");
          expect(lib.pairs[a][b][loc].length).toBeGreaterThan(0);
        }
      }
    }
    for (const tier of ["high", "mid", "low"]) {
      for (const loc of locales) {
        expect(typeof lib.tiers[tier][loc]).toBe("string");
        expect(lib.tiers[tier][loc].length).toBeGreaterThan(0);
      }
    }
  });
});
