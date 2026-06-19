"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { SpreadShareModal } from "./spread-share-modal";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import type { SpreadReading, TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

const POSITIONS = ["past", "present", "future"] as const;

export function SpreadResult({
  saju, cards, reading, onReplay,
}: { saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; reading: SpreadReading; onReplay: () => void }) {
  const t = useTranslations("TarotSpread");
  const locale = useLocale();
  const [shareOpen, setShareOpen] = useState(false);
  const accent = ELEMENT_TEXT[elementOf(saju.dayMaster)];
  const isKo = locale === "ko";
  const lines = [reading.past, reading.present, reading.future];

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-3">
        {cards.map((c, i) => (
          <div key={c.id} className="w-[96px] text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/tarot/${c.filename}`}
              alt={isKo ? c.name_kr : c.name_en}
              className={`w-full rounded-lg shadow-lg ${i === 1 ? "scale-105" : ""}`}
            />
            <p className={`mt-1 text-[11px] font-bold uppercase ${accent}`}>{t(POSITIONS[i])}</p>
            <p className="font-display text-xs font-semibold text-foreground">{isKo ? c.name_kr : c.name_en}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-left">
        {POSITIONS.map((pos, i) => (
          <p key={pos} className="text-sm leading-relaxed text-foreground">
            <span className={`font-bold ${accent}`}>{t(pos)} · </span>{lines[i]}
          </p>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-4">
        <p className="font-serif text-sm leading-relaxed text-foreground">&ldquo;{reading.synthesis}&rdquo;</p>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={() => setShareOpen(true)}>{t("shareButton")}</Button>
        <Button variant="ghost" className="w-full" onClick={onReplay}>{t("replay")}</Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">{t("disclaimer")}</p>

      <SpreadShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        saju={saju}
        cards={cards}
        synthesis={reading.synthesis}
      />
    </div>
  );
}
