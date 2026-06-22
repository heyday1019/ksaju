import type { TarotCard } from "../../lib/tarot";
import type { WuXing } from "../../lib/saju-types";
import { elementLabel } from "../../lib/saju-display";

const SUIT_NUANCE: Record<TarotCard["suit"], string> = {
  major: "큰 흐름과 운명적인 메시지",
  wands: "열정과 행동",
  cups: "감정과 관계",
  swords: "생각과 결단",
  pentacles: "현실과 결실",
};

export function dailyReadingKo(card: TarotCard, element: WuXing): string {
  const el = elementLabel(element, "ko");
  return `오늘 당신의 카드는 '${card.name_kr}' — ${SUIT_NUANCE[card.suit]}의 카드예요. ${el}의 기운을 믿고 나아가면 좋은 일이 따라올 거예요. ✨`;
}

export function spreadReadingKo(
  cards: [TarotCard, TarotCard, TarotCard],
  element: WuXing,
): { past: string; present: string; future: string; synthesis: string } {
  const [p, c, f] = cards;
  const el = elementLabel(element, "ko");
  return {
    past: `과거의 카드 '${p.name_kr}' — 지나온 길(${SUIT_NUANCE[p.suit]})이 지금의 당신을 만들었어요.`,
    present: `현재의 카드 '${c.name_kr}' — 지금은 ${SUIT_NUANCE[c.suit]}에 집중할 때예요.`,
    future: `미래의 카드 '${f.name_kr}' — 앞으로는 ${SUIT_NUANCE[f.suit]}의 흐름이 당신 편이에요.`,
    synthesis: `${el}의 기운을 믿고 흐름을 따라가면, 과거의 경험이 현재를 지나 좋은 미래로 이어질 거예요. ✨`,
  };
}
