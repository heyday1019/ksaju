import type { DailyFortune } from "../lib/daily";

/** 기운 세기를 점으로. 숫자보다 한눈에 읽힌다. */
function Energy({ level }: { level: number }) {
  return (
    <span aria-label={`기운 ${level}점 만점에 5점`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            i <= level ? "bg-[var(--color-jindallae)]" : "bg-black/15"
          }`}
        />
      ))}
    </span>
  );
}

/** '내 사주' 최상단 오늘의 운세 한 줄. 규칙기반·오프라인. */
export function DailyFortuneCard({
  name,
  fortune,
}: {
  name: string;
  fortune: DailyFortune;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-dancheong)]/25 bg-white/70 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400">
          {name}의 오늘
        </p>
        <Energy level={fortune.energy} />
      </div>
      <p className="text-[15px] leading-relaxed">{fortune.message}</p>
      <p className="text-xs text-gray-500">
        행운의 색 <b className="text-[var(--color-dancheong)]">{fortune.luckyColor}</b>
      </p>
    </div>
  );
}
