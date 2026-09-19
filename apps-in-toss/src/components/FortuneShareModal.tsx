import { ShareCard } from "./ShareCard";
import { ShareFooter } from "./ShareFooter";
import { ShareModal } from "./ShareModal";
import { DayMasterHero } from "./DayMasterHero";
import { ELEMENT_TEXT, elementOf } from "../lib/saju-display";
import type { FortuneCard } from "../lib/fortune";
import type { Profile } from "../state/profiles";

const TITLE: Record<FortuneCard["key"], string> = {
  money: "금전운",
  love: "연애운",
  career: "직업운",
  time: "올해 흐름",
};

/** '내 사주'의 운세 4카드를 9:16 공유 카드로. */
export function FortuneShareModal({
  profile,
  cards,
  onClose,
}: {
  profile: Profile;
  cards: FortuneCard[];
  onClose: () => void;
}) {
  return (
    <ShareModal filename="ksaju-fortune.png" onClose={onClose}>
      <ShareCard>
        <div className="flex flex-col gap-3">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-[var(--color-jindallae)]">
            {profile.name}의 오늘
          </p>
          <DayMasterHero saju={profile.saju} name={profile.name} />
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <div
                key={c.key}
                className="rounded-lg border border-black/10 bg-white/60 px-3 py-2"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[13px] font-bold">
                    {c.emoji} {TITLE[c.key]}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${ELEMENT_TEXT[c.element]}`}
                  >
                    {c.tierLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] leading-snug">{c.line}</p>
              </div>
            ))}
          </div>
          <ShareFooter />
        </div>
      </ShareCard>
    </ShareModal>
  );
}

/** 오늘의 타로 1장을 9:16 공유 카드로. */
export function TarotShareModal({
  name,
  dayMaster,
  cardImage,
  cardNameKr,
  cardNameEn,
  reading,
  onClose,
}: {
  name: string;
  dayMaster: string;
  cardImage?: string;
  cardNameKr: string;
  cardNameEn: string;
  reading: string;
  onClose: () => void;
}) {
  const accent = ELEMENT_TEXT[elementOf(dayMaster)];
  return (
    <ShareModal filename="ksaju-tarot.png" onClose={onClose}>
      <ShareCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--color-jindallae)]">
            {name}의 오늘의 카드
          </p>
          {cardImage && (
            <img
              src={cardImage}
              alt={cardNameKr}
              className="w-40 rounded-lg border border-black/10 shadow-md"
            />
          )}
          <div>
            <p className="text-lg font-bold">{cardNameKr}</p>
            <p className="text-[11px] text-gray-500">{cardNameEn}</p>
          </div>
          <p className="text-[13px] leading-relaxed">{reading}</p>
          <p className={`hanja text-2xl font-bold ${accent}`}>{dayMaster}</p>
          <ShareFooter />
        </div>
      </ShareCard>
    </ShareModal>
  );
}
