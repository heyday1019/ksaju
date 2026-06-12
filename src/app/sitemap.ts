import type { MetadataRoute } from "next";

const BASE = "https://ksaju.me";
const LOCALES = ["en", "ja", "ko", "zh-TW"] as const;
const CORE_ROUTES = ["/", "/inyeon"] as const;
const TRUST_ROUTES = ["/about", "/faq", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // 4 locale × 2 코어 라우트
  const localeEntries = LOCALES.flatMap((locale) =>
    CORE_ROUTES.map((route) => {
      const path =
        locale === "en"
          ? route === "/"
            ? `${BASE}/`
            : `${BASE}${route}`
          : route === "/"
          ? `${BASE}/${locale}/`
          : `${BASE}/${locale}${route}`;
      return { url: path, lastModified };
    }),
  );

  // Trust 페이지 EN만 (Phase 3에서 locale 추가)
  const trustEntries = TRUST_ROUTES.map((route) => ({
    url: `${BASE}${route}`,
    lastModified,
  }));

  return [...localeEntries, ...trustEntries];
}
