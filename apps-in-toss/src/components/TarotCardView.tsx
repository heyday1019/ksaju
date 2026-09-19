import type { TarotCard } from "../lib/tarot";

/**
 * 덱 아트 78장. 이 모듈은 타로/스프레드 화면(지연 로드)에만 실려 있고,
 * glob 결과는 URL 문자열 78개뿐이다 — 실제 이미지는 화면에 뜬 카드만 받아간다.
 */
const ART = import.meta.glob<string>("../assets/tarot/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** 데이터의 filename(`major-00-fool.png`) → 번들된 webp URL */
export function tarotArtOf(filename: string): string | undefined {
  const key = `../assets/tarot/${filename.replace(/\.png$/, ".webp")}`;
  return ART[key];
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
  const src = tarotArtOf(card.filename);
  return (
    <figure className={`flex flex-col items-center gap-1.5 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={card.name_kr}
          width={400}
          height={596}
          className="w-full rounded-lg border border-black/10 shadow-md"
        />
      ) : (
        // 덱에 없는 파일명이어도 카드 자체는 읽히게 둔다
        <div className="flex aspect-[848/1264] w-full items-center justify-center rounded-lg border border-black/10 bg-white text-4xl">
          🃏
        </div>
      )}
      {showCaption && (
        <figcaption className="text-center text-sm font-bold">
          {card.name_kr}
        </figcaption>
      )}
    </figure>
  );
}
