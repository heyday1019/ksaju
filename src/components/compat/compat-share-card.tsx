import { forwardRef } from "react";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";
import { getReading } from "@/lib/reading";

/** Compatibility counterpart (idol or general partner) shown on the card. */
export type CompatOther = { name: string; sub?: string; pillars: SajuPillars };

type CompatShareCardProps = {
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
};

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="hanja text-xl font-bold">
        {pillars.year} {pillars.month} {pillars.day}
      </p>
    </div>
  );
}

/**
 * Dedicated 9:16 share card (360×640 base). Captured by the export engine at
 * pixelRatio 3 → 1080×1920 PNG. Self-contained styling so it renders identically
 * off the modal's scaled preview and in the exported image.
 */
export const CompatShareCard = forwardRef<HTMLDivElement, CompatShareCardProps>(
  function CompatShareCard({ mePillars, other, result }, ref) {
    const headerLabel = other.sub ? `${other.name} · ${other.sub}` : other.name;
    const reading = getReading(mePillars, other.pillars, result.score);
    return (
      <div
        ref={ref}
        className="hanji-paper relative flex flex-col items-center justify-between overflow-hidden text-center"
        style={{ width: 360, height: 640 }}
      >
        <div
          className="changsal-band absolute left-0 right-0 top-0 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />

        <div className="flex w-full flex-1 flex-col items-center justify-center gap-5 px-7 pt-10">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            You × {headerLabel}
          </p>

          <div>
            <p className="font-display text-7xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {result.score}
              <span className="text-3xl text-muted-foreground">/100</span>
            </p>
            <p className="font-serif text-xl font-bold text-foreground">
              {result.label}
            </p>
          </div>

          <p className="font-serif text-base leading-relaxed text-foreground">
            {reading}
          </p>

          <div className="flex w-full items-center justify-around rounded-xl border border-border bg-card/60 py-4">
            <MiniSaju label="You" pillars={mePillars} />
            <span className="font-calli text-3xl text-accent">×</span>
            <MiniSaju label={other.name} pillars={other.pillars} />
          </div>
        </div>

        <div className="w-full pb-9">
          <p className="font-display text-base font-semibold text-primary">
            ksaju.me
          </p>
          <p className="text-[11px] text-muted-foreground">
            For entertainment 🌙
          </p>
        </div>

        <div
          className="changsal-band absolute bottom-0 left-0 right-0 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />
      </div>
    );
  },
);
