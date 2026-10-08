import { useState } from "react";
import { spreadDraw, type Draw } from "../lib/ktarot";
import { spreadReadingKo } from "../content/ko/ktarot";
import { TarotCardView } from "../components/TarotCardView";
import { CardReadingView } from "../components/CardReadingView";
import type { Profile } from "../state/profiles";

export function SpreadScreen({
  me,
  onNeedSaju,
}: {
  me: Profile | null;
  onNeedSaju: () => void;
}) {
  const [draws, setDraws] = useState<[Draw, Draw, Draw] | null>(null);

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

  const reading = draws ? spreadReadingKo(draws) : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">과거 · 현재 · 미래</h2>
      <button
        onClick={() => setDraws(spreadDraw())}
        className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
      >
        카드 뽑기
      </button>
      {draws && reading && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {draws.map((d, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-center text-[11px] tracking-wider text-gray-400">
                  {["과거", "현재", "미래"][i]}
                </p>
                <TarotCardView card={d.card} />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5">
            {reading.slots.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400">
                  {s.label}
                </p>
                <CardReadingView reading={s.reading} />
              </div>
            ))}
            <p className="rounded-xl bg-white/60 px-3.5 py-3 text-sm font-bold leading-relaxed">
              {reading.synthesis}
            </p>
          </div>
          <p className="text-center text-xs text-gray-400">
            재미로 보는 콘텐츠예요 🌙
          </p>
        </>
      )}
    </section>
  );
}
