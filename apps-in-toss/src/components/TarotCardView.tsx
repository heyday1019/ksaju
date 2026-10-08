import { useState } from "react";
import type { TarotCard } from "../lib/tarot";

/**
 * 덱 아트 78장을 번들에 싣는다.
 *
 * 한동안 ksaju.me 에서 받아왔다. '최초 접속 20초 초과'로 네 번 반려됐을 때
 * 용량을 줄이려고 뺐던 것인데, **그 반려의 원인은 용량이 아니라 광고 SDK 였다**
 * (같은 4.13MB 번들 두 개가 광고 배치만 달리해서 반려/승인으로 갈렸다).
 * 그 뒤 SDK 3.x 가 프레임워크 페이로드 3.52MB 를 걷어내 `.ait` 가 0.28MB 가 됐고,
 * 4.14MB 는 이미 두 번 승인받은 크기다. 즉 3.8MB 의 검증된 여유가 생겼다.
 *
 * 원격으로 두면 회선이 느릴 때 카드가 늦게 뜬다(실사용 제보). 번들에 넣으면
 * 네트워크를 아예 타지 않으므로 지연이 0 이고 기내·지하에서도 뜬다.
 * 화질은 그대로다 — 원본 400px 파일을 재인코딩 없이 복사했다(세대 손실 없음).
 *
 * 이미지는 각각 별도 자산 파일로 나간다. 초기 JS 청크에는 URL 문자열만 들어가고
 * 실제 그림은 화면에 보일 때 로컬에서 읽힌다.
 *
 * 혹시 못 읽으면 카드 자리를 접고 이름만 남긴다 — 타로 자체는 사주+날짜로
 * 로컬에서 결정되므로 아트가 없어도 기능은 동작한다.
 */
const DECK = import.meta.glob<string>("../assets/tarot/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** `major-00-fool.png` → 번들된 webp 의 URL */
export function tarotArtOf(filename: string): string | undefined {
  return DECK[`../assets/tarot/${filename.replace(/\.png$/, ".webp")}`];
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
  const src = tarotArtOf(card.filename);

  return (
    <figure className={`flex flex-col items-center gap-1.5 ${className}`}>
      {failed || !src ? (
        <div className="flex aspect-[848/1264] w-full items-center justify-center rounded-lg border border-black/10 bg-white text-4xl">
          🃏
        </div>
      ) : (
        <img
          src={src}
          alt={card.name_kr}
          width={400}
          height={596}
          // 번들 자산이라 같은 오리진이다 — 공유 카드를 캔버스로 캡처해도
          // 오염되지 않으므로 crossOrigin 이 필요 없다.
          loading="eager"
          onError={() => setFailed(true)}
          className="w-full rounded-lg border border-black/10 bg-white/50 shadow-md"
        />
      )}
      {(showCaption || failed || !src) && (
        <figcaption className="text-center text-sm font-bold">
          {card.name_kr}
        </figcaption>
      )}
    </figure>
  );
}
