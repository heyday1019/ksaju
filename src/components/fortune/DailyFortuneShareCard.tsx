import { forwardRef } from "react";
import { elementOf, WUXING_META, ELEMENT_TEXT } from "@/lib/saju-display";
import { ShareCardFooter } from "@/components/share/share-card-footer";
import type { WuXing } from "@/lib/saju-types";

export type DailyFortuneData = {
  id: string;
  date: string;
  day_master: string;
  today_pillar: string;
  relation: string;
  message: string;
  energy: number;
  lucky_color: string;
};

// Tailwind v4 JIT: must be static string literals — mirrors FortuneShareCard
const ACCENT_BG: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

export const DailyFortuneShareCard = forwardRef<
  HTMLDivElement,
  { data: DailyFortuneData }
>(function DailyFortuneShareCard({ data }, ref) {
  const todayStem = data.today_pillar[0];
  const todayEl = elementOf(todayStem);
  const meta = WUXING_META[todayEl];
  const pillarColor = ELEMENT_TEXT[todayEl];
  const stars = "★".repeat(data.energy) + "☆".repeat(5 - data.energy);

  return (
    <div
      ref={ref}
      className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
      style={{ width: 360, height: 640 }}
    >
      <div
        className="changsal-band absolute left-0 right-0 top-0 h-[14px]"
        style={{ backgroundSize: "40px 14px" }}
      />

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-7 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          오늘의 운세 · Daily Fortune
        </p>

        <div>
          <p className={`hanja font-display text-6xl font-bold ${pillarColor}`}>
            {data.today_pillar}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {meta.emoji} {meta.label}
          </p>
        </div>

        <p className="px-2 text-sm leading-relaxed text-foreground">
          &ldquo;{data.message}&rdquo;
        </p>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-base text-accent">{stars}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACCENT_BG[todayEl]}`}
          >
            {data.lucky_color}
          </span>
        </div>
      </div>

      <ShareCardFooter />

      <div
        className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]"
        style={{ backgroundSize: "40px 14px" }}
      />
    </div>
  );
});
