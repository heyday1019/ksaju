"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { drawDailyCard, kstDateString } from "@/lib/tarot";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import { track } from "@/lib/analytics";
import type { UserSaju } from "@/lib/saju-types";

export function TarotDraw({ saju }: { saju: UserSaju }) {
  const t = useTranslations("Tarot");
  const [revealed, setRevealed] = useState(false);
  const card = drawDailyCard(saju, kstDateString());
  const accent = ELEMENT_TEXT[elementOf(saju.dayMaster)];

  const reveal = () => {
    setRevealed(true);
    track("card_generated", { feature: "tarot", card_id: card.id });
  };

  return (
    <div className="space-y-4">
      {revealed ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/tarot/${card.filename}`}
            alt={card.name_en}
            className="mx-auto w-56 rounded-xl shadow-lg"
          />
          <div>
            <p className={`font-display text-2xl font-bold ${accent}`}>{card.name_en}</p>
            <p className="hanja text-sm text-muted-foreground">{card.name_kr}</p>
            <p className="font-serif text-sm text-foreground mt-1">{card.theme}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("comeback")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-80 w-56 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 text-5xl">
            🃏
          </div>
          <Button size="lg" className="w-full" onClick={reveal}>
            {t("drawButton")}
          </Button>
        </div>
      )}
    </div>
  );
}
