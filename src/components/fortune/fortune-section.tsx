"use client";

import { Button } from "@/components/ui/button";
import { FortuneCard } from "./fortune-card";
import { calcFortune } from "@/lib/fortune";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

/**
 * '내 사주' 뷰 안의 운세 섹션. calcFortune → 4카드 그리드 + 비활성 Share 티저.
 * 실제 공유(이미지 export)는 후속 공통기반 사이클.
 */
export function FortuneSection({
  userSaju,
  luck,
}: {
  userSaju: UserSaju;
  luck: CurrentLuck;
}) {
  const cards = calcFortune(userSaju, luck);

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
        <Button variant="outline" size="sm" disabled className="w-full">
          Share ☮ (soon)
        </Button>
        <p className="text-[10px] text-muted-foreground">For entertainment 🌙</p>
      </div>
    </section>
  );
}
