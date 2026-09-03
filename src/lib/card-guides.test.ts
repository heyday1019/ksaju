import { describe, it, expect } from "vitest";
import { TAROT_CARDS } from "./tarot";
import { cardSlug, cardBySlug, getGuide, publishedSlugs, relatedCards } from "./card-guides";

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

describe("relatedCards", () => {
  const majors = TAROT_CARDS.filter((c) => c.suit === "major");
  const allMajors = new Set(majors.map(cardSlug));
  const card = (name: string) => TAROT_CARDS.find((c) => c.name_en === name)!;

  it("returns four neighbours ordered prev, next, prev2, next2", () => {
    const related = relatedCards(card("The Chariot"), allMajors); // id 7
    expect(related.map((c) => c.id)).toEqual([6, 8, 5, 9]);
  });

  it("wraps around the suit boundary", () => {
    const related = relatedCards(card("The Fool"), allMajors); // id 0
    expect(related.map((c) => c.id)).toEqual([21, 1, 20, 2]);
  });

  it("never includes the card itself", () => {
    for (const c of majors) {
      expect(relatedCards(c, allMajors).some((r) => r.id === c.id)).toBe(false);
    }
  });

  it("stays inside the same suit", () => {
    const wands = new Set(
      TAROT_CARDS.filter((c) => c.suit === "wands").map(cardSlug),
    );
    for (const c of TAROT_CARDS.filter((x) => x.suit === "wands")) {
      expect(relatedCards(c, wands).every((r) => r.suit === "wands")).toBe(true);
    }
  });

  it("omits unpublished cards", () => {
    const onlyThree = new Set(["the-fool", "the-magician", "the-world"]);
    const related = relatedCards(card("The Fool"), onlyThree);
    expect(related.map(cardSlug)).toEqual(["the-world", "the-magician"]);
  });

  it("returns an empty list when nothing else is published", () => {
    expect(relatedCards(card("The Fool"), new Set(["the-fool"]))).toEqual([]);
  });

  it("defaults to the real published set", () => {
    const related = relatedCards(card("The Fool"));
    const published = new Set(publishedSlugs());
    expect(related.every((c) => published.has(cardSlug(c)))).toBe(true);
  });
});
