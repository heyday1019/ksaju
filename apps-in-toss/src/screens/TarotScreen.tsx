import { drawDailyCard, kstDateString } from "../lib/tarot";
import { dailyReadingKo } from "../content/ko/tarot";
import { elementOf } from "../lib/saju-display";
import { TarotCardView } from "../components/TarotCardView";
import type { UserSaju } from "../lib/saju-types";

export function TarotScreen({
  me,
  onNeedSaju,
}: {
  me: UserSaju | null;
  onNeedSaju: () => void;
}) {
  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">오늘의 타로</h2>
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

  const card = drawDailyCard(me, kstDateString());
  const el = elementOf(me.dayMaster);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">오늘의 타로</h2>
      <TarotCardView card={card} />
      <p className="text-center text-sm">{dailyReadingKo(card, el)}</p>
      <p className="text-center text-xs text-gray-400">For entertainment 🌙</p>
    </section>
  );
}
