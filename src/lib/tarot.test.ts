import { describe, it, expect } from "vitest";
import {
  TAROT_CARDS, getCardById, kstDateString, drawDailyCard, tarotFallbackReading, drawSpread, tarotSpreadFallbackReading,
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
  it("en: includes the card name + theme and is non-empty", () => {
    const r = tarotFallbackReading(getCardById(0)!, "metal", "en");
    expect(r).toContain("The Fool");
    expect(r).toContain("a free spirit, unbound"); // The Fool's theme
    expect(r.length).toBeGreaterThan(20);
  });

  it("en is the default when locale is omitted", () => {
    expect(tarotFallbackReading(getCardById(0)!, "metal")).toContain("The Fool is your card today");
  });

  it("ko: uses the Korean card name + hangul element, not the English template", () => {
    const r = tarotFallbackReading(getCardById(0)!, "metal", "ko");
    expect(r).toContain("광대");          // The Fool's name_kr
    expect(r).toContain("금");            // metal element in hangul (금)
    expect(r).not.toContain("金");        // ko reads hangul, not the CJK hanja
    expect(r).not.toContain("is your card today");
  });

  it("ja: uses the hanja element and not the English template", () => {
    const r = tarotFallbackReading(getCardById(0)!, "metal", "ja");
    expect(r).toContain("金");            // metal hanja
    expect(r).toContain("The Fool");      // ja uses name_en
    expect(r).not.toContain("is your card today");
  });

  it("zh-TW: uses the hanja element and not the English template", () => {
    const r = tarotFallbackReading(getCardById(0)!, "metal", "zh-TW");
    expect(r).toContain("金");            // metal hanja
    expect(r).toContain("The Fool");      // zh-TW uses name_en
    expect(r).not.toContain("is your card today");
  });

  it("unknown locale falls back to en", () => {
    expect(tarotFallbackReading(getCardById(0)!, "metal", "xx")).toContain("The Fool is your card today");
  });
});

describe("drawSpread", () => {
  it("returns 3 distinct valid cards", () => {
    const trio = drawSpread();
    expect(trio).toHaveLength(3);
    const ids = new Set(trio.map((c) => c.id));
    expect(ids.size).toBe(3);
    for (const c of trio) expect(TAROT_CARDS).toContainEqual(c);
  });
  it("is deterministic for the same rng sequence", () => {
    const mk = () => { let i = 0; const seq = [0.1, 0.5, 0.9, 0.3]; return () => seq[i++ % seq.length]; };
    expect(drawSpread(mk()).map((c) => c.id)).toEqual(drawSpread(mk()).map((c) => c.id));
  });
  it("can differ across rng sequences", () => {
    const a = drawSpread(() => 0.01).map((c) => c.id).join();
    const b = drawSpread(() => 0.99).map((c) => c.id).join();
    expect(a).not.toBe(b);
  });
});

describe("tarotSpreadFallbackReading", () => {
  const trio = [getCardById(0)!, getCardById(1)!, getCardById(2)!] as [typeof TAROT_CARDS[0], typeof TAROT_CARDS[0], typeof TAROT_CARDS[0]];
  it("en: 4 non-empty string fields with card names", () => {
    const r = tarotSpreadFallbackReading(trio, "metal", "en");
    expect(r.past).toContain("The Fool");
    for (const v of [r.past, r.present, r.future, r.synthesis]) expect(v.length).toBeGreaterThan(10);
  });
  it("ko: uses Korean card name + hangul element, not English template", () => {
    const r = tarotSpreadFallbackReading(trio, "metal", "ko");
    expect(r.past).toContain("광대");
    expect(r.synthesis).toContain("금");
    expect(r.synthesis).not.toContain("Trust your");
  });
  it("unknown locale falls back to en", () => {
    expect(tarotSpreadFallbackReading(trio, "metal", "xx").synthesis).toContain("Trust your");
  });
});
