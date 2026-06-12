"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BirthForm } from "@/components/kst/birth-form";
import { CompatibilitySection } from "@/components/compat/compatibility-section";
import { PartnerCompatSection } from "@/components/compat/partner-compat-section";
import { SajuSummaryBar } from "./saju-summary-bar";
import { Card, CardContent } from "@/components/ui/card";
import { calcUserSaju } from "@/app/actions/saju";
import { loadUserSaju, saveUserSaju } from "@/lib/saju-storage";
import { track } from "@/lib/analytics";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

/**
 * '인연' 페이지 본문 (client). localStorage에서 내 사주를 불러와
 * 아이돌 궁합 + 일반 상대 궁합 두 섹션을 세로 스택으로 렌더.
 * 저장된 사주가 없으면 생일 폴백 폼으로 본인 사주 입력.
 */
export function InyeonView() {
  const t = useTranslations("Inyeon");
  const [me, setMe] = useState<UserSaju | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // mount 후 localStorage 읽기 — SSR 안전(hydration mismatch 방지). 의도된 패턴.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMe(loadUserSaju());
    setHydrated(true);
  }, []);

  const handleSelfBirth = async (birth: BirthData) => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const saju = await calcUserSaju(birth);
      saveUserSaju(saju);
      setMe(saju);
      track("birth_submitted", { has_time: birth.hour !== undefined });
    } catch (err) {
      console.error("Self saju failed:", err);
      setError("Couldn't read that birth date. Please double-check and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="hanja mt-2 text-4xl font-bold tracking-[0.3em]">{t("hanja")}</p>
        </header>

        {!hydrated ? null : !me ? (
          <Card className="relative overflow-hidden border-border py-6">
            <div
              className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
            <CardContent className="space-y-4 pt-4">
              <div className="text-center">
                <p className="font-display text-lg font-semibold">
                  {t("selfTitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("selfSubtitle")}
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
              <BirthForm
                onSubmit={handleSelfBirth}
                submitting={submitting}
                submitLabel={t("selfSubmit")}
                submittingLabel={t("selfSubmitting")}
              />
            </CardContent>
            <div
              className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 내 사주 요약 */}
            <SajuSummaryBar saju={me} />

            {/* K-pop 최애 궁합 */}
            <CompatibilitySection userSaju={me} />

            {/* 구분선 */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Or someone else
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* 일반 상대 궁합 */}
            <PartnerCompatSection userSaju={me} />
          </div>
        )}
      </div>
    </div>
  );
}
