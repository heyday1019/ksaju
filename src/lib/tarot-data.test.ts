import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import cards from "../../data/ksaju-tarot.json";

const SUIT_ELEMENT: Record<string, string | null> = {
  wands: "fire", cups: "water", swords: "metal", pentacles: "earth", major: null,
};

describe("ksaju-tarot.json", () => {
  it("has all 78 cards", () => {
    expect(cards).toHaveLength(78);
  });

  it("ids are unique and cover 0..77", () => {
    const ids = cards.map((c) => c.id).sort((a, b) => a - b);
    expect(ids[0]).toBe(0);
    expect(ids[77]).toBe(77);
    expect(new Set(ids).size).toBe(78);
  });

  it("element matches suit mapping", () => {
    for (const c of cards) {
      expect(SUIT_ELEMENT[c.suit]).toBe(c.element);
    }
  });

  it("every card has theme, keywords, and an existing image file", () => {
    for (const c of cards) {
      expect(c.theme.length).toBeGreaterThan(0);
      expect(c.keywords.length).toBeGreaterThan(0);
      expect(c.name_en.length).toBeGreaterThan(0);
      expect(existsSync(join(process.cwd(), "public", "tarot", c.filename))).toBe(true);
    }
  });
});
