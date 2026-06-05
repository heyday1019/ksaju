"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, track } from "@/lib/analytics";

/** Initializes analytics once and captures a pageview on each route change. Renders nothing. */
export function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    track("$pageview", { pathname });
  }, [pathname]);

  return null;
}
