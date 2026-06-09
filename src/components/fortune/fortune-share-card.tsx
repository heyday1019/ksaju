import { forwardRef } from "react";
import { calcFortune } from "@/lib/fortune";
import { dayMasterInfo, WUXING_META } from "@/lib/saju-display";
import type { UserSaju, CurrentLuck, WuXing } from "@/lib/saju-types";
import { ShareCardFooter } from "@/components/share/share-card-footer";

// 정적 오행 색 클래스 (Tailwind v4 JIT 스캔용 리터럴) — fortune-card.tsx와 동일 패턴.
const ACCENT: Record<WuXing, string> = {
  wood: "bg-wuxing-mok/10 text-wuxing-mok",
  fire: "bg-wuxing-hwa/10 text-wuxing-hwa",
  earth: "bg-wuxing-to/10 text-wuxing-to",
  metal: "bg-wuxing-geum/10 text-wuxing-geum",
  water: "bg-wuxing-su/10 text-wuxing-su",
};

type FortuneShareCardProps = { userSaju: UserSaju; luck: CurrentLuck };

/**
 * Dedicated 9:16 fortune share card (360×640 base). Captured by the export
 * engine at pixelRatio 3 → 1080×1920 PNG. Self-contained styling so it renders
 * identically off the modal's preview and in the exported image. Calls
 * calcFortune internally (mirrors CompatShareCard calling getReading).
 */
export const FortuneShareCard = forwardRef<HTMLDivElement, FortuneShareCardProps>(
  function FortuneShareCard({ userSaju, luck }, ref) {
    const cards = calcFortune(userSaju, luck);
    const dm = dayMasterInfo(userSaju.dayMaster);
    const meta = WUXING_META[dm.element];
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

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 px-7 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            My Saju Fortune
          </p>

          <div>
            <p className="font-display text-5xl font-bold text-foreground">
              <span className="hanja">{dm.char}</span> {meta.label}
            </p>
            <p className="hanja text-lg text-muted-foreground">
              {userSaju.pillars.day}
            </p>
            <p className="font-serif text-sm text-foreground">{dm.keyword}</p>
          </div>

          <ul className="w-full space-y-2 text-left">
            {cards.map((card) => (
              <li
                key={card.key}
                className="rounded-xl border border-border bg-card/60 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {card.emoji} {card.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACCENT[card.element]}`}
                  >
                    {card.tierLabel}
                  </span>
                </div>
                <p className="text-sm leading-snug text-foreground">
                  {card.line}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <ShareCardFooter />

        <div
          className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />
      </div>
    );
  },
);
