import { describe, it, expect } from "vitest";
import { getReading } from "./reading";
import readings from "../../data/ksaju-readings.json";
import { HEAVENLY_STEMS } from "./saju-data";
import type { SajuPillars } from "./compatibility";

const lib = readings as {
  pairs: Record<string, Record<string, string>>;
  tiers: Record<string, string>;
};

const ELEMENTS = ["wood", "fire", "earth", "metal", "water"] as const;

/** Build pillars whose day-master stem maps to the given element. */
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

  it("composes the pair line + score-tier tail", () => {
    const me = pillarsFor("fire");
    const other = pillarsFor("water");
    const out = getReading(me, other, 80);
    expect(out).toContain(lib.pairs.fire.water);
    expect(out).toContain(lib.tiers.high);
  });

  it("tier boundaries: 75=high, 74=mid, 50=mid, 49=low", () => {
    const me = pillarsFor("wood");
    const other = pillarsFor("wood");
    expect(getReading(me, other, 75)).toContain(lib.tiers.high);
    expect(getReading(me, other, 74)).toContain(lib.tiers.mid);
    expect(getReading(me, other, 50)).toContain(lib.tiers.mid);
    expect(getReading(me, other, 49)).toContain(lib.tiers.low);
  });

  it("every element pair resolves to a non-empty line (no missing cells)", () => {
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        expect(typeof lib.pairs[a][b]).toBe("string");
        expect(lib.pairs[a][b].length).toBeGreaterThan(0);
      }
    }
  });
});
