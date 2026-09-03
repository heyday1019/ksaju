import { describe, it, expect } from "vitest";
import { TAROT_CARDS } from "./tarot";
import { cardSlug, cardBySlug, getGuide, publishedSlugs } from "./card-guides";

describe("cardSlug", () => {
  it("produces a unique slug for all 78 cards", () => {
    const slugs = TAROT_CARDS.map(cardSlug);
    expect(slugs).toHaveLength(78);
    expect(new Set(slugs).size).toBe(78);
  });

  it("produces URL-safe slugs only", () => {
    for (const slug of TAROT_CARDS.map(cardSlug)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("matches known answers", () => {
    const bySlugName = (name: string) =>
      cardSlug(TAROT_CARDS.find((c) => c.name_en === name)!);
    expect(bySlugName("The Fool")).toBe("the-fool");
    expect(bySlugName("The High Priestess")).toBe("the-high-priestess");
    expect(bySlugName("Ace of Wands")).toBe("ace-of-wands");
    expect(bySlugName("King of Pentacles")).toBe("king-of-pentacles");
  });
});

describe("cardBySlug", () => {
  it("round-trips every card", () => {
    for (const card of TAROT_CARDS) {
      expect(cardBySlug(cardSlug(card))?.id).toBe(card.id);
    }
  });

  it("returns null for an unknown slug", () => {
    expect(cardBySlug("not-a-card")).toBeNull();
  });
});

describe("publishedSlugs", () => {
  it("only lists slugs present in all four locale files", () => {
    const published = publishedSlugs();
    for (const slug of published) {
      for (const locale of ["en", "ko", "ja", "zh-TW"] as const) {
        expect(getGuide(locale, slug)).not.toBeNull();
      }
    }
  });

  it("includes the-fool", () => {
    expect(publishedSlugs()).toContain("the-fool");
  });

  it("orders slugs by card id", () => {
    const published = publishedSlugs();
    const ids = published.map((s) => TAROT_CARDS.find((c) => cardSlug(c) === s)!.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("never lists a slug that is not a real card", () => {
    for (const slug of publishedSlugs()) {
      expect(cardBySlug(slug)).not.toBeNull();
    }
  });
});

describe("getGuide", () => {
  it("returns a fully populated guide for the-fool in every locale", () => {
    for (const locale of ["en", "ko", "ja", "zh-TW"] as const) {
      const guide = getGuide(locale, "the-fool")!;
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.summary.length).toBeGreaterThan(0);
      expect(guide.meaning.length).toBeGreaterThanOrEqual(2);
      expect(guide.symbols.length).toBeGreaterThanOrEqual(3);
      expect(guide.upright.length).toBeGreaterThan(0);
      expect(guide.reversed.length).toBeGreaterThan(0);
      expect(guide.sajuLens.length).toBeGreaterThan(0);
    }
  });

  it("returns null for an unwritten card", () => {
    expect(getGuide("en", "not-a-card")).toBeNull();
  });
});
