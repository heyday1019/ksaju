"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PillarsGrid } from "./pillars-grid";
import { WuxingBalance } from "./wuxing-balance";
import { FortuneSection } from "@/components/fortune/fortune-section";
import { DailyFortune } from "@/components/DailyFortune";
import { dayMasterInfo, wuxingBalance, WUXING_META } from "@/lib/saju-display";
import { getDailyFact } from "@/lib/daily-fact";
import type { UserSaju, CurrentLuck, HeavenlyStem } from "@/lib/saju-types";
import type { KSTResult } from "@/lib/kst-types";

type SajuResultProps = {
  userSaju: UserSaju;
  kst: KSTResult;
  currentLuck: CurrentLuck;
  onEdit: () => void;
};

/** '내 사주' 인페이지 결과 뷰 (메인). 궁합·공유는 다음 사이클 모달. */
export function SajuResult({ userSaju, kst, currentLuck, onEdit }: SajuResultProps) {
  const dm = dayMasterInfo(userSaju.dayMaster);
  const dmMeta = WUXING_META[dm.element];
  const balance = wuxingBalance(userSaju);

  return (
    <div className="space-y-6">
      {/* 오늘의 운세 */}
      <DailyFortune dayMaster={userSaju.dayMaster as HeavenlyStem} />

      <header className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Your Saju · 사주
        </p>
        <p className="text-sm text-muted-foreground">
          {kst.kst.dateLabelKo}
          {kst.kst.timeLabel && ` · ${kst.kst.timeLabel}`} KST
        </p>
      </header>

      {/* 4기둥 */}
      <PillarsGrid pillars={userSaju.pillars} />

      {/* 일간 (Day Master) */}
      <section className="rounded-xl bg-primary/5 px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Day Master · 일간
        </p>
        <p className="mt-1">
          <span className="hanja text-3xl font-bold">{dm.char}</span>{" "}
          <span className="font-semibold">
            {dmMeta.emoji} {dmMeta.label}
          </span>
        </p>
        <p className="text-sm italic text-primary">{dm.keyword}</p>
      </section>

      {/* 오행 밸런스 */}
      <section className="space-y-2">
        <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Your Elements · 오행
        </p>
        <WuxingBalance balance={balance} />
      </section>

      {/* 운세 (Your Fortune) */}
      <FortuneSection userSaju={userSaju} luck={currentLuck} />

      {/* KST · 12지지 · fun fact (기존 모달에서 흡수) */}
      <section className="space-y-2 rounded-xl border border-border p-3">
        <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {kst.kst.weekdayKo} · {kst.kst.weekdayEn}
        </span>
        {kst.jiziHour ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-serif font-bold text-accent">
              {kst.jiziHour.name}
            </span>{" "}
            · {kst.jiziHour.range} KST · {kst.jiziHour.animal} (
            {kst.jiziHour.animalKo})
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Add a birth time to reveal your 시주 (hour pillar).
          </p>
        )}
        <p className="border-l-[3px] border-primary bg-primary/5 px-3 py-2 text-xs">
          <strong className="text-primary">Today&apos;s saju tip ✨</strong>{" "}
          {getDailyFact(userSaju.dayMaster)}
        </p>
      </section>

      {/* 궁합 CTA → '인연' 페이지 */}
      <Link
        href="/inyeon"
        className="block w-full rounded-xl bg-gradient-to-br from-primary to-accent px-4 py-3 text-center font-display font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        Check your 인연 (compatibility) ✨ →
      </Link>

      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="w-full opacity-70"
      >
        ← Edit my info
      </Button>
    </div>
  );
}
