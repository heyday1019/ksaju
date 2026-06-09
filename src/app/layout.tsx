import type { Metadata } from "next";
import { Geist, Inter, Gowun_Batang, Yeon_Sung, Noto_Serif_KR } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const yeonSung = Yeon_Sung({
  variable: "--font-yeon-sung",
  weight: "400",
  subsets: ["latin"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "700"],
  subsets: ["latin"],          // CJK 글리프는 unicode-range로 자동 subset
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ksaju.me";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "KSaju · Korean Saju Compatibility for K-pop Fans",
    template: "%s · KSaju",
  },
  description:
    "Discover your Korean saju (사주) compatibility with your bias. " +
    "1,000 years of Korean fortune wisdom, made shareable for the K-content generation.",

  keywords: ["saju", "korean fortune", "kpop compatibility", "kpop saju", "inyeon", "사주"],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "KSaju",
    title: "KSaju · Korean Saju Compatibility for K-pop Fans",
    description: "Saju, but make it K. Find your bias compatibility in seconds.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "KSaju — Korean saju compatibility for K-pop fans",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "KSaju · Korean Saju Compatibility for K-pop Fans",
    description: "Saju, but make it K. Find your bias compatibility in seconds.",
    images: ["/og-default.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0828" },
  ],

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} ${notoSerifKR.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="hanji-paper min-h-screen relative overflow-hidden">
            {/* 페이지 상단 창살 */}
            <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

            {/* 거대 ㅎ — pointer-events-none이라 클릭 통과. */}
            <span
              className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-30 sm:z-0"
              aria-hidden="true"
            >
              ㅎ
            </span>

            {/* 콘텐츠 컬럼: 공통 헤더 + 페이지 콘텐츠 */}
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <AnalyticsProvider />
              <div className="flex flex-1 flex-col">{children}</div>
              <SiteFooter />
            </div>

            {/* 페이지 하단 창살 */}
            <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
          </main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
