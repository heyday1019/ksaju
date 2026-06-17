import { describe, it, expect } from "vitest";
import fallback from "../../data/ksaju-daily-fortune-fallback-i18n.json";

const RELATIONS = ["combo", "same", "generate-me", "i-generate", "control", "neutral"];
const LOCALES = ["en", "ko", "ja", "zh-TW"];

describe("ksaju-daily-fortune-fallback-i18n.json", () => {
  it("has all 6 TimeRel relations", () => {
    expect(Object.keys(fallback).sort()).toEqual([...RELATIONS].sort());
  });

  it("each relation has numeric energy + all 4 locales for message and lucky_color", () => {
    for (const rel of RELATIONS) {
      const entry = (fallback as Record<string, { energy: number; message: Record<string, string>; lucky_color: Record<string, string> }>)[rel];
      expect(typeof entry.energy).toBe("number");
      for (const loc of LOCALES) {
        expect(entry.message[loc]?.length).toBeGreaterThan(0);
        expect(entry.lucky_color[loc]?.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves all original English energy + lucky_color values", () => {
    const expected: Array<[string, number, string]> = [
      ["combo", 5, "Hot Pink"],
      ["same", 4, "Golden Yellow"],
      ["generate-me", 4, "Sage Green"],
      ["i-generate", 3, "Lavender"],
      ["control", 3, "Dusty Rose"],
      ["neutral", 3, "Sky Blue"],
    ];
    const data = fallback as Record<string, { energy: number; lucky_color: Record<string, string> }>;
    for (const [rel, energy, color] of expected) {
      expect(data[rel].energy).toBe(energy);
      expect(data[rel].lucky_color.en).toBe(color);
    }
  });
});
