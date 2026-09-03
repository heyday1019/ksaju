import type { MetadataRoute } from "next";
import { publishedSlugs } from "@/lib/card-guides";

const BASE = "https://ksaju.me";
const LOCALES = ["en", "ja", "ko", "zh-TW"] as const;
const CORE_ROUTES = ["/", "/inyeon", "/tarot", "/cards"] as const;
const TRUST_ROUTES = ["/about", "/faq", "/privacy", "/terms"] as const;

/** en은 prefix 없음(localePrefix: 'as-needed'), 나머지는 /<locale> prefix. */
function url(locale: string, route: string): string {
  if (locale === "en") return route === "/" ? `${BASE}/` : `${BASE}${route}`;
  return route === "/" ? `${BASE}/${locale}/` : `${BASE}/${locale}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const core = LOCALES.flatMap((locale) =>
    CORE_ROUTES.map((route) => ({ url: url(locale, route), lastModified })),
  );

  const trust = LOCALES.flatMap((locale) =>
    TRUST_ROUTES.map((route) => ({ url: url(locale, route), lastModified })),
  );

  // 발행 게이트를 그대로 따라간다 — 라우팅되지 않는 카드는 사이트맵에도 없다.
  const cards = LOCALES.flatMap((locale) =>
    publishedSlugs().map((slug) => ({ url: url(locale, `/cards/${slug}`), lastModified })),
  );

  return [...core, ...trust, ...cards];
}
