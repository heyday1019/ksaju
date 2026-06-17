"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { BirthForm } from "@/components/kst/birth-form";
import { TarotDraw } from "@/components/tarot/tarot-draw";
import { loadUserSaju, saveUserSaju } from "@/lib/saju-storage";
import { calcUserSaju } from "@/app/actions/saju";
import type { BirthData } from "@/lib/kst-types";
import type { UserSaju } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServer = () => undefined;

export function TarotView() {
  const t = useTranslations("Tarot");
  const [saju, setSaju] = useState<UserSaju | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const defaultTz = useSyncExternalStore(subscribeTz, getTz, getTzServer);

  useEffect(() => {
    setSaju(loadUserSaju());
    setReady(true);
  }, []);

  const handleSubmit = async (data: BirthData) => {
    setSubmitting(true);
    try {
      const s = await calcUserSaju(data);
      saveUserSaju(s);
      setSaju(s);
    } catch (err) {
      console.error("Tarot saju calc failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="font-serif italic text-base text-primary mt-2">{t("subtitle")}</p>
        </div>

        {saju ? (
          <TarotDraw saju={saju} />
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-card/60 p-5">
            <p className="text-sm text-muted-foreground">{t("birthdayPrompt")}</p>
            <BirthForm
              onSubmit={handleSubmit}
              defaultTimezone={defaultTz}
              submitting={submitting}
              submitLabel={t("birthdaySubmit")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
