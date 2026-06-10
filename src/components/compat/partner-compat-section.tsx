"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BirthForm } from "@/components/kst/birth-form";
import { CompatibilityModal } from "./compatibility-modal";
import { calcUserSaju } from "@/app/actions/saju";
import { calcCompatibility } from "@/lib/compatibility";
import type { SajuPillars, CompatibilityResult } from "@/lib/compatibility";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";
import { track, scoreBucket } from "@/lib/analytics";

/** 일반 상대 궁합: 상대 이름(optional)+생일 → calcUserSaju → calcCompatibility → 범용 모달. */
export function PartnerCompatSection({ userSaju }: { userSaju: UserSaju }) {
  const mePillars: SajuPillars = useMemo(
    () => ({
      year: userSaju.pillars.year,
      month: userSaju.pillars.month,
      day: userSaju.pillars.day,
    }),
    [userSaju],
  );

  const [partnerName, setPartnerName] = useState("");
  const [partnerPillars, setPartnerPillars] = useState<SajuPillars | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePartner = async (birth: BirthData) => {
    if (submitting) return; // 중복 제출 가드
    setError(null);
    setSubmitting(true);
    setPartnerPillars(null);
    setResult(null);
    try {
      const partner = await calcUserSaju(birth);
      const pillars: SajuPillars = {
        year: partner.pillars.year,
        month: partner.pillars.month,
        day: partner.pillars.day,
      };
      setPartnerPillars(pillars);
      const compat = calcCompatibility(mePillars, pillars);
      setResult(compat);
      setOpen(true);
      track("partner_submitted");
      track("compat_revealed", { kind: "partner", score_bucket: scoreBucket(compat.score) });
    } catch (err) {
      console.error("Partner saju failed:", err);
      setError("Couldn't read that birth date. Please double-check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="text-center">
        <p className="font-display font-semibold">Or check someone else 💞</p>
        <p className="text-xs text-muted-foreground">
          Enter their birthday to reveal your saju match.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-1 text-left">
        <label htmlFor="partner-name" className="text-sm font-medium">
          Their name{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="partner-name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="e.g. Alex"
        />
      </div>

      <BirthForm
        onSubmit={handlePartner}
        submitting={submitting}
        submitLabel="Reveal compatibility ✨"
        submittingLabel="Reading…"
      />

      {result && partnerPillars && !open && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            View {partnerName.trim() || "their"} result again ✨
          </button>
        </div>
      )}

      {result && partnerPillars && (
        <CompatibilityModal
          open={open}
          onClose={() => setOpen(false)}
          mePillars={mePillars}
          other={{ name: partnerName.trim() || "Them", pillars: partnerPillars }}
          result={result}
          closeLabel="← Check someone else"
        />
      )}
    </section>
  );
}
