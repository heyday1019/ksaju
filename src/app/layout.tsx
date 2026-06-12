import type { Metadata } from "next";
import {
  Geist,
  Inter,
  Gowun_Batang,
  Yeon_Sung,
  Noto_Serif_KR,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getLocale } from "next-intl/server";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
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
  subsets: ["latin"],
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "KSaju",
    title: "KSaju · Korean Saju Compatibility for K-pop Fans",
    description: "Saju, but make it K. Find your bias compatibility in seconds.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "KSaju" }],
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
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF6E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0828" },
  ],
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // getLocale() may throw outside a next-intl request scope (e.g. static pages)
  }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geist.variable} ${inter.variable} ${gowunBatang.variable} ${yeonSung.variable} ${notoSerifKR.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
