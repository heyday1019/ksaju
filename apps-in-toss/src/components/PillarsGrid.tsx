import { pillarKo, elementOf, ELEMENT_TEXT } from "../lib/saju-display";
import type { UserSaju } from "../lib/saju-types";

const ORDER: [keyof UserSaju["pillars"], string][] = [
  ["year", "년주"],
  ["month", "월주"],
  ["day", "일주"],
  ["hour", "시주"],
];

export function PillarsGrid({ saju }: { saju: UserSaju }) {
  return (
    <div className="grid grid-cols-4 gap-1.5 text-center">
      {ORDER.map(([k, label]) => {
        const p = saju.pillars[k];
        return (
          <div
            key={k}
            className="rounded-xl border border-black/5 bg-white/70 px-1 py-2.5"
          >
            <div className="text-[11px] text-gray-400">{label}</div>
            {p ? (
              <>
                <div className="hanja mt-1 flex justify-center gap-0.5 text-2xl font-bold leading-tight">
                  <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
                  <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {pillarKo(p)}
                </div>
              </>
            ) : (
              // 출생 시각을 안 넣으면 시주는 계산되지 않는다 — 점 하나보다 말로 알린다
              <div className="mt-2.5 text-[11px] leading-tight text-gray-400">
                모름
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
