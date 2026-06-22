import type { FortuneCard } from "../lib/fortune";
import { ELEMENT_TEXT } from "../lib/saju-display";

const TITLE: Record<FortuneCard["key"], string> = {
  money: "금전운",
  love: "연애운",
  career: "직업운",
  time: "올해 흐름",
};

export function FortuneCards({ cards }: { cards: FortuneCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.key} className="flex flex-col gap-1 rounded-xl bg-white p-3">
          <div className="text-sm font-bold">
            {c.emoji} {TITLE[c.key]}
          </div>
          <div className={`text-xs font-bold ${ELEMENT_TEXT[c.element]}`}>
            {c.tierLabel}
          </div>
          <p className="text-sm">{c.line}</p>
          {c.subLine && <p className="text-xs text-gray-500">{c.subLine}</p>}
        </div>
      ))}
    </div>
  );
}
