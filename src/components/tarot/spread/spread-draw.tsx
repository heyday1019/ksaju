"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { SpreadCardBack } from "./spread-card-back";
import { SpreadResult } from "./spread-result";
import { drawSpread, type SpreadReading, type TarotCard } from "@/lib/tarot";
import { track } from "@/lib/analytics";
import type { UserSaju } from "@/lib/saju-types";

const DECK_SIZE = 11;
const POSITIONS = ["past", "present", "future"] as const;

export function SpreadDraw({ saju }: { saju: UserSaju }) {
  const t = useTranslations("TarotSpread");
  const locale = useLocale();
  const [cards, setCards] = useState<[TarotCard, TarotCard, TarotCard]>(() => drawSpread());
  const [drawn, setDrawn] = useState(0);
  const [reading, setReading] = useState<SpreadReading | null>(null);
  const done = drawn >= 3;
  const isKo = locale === "ko";

  useEffect(() => { track("spread_started"); }, []);

  useEffect(() => {
    if (!done) return;
    track("spread_revealed");
    const ids = cards.map((c) => c.id).join(",");
    fetch(`/api/tarot-spread-reading?cardIds=${ids}&dayMaster=${encodeURIComponent(saju.dayMaster)}&locale=${locale}`)
      .then((r) => r.json() as Promise<SpreadReading>)
      .then(setReading)
      .catch(() => setReading(null));
  }, [done, cards, saju.dayMaster, locale]);

  const drawNext = () => {
    track("spread_card_drawn", { position: POSITIONS[drawn] });
    setDrawn((n) => n + 1);
  };

  const replay = () => {
    setCards(drawSpread());
    setDrawn(0);
    setReading(null);
    track("spread_started");
  };

  if (done && reading) {
    return <SpreadResult saju={saju} cards={cards} reading={reading} onReplay={replay} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* Fan of card backs (disappears once all 3 are drawn) */}
        <div className="relative mx-auto h-56 w-full max-w-xs">
          <AnimatePresence>
            {!done &&
              Array.from({ length: DECK_SIZE }).map((_, i) => {
                const offset = i - (DECK_SIZE - 1) / 2;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: offset * 8 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 120, damping: 14 }}
                    className="absolute left-1/2 top-2 -ml-9 w-[72px]"
                    style={{ transformOrigin: "50% 220px" }}
                  >
                    <SpreadCardBack className="w-[72px] drop-shadow-lg" />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        {/* Drawn slots: past | present | future */}
        <div className="flex justify-center gap-3">
          {POSITIONS.map((pos, i) => (
            <div key={pos} className="w-[88px] text-center">
              <div className="flex h-32 items-center justify-center">
                <AnimatePresence>
                  {drawn > i && (
                    <motion.img
                      key={cards[i].id}
                      src={`/tarot/${cards[i].filename}`}
                      alt={isKo ? cards[i].name_kr : cards[i].name_en}
                      initial={{ scale: 0, rotateY: 90 }}
                      animate={{ scale: i === 1 ? 1.1 : 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 140, damping: 16 }}
                      className="w-[80px] rounded-lg shadow-lg"
                    />
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary">{t(pos)}</p>
            </div>
          ))}
        </div>

        {/* Draw button / loading */}
        {!done && (
          <Button size="lg" className="w-full" onClick={drawNext}>
            {t("drawPosition", { position: t(POSITIONS[drawn]) })}
          </Button>
        )}
        {done && reading === null && (
          <p className="animate-pulse text-center text-sm text-muted-foreground">{t("loading")}</p>
        )}
      </div>
    </MotionConfig>
  );
}
