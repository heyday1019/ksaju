"use client";

import { ThemeProvider } from "next-themes";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

interface AppChromeProps {
  children: React.ReactNode;
  headerLabels?: { mySaju: string; inyeon: string };
  showLocaleSwitcher?: boolean;
}

export function AppChrome({
  children,
  headerLabels,
  showLocaleSwitcher = false,
}: AppChromeProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <main className="hanji-paper min-h-screen relative overflow-hidden">
        <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

        <span
          className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-30 sm:z-0"
          aria-hidden="true"
        >
          ㅎ
        </span>

        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader
            labels={headerLabels}
            showLocaleSwitcher={showLocaleSwitcher}
          />
          <AnalyticsProvider />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </div>

        <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
      </main>
    </ThemeProvider>
  );
}
