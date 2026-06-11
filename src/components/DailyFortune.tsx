"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { elementOf, ELEMENT_TEXT } from "@/lib/saju-display";
import type { HeavenlyStem } from "@/lib/saju-types";
import { DailyFortuneShareModal } from "@/components/fortune/DailyFortuneShareModal";
import type { DailyFortuneData } from "@/components/fortune/DailyFortuneShareCard";

export function DailyFortune({ dayMaster }: { dayMaster: HeavenlyStem }) {
  const [data, setData] = useState<DailyFortuneData | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/daily-fortune?dayMaster=${encodeURIComponent(dayMaster)}`)
      .then((r) => r.json() as Promise<DailyFortuneData>)
      .then(setData)
      .catch(() => {});
  }, [dayMaster]);

  if (!data) {
    return (
      <section
        aria-label="Loading today's fortune"
        className="animate-pulse space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
      >
        <div className="mx-auto h-3 w-32 rounded bg-muted" />
        <div className="mx-auto h-3 w-24 rounded bg-muted" />
        <div className="h-12 rounded bg-muted" />
        <div className="mx-auto h-3 w-40 rounded bg-muted" />
      </section>
    );
  }

  const todayStem = data.today_pillar[0];
  const todayEl = elementOf(todayStem);
  const pillarColor = ELEMENT_TEXT[todayEl];
  const stars = "★".repeat(data.energy) + "☆".repeat(5 - data.energy);
  const dateStr = new Date(`${data.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        ✦ Today&apos;s Fortune · 오늘의 운세
      </p>
      <p className="text-center text-xs text-muted-foreground">
        {dateStr} ·{" "}
        <span className={`hanja font-bold ${pillarColor}`}>{data.today_pillar}</span>
      </p>

      <p className="text-center text-sm leading-relaxed">
        &ldquo;{data.message}&rdquo;
      </p>

      <div className="flex items-center justify-center gap-3 text-xs">
        <span className="text-accent">{stars}</span>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary opacity-60" />
          {data.lucky_color}
        </span>
      </div>

      <div className="space-y-1 text-center">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShareOpen(true)}
        >
          Share ✨
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Come back tomorrow for a new reading 🌙
        </p>
      </div>

      <DailyFortuneShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        data={data}
      />
    </section>
  );
}
