"use client";

import { useMemo, useState } from "react";
import { IdolPicker } from "@/components/idols/idol-picker";
import { CompatibilityModal } from "./compatibility-modal";
import { compatForIdol, type Idol } from "@/lib/idols";
import { normalizeIdolSaju, type SajuPillars } from "@/lib/compatibility";
import type { UserSaju } from "@/lib/saju-types";
import { track } from "@/lib/analytics";

/**
 * '내 사주' 뷰 안의 궁합 부가 섹션.
 * 아이돌 선택 → compatForIdol → 결과 모달. "Check another idol" 루프.
 */
export function CompatibilitySection({ userSaju }: { userSaju: UserSaju }) {
  const [idol, setIdol] = useState<Idol | null>(null);
  const [open, setOpen] = useState(false);

  const mePillars: SajuPillars = useMemo(
    () => ({
      year: userSaju.pillars.year,
      month: userSaju.pillars.month,
      day: userSaju.pillars.day,
    }),
    [userSaju],
  );

  const result = idol ? compatForIdol(mePillars, idol) : null;

  const handleSelect = (picked: Idol) => {
    track("idol_selected", { idol_name: picked.name, group: picked.group });
    const r = compatForIdol(mePillars, picked);
    track("card_generated", { idol_name: picked.name, score: r.score });
    setIdol(picked);
    setOpen(true);
  };

  const handleClose = () => {
    track("another_idol_clicked");
    setOpen(false);
  };

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="text-center">
        <p className="font-display font-semibold">
          Check compatibility with your bias ✨
        </p>
        <p className="text-xs text-muted-foreground">
          Tap an idol to reveal your saju match.
        </p>
      </div>

      <IdolPicker onSelect={handleSelect} />

      {idol && !open && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View {idol.name} result again ✨
          </button>
        </div>
      )}

      {idol && result && (
        <CompatibilityModal
          open={open}
          onClose={handleClose}
          mePillars={mePillars}
          other={{
            name: idol.name,
            sub: idol.group,
            pillars: normalizeIdolSaju(idol.saju),
          }}
          result={result}
          closeLabel="← Check another idol"
        />
      )}
    </section>
  );
}
