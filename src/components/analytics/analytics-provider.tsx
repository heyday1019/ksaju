"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { initAnalytics, setCurrentLocale, track } from "@/lib/analytics";

/** Initializes analytics once and captures a pageview on each route change. Renders nothing. */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  const locale = useLocale();
  const pathname = usePathname();
  useEffect(() => {
    // Set locale before tracking so the pageview event already carries it
    setCurrentLocale(locale);
    track("$pageview", { pathname });
  }, [locale, pathname]);

  return null;
}
