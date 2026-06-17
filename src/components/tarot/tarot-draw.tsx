"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { drawDailyCard, kstDateString } from "@/lib/tarot";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import { track } from "@/lib/analytics";
import type { UserSaju } from "@/lib/saju-types";

export function TarotDraw({ saju }: { saju: UserSaju }) {
  const t = useTranslations("Tarot");
  const locale = useLocale();
  const [revealed, setRevealed] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const card = drawDailyCard(saju, kstDateString());
  const accent = ELEMENT_TEXT[elementOf(saju.dayMaster)];

  useEffect(() => {
    if (!revealed) return;
    fetch(`/api/tarot-reading?cardId=${card.id}&dayMaster=${encodeURIComponent(saju.dayMaster)}&locale=${locale}`)
      .then((r) => r.json() as Promise<{ message: string }>)
      .then((d) => setReading(d.message))
      .catch(() => setReading(null));
  }, [revealed, card.id, saju.dayMaster, locale]);

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
          {reading === null ? (
            <p className="animate-pulse text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">&ldquo;{reading}&rdquo;</p>
          )}
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
