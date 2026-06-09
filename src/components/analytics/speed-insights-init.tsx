"use client";
import { useEffect } from "react";
import { injectSpeedInsights } from "@vercel/speed-insights";

export function SpeedInsightsInit() {
  useEffect(() => {
    injectSpeedInsights();
  }, []);
  return null;
}
