"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BirthForm } from "@/components/kst/birth-form";
import { SajuResult } from "@/components/saju/saju-result";
import { convertToKST } from "@/lib/kst-converter";
import { calcUserSaju, calcCurrentLuck } from "@/app/actions/saju";
import { saveUserSaju } from "@/lib/saju-storage";
import { track, ageBucket } from "@/lib/analytics";
import type { BirthData, KSTResult } from "@/lib/kst-types";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTzSnapshot = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServerSnapshot = () => undefined;

export default function Home() {
  const [view, setView] = useState<"form" | "result">("form");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(null);
  const [kst, setKst] = useState<KSTResult | null>(null);
  const [currentLuck, setCurrentLuck] = useState<CurrentLuck | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const defaultTz = useSyncExternalStore(subscribeTz, getTzSnapshot, getTzServerSnapshot);

  const handleSubmit = async (data: BirthData) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const kstResult = convertToKST(data);
      const [saju, luck] = await Promise.all([
        calcUserSaju(data),
        calcCurrentLuck(),
      ]);
      setKst(kstResult);
      setUserSaju(saju);
      setCurrentLuck(luck);
      saveUserSaju(saju); // 홈↔인연 공유용 영속
      setView("result");
      track("saju_calculated", { age_bucket: ageBucket(data.year) });
    } catch (err) {
      console.error("Saju calculation failed:", err);
      setErrorMessage(
        "Couldn't read this birth date. Please double-check your info and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </h1>
        <p className="hanja text-5xl font-bold tracking-[0.4em]">사 주</p>
        <p className="font-serif italic text-xl text-primary">
          Saju, but make it K.
        </p>

        <Card className="relative overflow-hidden border-border mt-8 py-6">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
          {view === "form" || !userSaju || !kst || !currentLuck ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">When were you born?</CardTitle>
                <CardDescription>
                  Korea uses KST · we&apos;ll convert for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-left text-sm text-destructive"
                  >
                    {errorMessage}
                  </div>
                )}
                <BirthForm
                  onSubmit={handleSubmit}
                  defaultTimezone={defaultTz}
                  submitting={submitting}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-8 pb-2 text-left">
              <SajuResult
                userSaju={userSaju}
                kst={kst}
                currentLuck={currentLuck}
                onEdit={() => setView("form")}
              />
            </CardContent>
          )}
          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>
      </div>
    </div>
  );
}
