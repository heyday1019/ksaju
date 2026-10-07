import { wuxingBalance, ELEMENT_TEXT, WUXING_KO } from "../lib/saju-display";
import { wuxingSummaryKo } from "../content/ko/labels";
import type { UserSaju, WuXing } from "../lib/saju-types";

const ELS: WuXing[] = ["wood", "fire", "earth", "metal", "water"];

export function WuxingBalance({ saju }: { saju: UserSaju }) {
  const b = wuxingBalance(saju);
  const max = Math.max(1, ...ELS.map((e) => b[e]));
  return (
    <div className="flex flex-col gap-3">
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
      {/* 막대만 두면 숫자의 뜻을 알 수 없다 — 규칙기반 한 문장으로 풀어준다. */}
      <p className="text-sm leading-relaxed text-gray-500">{wuxingSummaryKo(b)}</p>
    </div>
  );
}
