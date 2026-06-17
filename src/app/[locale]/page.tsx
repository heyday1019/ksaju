"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BirthForm } from "@/components/kst/birth-form";
import { SajuResult } from "@/components/saju/saju-result";
import { ReturningUserBanner } from "@/components/home/returning-user-banner";
import { convertToKST } from "@/lib/kst-converter";
import { calcUserSaju, calcCurrentLuck } from "@/app/actions/saju";
import { saveUserSaju, loadUserSaju } from "@/lib/saju-storage";
import {
  getOrCreateUID,
  saveBirthData,
  loadBirthData,
  saveUserProfile,
} from "@/lib/user-identity";
import { track } from "@/lib/analytics";
import type { BirthData, KSTResult } from "@/lib/kst-types";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTzSnapshot = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServerSnapshot = () => undefined;

type View = "form" | "welcome" | "result";

export default function Home() {
  const t = useTranslations("Home");
  const [view, setView] = useState<View>("form");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(null);
  const [kst, setKst] = useState<KSTResult | null>(null);
  const [currentLuck, setCurrentLuck] = useState<CurrentLuck | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const defaultTz = useSyncExternalStore(subscribeTz, getTzSnapshot, getTzServerSnapshot);

  // 재방문 감지: localStorage에 UserSaju + BirthData 있으면 welcome 뷰로
  useEffect(() => {
    const cached = loadUserSaju();
    const birth = loadBirthData();
    if (cached && birth) {
      setUserSaju(cached);
      setView("welcome");
    }
  }, []);

  const handleContinue = async () => {
    const birth = loadBirthData();
    const cached = loadUserSaju();
    if (!birth || !cached) { setView("form"); return; }
    setSubmitting(true);
    try {
      const [kstResult, luck] = await Promise.all([
        Promise.resolve(convertToKST(birth)),
        calcCurrentLuck(),
      ]);
      setKst(kstResult);
      setCurrentLuck(luck);
      setView("result");
    } catch (err) {
      console.error("Continue failed:", err);
      setView("form");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem("ksaju:userSaju:v1");
      localStorage.removeItem("ksaju:birthData:v1");
    } catch { /* best-effort */ }
    setUserSaju(null);
    setKst(null);
    setCurrentLuck(null);
    setView("form");
  };

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
      saveUserSaju(saju);
      saveBirthData(data);
      // fire-and-forget: Supabase 프로필 저장
      const uid = getOrCreateUID();
      void saveUserProfile(uid, data, saju.dayMaster);
      setView("result");
      track("birth_submitted", { has_time: data.hour !== undefined });
    } catch (err) {
      console.error("Saju calculation failed:", err);
      setErrorMessage(
        "Couldn't read this birth date. Please double-check your info and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = view === "form" || (!userSaju && view !== "result");
  const showWelcome = view === "welcome" && !!userSaju;
  const showResult = view === "result" && !!userSaju && !!kst && !!currentLuck;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </h1>
        <p className="hanja text-5xl font-bold tracking-[0.4em]">사 주</p>
        <p className="font-serif italic text-xl text-primary">
          {t("tagline")}
        </p>

        <Card className="relative overflow-hidden border-border mt-8 py-6">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />

          {showResult ? (
            <CardContent className="pt-8 pb-2 text-left">
              <SajuResult
                userSaju={userSaju}
                kst={kst}
                currentLuck={currentLuck}
                onEdit={handleReset}
              />
            </CardContent>
          ) : showWelcome ? (
            <CardContent className="pt-8 pb-2">
              <ReturningUserBanner
                dayMaster={userSaju.dayMaster}
                onContinue={handleContinue}
                onReset={handleReset}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">{t("cardTitle")}</CardTitle>
                <CardDescription>
                  {t("cardSubtitle")}
                </CardDescription>
              </CardHeader>
              <p className="px-6 -mt-2 mb-1 text-sm text-foreground/70 leading-snug">
                {t("formHook")}
              </p>
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
          )}

          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>

        {/* Support section */}
        <div className="mt-2 pt-6 border-t border-border/40 space-y-3">
          <h2 className="font-display text-xl font-semibold">Enjoying KSaju? ☕</h2>
          <p className="text-sm text-muted-foreground">
            It&apos;s free — and your support keeps it growing.
          </p>
          <a
            href="https://ko-fi.com/ksaju"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: "#FF5E5B" }}
          >
            ☕ Buy me a coffee
          </a>
          <p className="text-xs text-muted-foreground/70">
            Built solo with love from Seoul 🌾
          </p>
        </div>
      </div>
    </div>
  );
}
