import type { Metadata } from "next";
import { Geist, Inter, Gowun_Batang, Yeon_Sung, Noto_Serif_KR } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteHeader } from "@/components/layout/site-header";
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

export const metadata: Metadata = {
  title: "KSaju · Korean fortune, made cosmic",
  description: "Authentic Korean saju for the K-content generation. Discover your inyeon.",
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
              <div className="flex flex-1 flex-col">{children}</div>
            </div>

            {/* 페이지 하단 창살 */}
            <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
