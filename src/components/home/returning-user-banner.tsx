"use client";

import { Button } from "@/components/ui/button";
import { dayMasterInfo, WUXING_META, ELEMENT_TEXT } from "@/lib/saju-display";

interface Props {
  dayMaster: string;
  onContinue: () => void;
  onReset: () => void;
}

export function ReturningUserBanner({ dayMaster, onContinue, onReset }: Props) {
  const dm = dayMasterInfo(dayMaster);
  const meta = WUXING_META[dm.element];
  const textClass = ELEMENT_TEXT[dm.element];

  return (
    <div className="space-y-5 text-center py-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
          Welcome back ✨
        </p>
        <p className={`hanja text-6xl font-bold ${textClass}`}>
          {dayMaster}
        </p>
        <p className="mt-1 text-base font-semibold text-muted-foreground">
          {meta.emoji} {meta.label} · {dm.keyword}
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={onContinue}>
        Continue as {dayMaster} day master →
      </Button>

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Not you? Change birthday
      </button>
    </div>
  );
}
