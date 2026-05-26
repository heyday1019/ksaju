import { WUXING_META } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";

// 정적 오행 배경색 클래스 (Tailwind v4 JIT 스캔용 리터럴).
const BG: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/15 text-wuxing-mok",
  fire: "bg-wuxing-hwa/15 text-wuxing-hwa",
  earth: "bg-wuxing-to/15 text-wuxing-to",
  metal: "bg-wuxing-geum/15 text-wuxing-geum",
  water: "bg-wuxing-su/15 text-wuxing-su",
};

const ORDER: WuXing[] = ["wood", "fire", "earth", "metal", "water"];

/** 오행 분포 칩 5개 (원소 + count). */
export function WuxingBalance({
  balance,
}: {
  balance: Record<WuXing, number>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {ORDER.map((el) => {
        const meta = WUXING_META[el];
        return (
          <span
            key={el}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${BG[el]}`}
            aria-label={`${meta.label}: ${balance[el]}`}
          >
            <span aria-hidden="true">{meta.emoji}</span>
            {meta.label}
            <span className="font-bold">{balance[el]}</span>
          </span>
        );
      })}
    </div>
  );
}
