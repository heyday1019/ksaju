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

/**
 * 생일이 아직 없을 때 같은 자리에 놓는 티저.
 *
 * 첫 진입에서 생일을 **강요하지 않는다** — 이 카드를 무시하고 아래 폼을 바로 써도
 * 되고, 눌렀을 때 폼으로 데려갈 뿐이다. 첫 화면에서 외부 요청이 나가지 않으므로
 * 로딩 구간에도 영향이 없다.
 */
export function DailyFortuneTeaser({ onTap }: { onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex w-full flex-col gap-2 rounded-2xl border border-dashed border-[var(--color-dancheong)]/40 bg-white/50 px-4 py-3.5 text-left"
    >
      <p className="text-[11px] font-bold tracking-[0.15em] text-gray-400">
        오늘의 운세
      </p>
      <p className="text-[15px] leading-relaxed text-gray-600">
        생일을 알려주면 오늘의 기운을 한 줄로 보여드려요.
      </p>
      <span className="text-xs font-bold text-[var(--color-jindallae)]">
        생일 입력하기 →
      </span>
    </button>
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
