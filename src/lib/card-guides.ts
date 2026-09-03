import { TAROT_CARDS, type TarotCard } from "./tarot";

/** "Ace of Wands" → "ace-of-wands". Derived, never stored — seed-tarot.mjs owns the card JSON. */
export function cardSlug(card: TarotCard): string {
  return card.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BY_SLUG = new Map(TAROT_CARDS.map((c) => [cardSlug(c), c]));

export function cardBySlug(slug: string): TarotCard | null {
  return BY_SLUG.get(slug) ?? null;
}
