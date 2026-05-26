"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BirthForm } from "@/components/kst/birth-form";
import { SajuResult } from "@/components/saju/saju-result";
import { convertToKST } from "@/lib/kst-converter";
import { calcUserSaju } from "@/app/actions/saju";
import type { BirthData, KSTResult } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTzSnapshot = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServerSnapshot = () => undefined;

export default function Home() {
  const [view, setView] = useState<"form" | "result">("form");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(null);
  const [kst, setKst] = useState<KSTResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const defaultTz = useSyncExternalStore(subscribeTz, getTzSnapshot, getTzServerSnapshot);

  const handleSubmit = async (data: BirthData) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const kstResult = convertToKST(data);
      const saju = await calcUserSaju(data);
      setKst(kstResult);
      setUserSaju(saju);
      setView("result");
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
    <main className="hanji-paper min-h-screen relative overflow-hidden">
      {/* 페이지 상단 창살 */}
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      {/* 우상단 테마 토글 */}
      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 거대 ㅎ — pointer-events-none이라 클릭 통과. */}
      <span
        className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-30 sm:z-0"
        aria-hidden="true"
      >
        ㅎ
      </span>

      {/* Hero 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-14 px-8">
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
            {view === "form" || !userSaju || !kst ? (
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

      {/* 페이지 하단 창살 */}
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
