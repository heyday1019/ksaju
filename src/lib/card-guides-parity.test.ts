import { describe, it, expect } from "vitest";
import en from "../../data/card-guides/en.json";
import ko from "../../data/card-guides/ko.json";
import ja from "../../data/card-guides/ja.json";
import zhTW from "../../data/card-guides/zh-TW.json";
import type { CardGuide } from "./card-guides";

type GuideFile = Record<string, CardGuide>;

const OTHERS: Array<[string, GuideFile]> = [
  ["ko", ko as GuideFile],
  ["ja", ja as GuideFile],
  ["zh-TW", zhTW as GuideFile],
];

const FIELDS = [
  "title", "summary", "meaning", "symbols",
  "upright", "reversed", "love", "work", "sajuLens",
] as const;

describe("card guide locale parity", () => {
  const enFile = en as GuideFile;
  const enSlugs = Object.keys(enFile).sort();

  it.each(OTHERS)("%s covers exactly the same slugs as en", (_name, file) => {
    expect(Object.keys(file).sort()).toEqual(enSlugs);
  });

  it.each([["en", enFile], ...OTHERS])("%s has every field on every card", (_name, file) => {
    for (const [slug, guide] of Object.entries(file)) {
      for (const field of FIELDS) {
        expect(guide[field], `${slug}.${field}`).toBeDefined();
      }
      expect(guide.meaning.length, `${slug}.meaning`).toBeGreaterThanOrEqual(2);
      expect(guide.symbols.length, `${slug}.symbols`).toBeGreaterThanOrEqual(3);
    }
  });

  it.each([["en", enFile], ...OTHERS])("%s has no blank strings", (_name, file) => {
    for (const [slug, guide] of Object.entries(file)) {
      expect(guide.title.trim(), `${slug}.title`).not.toBe("");
      expect(guide.summary.trim(), `${slug}.summary`).not.toBe("");
      expect(guide.upright.trim(), `${slug}.upright`).not.toBe("");
      expect(guide.reversed.trim(), `${slug}.reversed`).not.toBe("");
      expect(guide.love.trim(), `${slug}.love`).not.toBe("");
      expect(guide.work.trim(), `${slug}.work`).not.toBe("");
      expect(guide.sajuLens.trim(), `${slug}.sajuLens`).not.toBe("");
      for (const p of guide.meaning) expect(p.trim(), `${slug}.meaning[]`).not.toBe("");
      for (const s of guide.symbols) {
        expect(s.label.trim(), `${slug}.symbols[].label`).not.toBe("");
        expect(s.text.trim(), `${slug}.symbols[].text`).not.toBe("");
      }
    }
  });
});
