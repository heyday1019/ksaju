import type { TarotCard } from "../lib/tarot";

export function TarotCardView({ card }: { card: TarotCard }) {
  return (
    <div className="mx-auto w-40 rounded-xl bg-white p-3 text-center shadow">
      <div className="py-6 text-5xl">🃏</div>
      <div className="font-bold">{card.name_kr}</div>
      <div className="text-xs text-gray-500">{card.name_en}</div>
    </div>
  );
}
