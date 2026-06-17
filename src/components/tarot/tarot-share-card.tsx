"use client";

import { forwardRef } from "react";
import { dayMasterInfo, WUXING_META } from "@/lib/saju-display";
import { ShareCardFooter } from "@/components/share/share-card-footer";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = { saju: UserSaju; card: TarotCard; reading: string; locale?: string };

/** 9:16 tarot share card (360×640 → pixelRatio 3 → 1080×1920). Self-contained. */
export const TarotShareCard = forwardRef<HTMLDivElement, Props>(
  function TarotShareCard({ saju, card, reading, locale = "en" }, ref) {
    const dm = dayMasterInfo(saju.dayMaster);
    const meta = WUXING_META[dm.element];
    const isKo = locale === "ko";
    // ko locale leads with the Korean card name; other locales lead with English.
    const titleName = isKo ? card.name_kr : card.name_en;
    const subName = isKo ? card.name_en : card.name_kr;
    return (
      <div
        ref={ref}
        className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
        style={{ width: 360, height: 640 }}
      >
        <div className="changsal-band absolute left-0 right-0 top-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 px-7 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Card of the Day · {meta.label}
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/tarot/${card.filename}`} alt={titleName} className="w-40 rounded-lg shadow-md" />

          <div>
            <p className="font-display text-2xl font-bold text-foreground">{titleName}</p>
            <p className={`text-sm text-muted-foreground ${isKo ? "" : "hanja"}`}>{subName}</p>
            <p className="font-serif text-sm text-foreground mt-1">{card.theme}</p>
          </div>

          <p className="text-sm leading-snug text-foreground">&ldquo;{reading}&rdquo;</p>
        </div>

        <ShareCardFooter />

        <div className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]" style={{ backgroundSize: "40px 14px" }} />
      </div>
    );
  },
);
