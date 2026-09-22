import { useEffect, useState } from "react";
import { drawDailyCard, kstDateString } from "../lib/tarot";
import { dailyReadingKo } from "../content/ko/tarot";
import { elementOf } from "../lib/saju-display";
import { TarotCardView, tarotArtOf } from "../components/TarotCardView";
import { TarotShareModal } from "../components/FortuneShareModal";
import { logTarotResult } from "../lib/analytics";
import type { Profile } from "../state/profiles";

export function TarotScreen({
  me,
  onNeedSaju,
}: {
  me: Profile | null;
  onNeedSaju: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  // 사주가 있어야 카드가 나온다 — 카드를 실제로 본 경우만 기록한다.
  // 훅 순서를 지키려고 아래 early return 보다 위에 둔다.
  useEffect(() => {
    if (!me) return;
    logTarotResult();
  }, [me]);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">오늘의 타로</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button
          type="button"
          onClick={onNeedSaju}
          className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
        >
          내 사주 입력하러 가기
        </button>
      </section>
    );
  }

  const card = drawDailyCard(me.saju, kstDateString());
  const el = elementOf(me.saju.dayMaster);
  const reading = dailyReadingKo(card, el);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">오늘의 타로</h2>
      <div className="mx-auto w-40">
        <TarotCardView card={card} showCaption={false} />
      </div>
      <p className="text-center text-sm">{reading}</p>
      <button
        type="button"
        onClick={() => setSharing(true)}
        className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3.5 font-bold text-white"
      >
        이미지로 저장하기 ✨
      </button>
      <p className="text-center text-xs text-gray-400">재미로 보는 콘텐츠예요 🌙</p>
      {sharing && (
        <TarotShareModal
          name={me.name}
          dayMaster={me.saju.dayMaster}
          cardImage={tarotArtOf(card.filename)}
          cardNameKr={card.name_kr}
          cardNameEn={card.name_en}
          reading={reading}
          onClose={() => setSharing(false)}
        />
      )}
    </section>
  );
}
