"use client";

import { forwardRef } from "react";
import { dayMasterInfo, elementLabel } from "@/lib/saju-display";
import { ShareCardFooter } from "@/components/share/share-card-footer";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = { saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; synthesis: string; locale?: string };

const TITLE: Record<string, string> = {
  en: "Past · Present · Future", ko: "과거 · 현재 · 미래", ja: "過去 · 現在 · 未来", "zh-TW": "過去 · 現在 · 未來",
};

/** 9:16 spread share card (360×640 → pixelRatio 3 → 1080×1920). Self-contained. */
export const SpreadShareCard = forwardRef<HTMLDivElement, Props>(
  function SpreadShareCard({ saju, cards, synthesis, locale = "en" }, ref) {
    const dm = dayMasterInfo(saju.dayMaster);
    const isKo = locale === "ko";
    const title = TITLE[locale] ?? TITLE.en;
    return (
      <div
        ref={ref}
        className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
        style={{ width: 360, height: 640 }}
      >
        <div className="changsal-band absolute left-0 right-0 top-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 px-7 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {title} · {elementLabel(dm.element, locale)}
          </p>
          <div className="flex justify-center gap-2">
            {cards.map((c) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c.id} src={`/tarot/${c.filename}`} alt={isKo ? c.name_kr : c.name_en} className="w-[92px] rounded-md shadow-md" />
            ))}
          </div>
          <p className="font-serif text-sm leading-snug text-foreground">&ldquo;{synthesis}&rdquo;</p>
        </div>

        <ShareCardFooter />

        <div className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />
      </div>
    );
  },
);
