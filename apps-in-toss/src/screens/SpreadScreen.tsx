import { useState } from "react";
import { drawSpread, type TarotCard } from "../lib/tarot";
import { spreadReadingKo } from "../content/ko/tarot";
import { elementOf } from "../lib/saju-display";
import { TarotCardView } from "../components/TarotCardView";
import type { UserSaju } from "../lib/saju-types";

export function SpreadScreen({
  me,
  onNeedSaju,
}: {
  me: UserSaju | null;
  onNeedSaju: () => void;
}) {
  const [cards, setCards] = useState<
    [TarotCard, TarotCard, TarotCard] | null
  >(null);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">타로 스프레드</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button
          onClick={onNeedSaju}
          className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
        >
          내 사주 입력하러 가기
        </button>
      </section>
    );
  }

  const el = elementOf(me.dayMaster);
  const reading = cards ? spreadReadingKo(cards, el) : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">과거 · 현재 · 미래</h2>
      <button
        onClick={() => setCards(drawSpread())}
        className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
      >
        카드 뽑기
      </button>
      {cards && reading && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c, i) => (
              <TarotCardView key={i} card={c} />
            ))}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>{reading.past}</p>
            <p>{reading.present}</p>
            <p>{reading.future}</p>
            <p className="font-bold">{reading.synthesis}</p>
          </div>
          <p className="text-center text-xs text-gray-400">
            For entertainment 🌙
          </p>
        </>
      )}
    </section>
  );
}
