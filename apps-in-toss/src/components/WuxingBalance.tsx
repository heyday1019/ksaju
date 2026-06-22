import { wuxingBalance, ELEMENT_TEXT, WUXING_KO } from "../lib/saju-display";
import type { UserSaju, WuXing } from "../lib/saju-types";

const ELS: WuXing[] = ["wood", "fire", "earth", "metal", "water"];

export function WuxingBalance({ saju }: { saju: UserSaju }) {
  const b = wuxingBalance(saju);
  const max = Math.max(1, ...ELS.map((e) => b[e]));
  return (
    <div className="flex h-24 items-end justify-around gap-2">
      {ELS.map((e) => (
        <div key={e} className="flex h-full flex-col items-center justify-end gap-1">
          <div
            className={`w-6 rounded-t bg-current ${ELEMENT_TEXT[e]}`}
            style={{ height: `${(b[e] / max) * 100}%` }}
          />
          <span className={`text-xs ${ELEMENT_TEXT[e]}`}>
            {WUXING_KO[e]} {b[e]}
          </span>
        </div>
      ))}
    </div>
  );
}
