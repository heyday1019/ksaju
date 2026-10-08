import type { CardReading } from "../content/ko/ktarot";

/**
 * 카드 한 장의 리딩. '오늘의 타로'와 '타로 3장'이 같은 모양을 쓴다.
 *
 * 메이저 22장은 작성된 본문 + 연애·일·돈·조언 3줄을 받고,
 * 마이너 56장은 조립된 본문 + 오행 조언 한 줄을 받는다. 둘 다 끝에 모티프 한 줄.
 */
export function CardReadingView({
  reading,
  compact = false,
}: {
  reading: CardReading;
  compact?: boolean;
}) {
  const { title, alias, orientation, orientationLabel, body, topics, advice, hook } =
    reading;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className={compact ? "text-sm font-bold" : "text-lg font-bold"}>
            {title}
          </h3>
          {/* 그림을 180° 돌리지 않는다 — 이 덱은 카드명이 그림에 구워져 있어
              뒤집으면 글씨가 거꾸로 선다. 대신 배지로 방향을 알린다. */}
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              orientation === "up"
                ? "bg-[var(--color-jindallae)]/10 text-[var(--color-jindallae)]"
                : "bg-black/8 text-gray-500"
            }`}
          >
            {orientationLabel}
          </span>
        </div>
        {alias && !compact && (
          <p className="text-xs text-gray-400">{alias}</p>
        )}
      </div>

      <p className={compact ? "text-[13px] leading-relaxed" : "text-sm leading-relaxed"}>
        {body}
      </p>

      {topics && !compact && (
        <dl className="flex flex-col gap-1.5 rounded-xl bg-white/60 px-3.5 py-3 text-[13px]">
          <Topic label="연애" value={topics.love} />
          <Topic label="일·돈" value={topics.work} />
          <Topic label="오늘의 조언" value={topics.advice} />
        </dl>
      )}

      {advice && !compact && (
        <p className="text-[13px] text-gray-500">{advice}</p>
      )}

      {hook && !compact && (
        <p className="text-xs italic text-[var(--color-dancheong)]">— {hook}</p>
      )}
    </div>
  );
}

function Topic({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-bold text-gray-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
