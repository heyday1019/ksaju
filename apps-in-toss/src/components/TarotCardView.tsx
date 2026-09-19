import { useState } from "react";
import type { TarotCard } from "../lib/tarot";

/**
 * 덱 아트 78장은 번들에 싣지 않고 ksaju.me 에서 받아온다.
 *
 * 카드 아트는 첫 화면에 필요 없는 자산인데(타로는 4개 탭 중 3번째) 번들에 넣으면
 * '최초 접속 시간'에 통째로 얹힌다. 240px 로 줄여도 1.4MB 였다. 원격으로 돌리면
 * 최초 접속에는 0 이 되고, 실제로 필요한 1~4장만 장당 48KB 로 받는다.
 * 대신 화질을 400px 로 되돌릴 수 있었다.
 *
 * 받지 못하면(오프라인·CDN 장애) 카드 자리를 접고 이름만 남긴다 — 타로 자체는
 * 사주+날짜로 로컬에서 결정되므로 아트가 없어도 기능은 동작한다.
 */
const DECK_BASE = "https://ksaju.me/tarot-webp";

export function tarotArtOf(filename: string): string {
  return `${DECK_BASE}/${filename.replace(/\.png$/, ".webp")}`;
}

export function TarotCardView({
  card,
  showCaption = true,
  className = "",
}: {
  card: TarotCard;
  /** 덱 아트 배너에 카드 이름이 이미 그려져 있다. 크게 띄워 배너가 읽히면 끈다. */
  showCaption?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={`flex flex-col items-center gap-1.5 ${className}`}>
      {failed ? (
        <div className="flex aspect-[848/1264] w-full items-center justify-center rounded-lg border border-black/10 bg-white text-4xl">
          🃏
        </div>
      ) : (
        <img
          src={tarotArtOf(card.filename)}
          alt={card.name_kr}
          width={400}
          height={596}
          // 공유 카드를 캔버스로 캡처하려면 CORS 로 받아야 한다
          crossOrigin="anonymous"
          loading="eager"
          onError={() => setFailed(true)}
          className="w-full rounded-lg border border-black/10 bg-white/50 shadow-md"
        />
      )}
      {(showCaption || failed) && (
        <figcaption className="text-center text-sm font-bold">
          {card.name_kr}
        </figcaption>
      )}
    </figure>
  );
}
