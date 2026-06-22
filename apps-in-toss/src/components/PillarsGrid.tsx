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
    <div className="grid grid-cols-4 gap-2 text-center">
      {ORDER.map(([k, label]) => {
        const p = saju.pillars[k];
        return (
          <div key={k} className="rounded-lg bg-white p-2">
            <div className="text-xs text-gray-500">{label}</div>
            {p ? (
              <>
                <div className="text-2xl font-bold tracking-widest">
                  <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
                  <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
                </div>
                <div className="text-xs text-gray-500">{pillarKo(p)}</div>
              </>
            ) : (
              <div className="text-2xl text-gray-300">·</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
