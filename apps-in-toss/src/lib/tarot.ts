import tarot from "../data/ksaju-tarot.json";
import type { WuXing, UserSaju } from "./saju-types";
import { WUXING_META, elementLabel } from "./saju-display";

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

const FALLBACK_LOCALES = ["en", "ko", "ja", "zh-TW"] as const;

/** Static reading used when the LLM/DB is unavailable. Localized by `locale`. */
export function tarotFallbackReading(card: TarotCard, element: WuXing, locale: string = "en"): string {
  const loc = (FALLBACK_LOCALES as readonly string[]).includes(locale) ? locale : "en";
  const meta = WUXING_META[element];
  switch (loc) {
    case "ko":
      return `오늘 당신의 카드는 '${card.name_kr}'! ${elementLabel(element, "ko")} 기운을 믿고 나아가면 좋은 일이 따라올 거예요. ✨`;
    case "ja":
      return `今日のあなたのカードは「${card.name_en}」。${meta.hanja}のエネルギーを信じて進めば、きっと良いことが訪れます。✨`;
    case "zh-TW":
      return `你今天的牌是「${card.name_en}」。順著你的${meta.hanja}能量前行，好事自然會來。✨`;
    default:
      return `${card.name_en} is your card today — ${card.theme}. Let your ${meta.label} energy lead the way, and good things will follow. ✨`;
  }
}

export type SpreadReading = { past: string; present: string; future: string; synthesis: string };

/** Three distinct random cards (upright). NOT deterministic — different each draw. Pass `rng` for tests. */
export function drawSpread(rng: () => number = Math.random): [TarotCard, TarotCard, TarotCard] {
  const deck = [...TAROT_CARDS];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1], deck[2]];
}

/** Static 3-card reading used when the LLM is unavailable. Localized by `locale`. */
export function tarotSpreadFallbackReading(
  cards: [TarotCard, TarotCard, TarotCard],
  element: WuXing,
  locale: string = "en",
): SpreadReading {
  const loc = (FALLBACK_LOCALES as readonly string[]).includes(locale) ? locale : "en";
  const [p, c, f] = cards;
  const el = elementLabel(element, loc);
  const name = (card: TarotCard) => (loc === "ko" ? card.name_kr : card.name_en);
  switch (loc) {
    case "ko":
      return {
        past: `과거의 카드 '${name(p)}' — ${p.theme}`,
        present: `현재의 카드 '${name(c)}' — ${c.theme}`,
        future: `미래의 카드 '${name(f)}' — ${f.theme}`,
        synthesis: `${el} 기운을 믿고 흐름을 따라가면, 과거의 경험이 현재를 지나 좋은 미래로 이어질 거예요. ✨`,
      };
    case "ja":
      return {
        past: `過去のカード「${name(p)}」— ${p.theme}`,
        present: `現在のカード「${name(c)}」— ${c.theme}`,
        future: `未来のカード「${name(f)}」— ${f.theme}`,
        synthesis: `${el}のエネルギーを信じて流れに乗れば、過去の経験が現在を経て良い未来へつながります。✨`,
      };
    case "zh-TW":
      return {
        past: `過去之牌「${name(p)}」— ${p.theme}`,
        present: `現在之牌「${name(c)}」— ${c.theme}`,
        future: `未來之牌「${name(f)}」— ${f.theme}`,
        synthesis: `順著你的${el}能量前行，過去的經驗會穿越現在，引向美好的未來。✨`,
      };
    default:
      return {
        past: `Your past card, ${name(p)} — ${p.theme}.`,
        present: `Your present card, ${name(c)} — ${c.theme}.`,
        future: `Your future card, ${name(f)} — ${f.theme}.`,
        synthesis: `Trust your ${el} energy and let it flow — what you learned carries you through today into a brighter future. ✨`,
      };
  }
}
