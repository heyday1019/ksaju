import tarot from "../../data/ksaju-tarot.json";
import type { WuXing, UserSaju } from "./saju-types";

export type TarotCard = {
  id: number;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  rank: string;
  name_en: string;
  name_kr: string;
  filename: string;
  element: WuXing | null;
  theme: string;
  keywords: string;
};

export const TAROT_CARDS = tarot as TarotCard[];

export function getCardById(id: number): TarotCard | null {
  return TAROT_CARDS.find((c) => c.id === id) ?? null;
}

/** KST "YYYY-MM-DD" for `now` (en-CA → ISO-like date). Client + server safe. */
export function kstDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

/** Deterministic 32-bit FNV-1a hash. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Card of the Day: stable per (person, date), varied per person via full pillars. */
export function drawDailyCard(saju: UserSaju, dateStr: string): TarotCard {
  const { year, month, day, hour } = saju.pillars;
  const seed = `${year}${month}${day}${hour ?? ""}|${dateStr}`;
  return TAROT_CARDS[fnv1a(seed) % TAROT_CARDS.length];
}

/** Static reading used when the LLM/DB is unavailable. */
export function tarotFallbackReading(card: TarotCard, elementLabel: string): string {
  return `${card.name_en} is your card today — ${card.theme}. Let your ${elementLabel} energy lead the way, and good things will follow. ✨`;
}
