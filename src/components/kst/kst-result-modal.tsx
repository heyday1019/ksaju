"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { KSTResult } from "@/lib/kst-types";

type KstResultModalProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  result: KSTResult | null;
};

export function KstResultModal({ open, onClose, onEdit, result }: KstResultModalProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 상단 창살 */}
        <div
          className="changsal-band absolute top-0 left-0 right-0 h-[14px] z-10"
          style={{ backgroundSize: "40px 14px" }}
        />

        <div className="px-6 pt-8 pb-6 space-y-4">
          {/* 원본 시각 */}
          <section>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              In your timezone
            </p>
            <p className="text-sm text-muted-foreground">
              {result.sourceLocal.dateLabel}
              {result.sourceLocal.timeLabel && ` · ${result.sourceLocal.timeLabel}`}
              {` · ${result.sourceLocal.timezone.city} (${result.sourceLocal.timezone.gmt})`}
            </p>
          </section>

          <div className="text-center text-accent font-calli text-3xl select-none">↓</div>

          {/* KST 결과 */}
          <section className="text-center space-y-1">
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
              In Korea (KST)
            </p>
            <p className="font-serif font-bold text-2xl text-foreground">
              {result.kst.dateLabelKo}
            </p>
            {result.kst.timeLabel && (
              <p className="font-display font-bold text-4xl bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                {result.kst.timeLabel}
              </p>
            )}
            <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mt-1">
              {result.kst.weekdayKo} · {result.kst.weekdayEn}
            </span>
          </section>

          {/* 12지지 또는 hint */}
          {result.jiziHour ? (
            <div className="bg-accent/10 rounded-lg p-3 text-center">
              <p className="font-serif font-bold text-lg text-accent">{result.jiziHour.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {result.jiziHour.range} KST · {result.jiziHour.animal} ({result.jiziHour.animalKo})
              </p>
              <p className="text-[11px] font-semibold text-primary mt-1">
                ★ This becomes your 시주 (hour pillar) in saju.
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-3 text-center text-[11px] text-muted-foreground">
              Provide a birth time to see your 12지지 hour and full saju.
            </div>
          )}

          {/* Fun fact */}
          <div className="border-l-[3px] border-primary bg-primary/5 px-3 py-2 rounded-r text-xs">
            <strong className="text-primary">Fun fact:</strong> {result.funFact}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <div className="relative">
              <Button disabled className="w-full">
                Discover your saju →
              </Button>
              <span className="absolute -top-2 -right-1 bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-[9px] font-bold">
                Coming Soon
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="w-full opacity-70">
              ← Edit my info
            </Button>
          </div>
        </div>

        {/* 하단 창살 */}
        <div
          className="changsal-band absolute bottom-0 left-0 right-0 h-[14px] z-10"
          style={{ backgroundSize: "40px 14px" }}
        />
      </DialogContent>
    </Dialog>
  );
}
