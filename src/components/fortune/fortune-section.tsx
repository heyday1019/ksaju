"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FortuneCard } from "./fortune-card";
import { FortuneShareModal } from "./fortune-share-modal";
import { calcFortune } from "@/lib/fortune";
import { track } from "@/lib/analytics";
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
  const cards = calcFortune(userSaju, luck);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Your Fortune · 운세
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
          Share ✨
        </Button>
        <p className="text-[10px] text-muted-foreground">For entertainment 🌙</p>
      </div>

      <FortuneShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        userSaju={userSaju}
        luck={luck}
        onShared={(method) => track("card_shared", { kind: "fortune", method })}
      />
    </section>
  );
}
