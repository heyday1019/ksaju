import { WUXING_META } from "@/lib/saju-display";
import type { WuXing } from "@/lib/saju-types";
import type { FortuneCard as FortuneCardData } from "@/lib/fortune";

// 정적 오행 색 클래스 (Tailwind v4 JIT 스캔용 리터럴) — wuxing-balance.tsx와 동일 패턴.
const ACCENT: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

/** 운세 카드 1개 (제목·이모지·tier 배지·fun 라인). */
export function FortuneCard({ card }: { card: FortuneCardData }) {
  const meta = WUXING_META[card.element];
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {card.emoji} {card.title}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[card.element]}`}
          title={meta.label}
        >
          {card.tierLabel}
        </span>
      </div>
      <p className="text-sm leading-snug">{card.line}</p>
      {card.subLine && (
        <p className="text-xs text-muted-foreground">{card.subLine}</p>
      )}
    </div>
  );
}
