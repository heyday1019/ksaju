"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FortuneCard } from "./fortune-card";
import { FortuneShareModal } from "./fortune-share-modal";
import { calcFortune } from "@/lib/fortune";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

/**
 * '내 사주' 뷰 안의 운세 섹션. calcFortune → 4카드 그리드 + Share(공유 카드 모달).
 */
export function FortuneSection({
  userSaju,
  luck,
}: {
  userSaju: UserSaju;
  luck: CurrentLuck;
}) {
  const t = useTranslations("Fortune");
  const cards = calcFortune(userSaju, luck);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {t("sectionTitle")} · 운세
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((card) => (
          <FortuneCard key={card.key} card={card} />
        ))}
      </div>

      <div className="space-y-1 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShareOpen(true)}
          className="w-full"
        >
          {t("shareButton")}
        </Button>
        <p className="text-[10px] text-muted-foreground">{t("disclaimer")}</p>
      </div>

      <FortuneShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        userSaju={userSaju}
        luck={luck}
      />
    </section>
  );
}
