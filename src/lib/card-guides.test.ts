import { describe, it, expect } from "vitest";
import { TAROT_CARDS } from "./tarot";
import { cardSlug, cardBySlug } from "./card-guides";

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
