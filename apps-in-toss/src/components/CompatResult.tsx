import type { SajuPillars } from "../lib/compatibility";
import { calcCompatibility } from "../lib/compatibility";
import { getReading } from "../lib/reading";
import { compatLabelKo } from "../content/ko/labels";
import { elementOf, ELEMENT_TEXT } from "../lib/saju-display";

/** 궁합 상대. 아이돌이든 저장한 친구든 같은 모양으로 받는다. */
export type CompatOther = { name: string; pillars: SajuPillars };

/** 년·월·일 3기둥 한자를 오행색으로. 웹앱 공유카드의 HanjaPillars 와 같은 규칙. */
function HanjaPillars({ pillars }: { pillars: SajuPillars }) {
  return (
    <div className="hanja flex items-center justify-center gap-1.5 text-lg font-bold">
      {[pillars.year, pillars.month, pillars.day].map((p, i) => (
        <span key={i} className="inline-flex gap-0.5">
          <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
          <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
        </span>
      ))}
    </div>
  );
}

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="truncate text-[11px] font-bold tracking-wider text-gray-500">
        {label}
      </p>
      <HanjaPillars pillars={pillars} />
    </div>
  );
}

export function CompatResult({
  meName,
  mePillars,
  other,
}: {
  meName: string;
  mePillars: SajuPillars;
  other: CompatOther;
}) {
  const r = calcCompatibility(mePillars, other.pillars);
  const label = compatLabelKo(mePillars.day[0], other.pillars.day[0]);
  const reading = getReading(mePillars, other.pillars, r.score, "ko");

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="text-xs font-bold tracking-[0.2em] text-[var(--color-jindallae)]">
        {meName} ✕ {other.name}
      </p>

      <div>
        <p className="hanja bg-gradient-to-br from-[var(--color-jindallae)] to-[var(--color-dancheong)] bg-clip-text text-7xl font-bold leading-none text-transparent">
          {r.score}
          <span className="text-3xl text-gray-400">/100</span>
        </p>
        <p className="mt-2 text-xl font-bold">{label}</p>
      </div>

      <p className="text-[15px] leading-relaxed">{reading}</p>

      <div className="flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-4">
        <MiniSaju label={meName} pillars={mePillars} />
        <span className="hanja flex-shrink-0 text-2xl text-[var(--color-dancheong)]">
          ✕
        </span>
        <MiniSaju label={other.name} pillars={other.pillars} />
      </div>
    </div>
  );
}
