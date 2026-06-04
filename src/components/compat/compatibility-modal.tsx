"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

/** 궁합 상대(아이돌 또는 일반 상대)의 표시 정보. */
export type CompatOther = { name: string; sub?: string; pillars: SajuPillars };

type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
};

function MiniSaju({ label, pillars }: { label: string; pillars: SajuPillars }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="hanja text-lg font-bold">
        {pillars.year} {pillars.month} {pillars.day}
      </p>
    </div>
  );
}

/** 궁합 결과 + SNS 공유용 요약 모달 (이미지 export는 다음 사이클). 범용: 아이돌·일반 상대 공용. */
export function CompatibilityModal({
  open,
  onClose,
  mePillars,
  other,
  result,
  closeLabel = "← Close",
}: CompatibilityModalProps) {
  const headerLabel = other.sub ? `${other.name} · ${other.sub}` : other.name;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-md overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">
          Your saju compatibility with {other.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju compatibility score between you and {other.name}.
        </DialogDescription>

        <div
          className="changsal-band absolute left-0 right-0 top-0 z-10 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />

        <div className="space-y-4 px-6 pb-6 pt-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            You × {headerLabel}
          </p>

          {/* 점수 */}
          <div>
            <p className="font-display text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {result.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
            <p className="font-serif text-lg font-bold text-foreground">
              {result.label}
            </p>
          </div>

          {/* 양쪽 사주 미니 */}
          <div className="flex items-center justify-around rounded-xl border border-border bg-card/60 py-3">
            <MiniSaju label="You" pillars={mePillars} />
            <span className="font-calli text-2xl text-accent">×</span>
            <MiniSaju label={other.name} pillars={other.pillars} />
          </div>

          {/* breakdown */}
          <ul className="space-y-1 text-left text-xs text-muted-foreground">
            <li>
              <strong className="text-primary">Day Master:</strong>{" "}
              {result.breakdown.dayMaster.note} ({result.breakdown.dayMaster.score})
            </li>
            <li>
              <strong className="text-primary">Elements:</strong> balance{" "}
              {result.breakdown.elementBalance.score}
            </li>
            <li>
              <strong className="text-primary">Branch:</strong>{" "}
              {result.breakdown.branch.note} ({result.breakdown.branch.score})
            </li>
          </ul>

          {/* 워터마크 + 디스클레이머 */}
          <div className="pt-1">
            <p className="font-display text-sm font-semibold text-primary">
              ksaju.me
            </p>
            <p className="text-[10px] text-muted-foreground">
              For entertainment 🌙
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            {closeLabel}
          </Button>
        </div>

        <div
          className="changsal-band absolute bottom-0 left-0 right-0 z-10 h-[14px]"
          style={{ backgroundSize: "40px 14px" }}
        />
      </DialogContent>
    </Dialog>
  );
}
