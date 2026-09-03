import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getPathname, Link } from "@/i18n/navigation";
import { cardBySlug, getGuide, publishedSlugs } from "@/lib/card-guides";
import { CardGuideArticle } from "@/components/cards/card-guide-article";
import { RelatedCards } from "@/components/cards/related-cards";
import { CardCta } from "@/components/cards/card-cta";

// 발행 게이트 밖의 슬러그는 요청 시 렌더하지 않고 404.
export const dynamicParams = false;

// 부모 [locale]이 4개 로케일을 만들고, Next가 이 함수를 로케일마다 한 번씩 돌려 교차곱을 만든다.
// 발행 집합은 4개 언어 교집합이라 로케일별로 동일 → 인자 불필요.
export function generateStaticParams() {
  return publishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const card = cardBySlug(slug);
  const guide = getGuide(locale as Locale, slug);
  if (!card || !guide) return {};

  const href = `/cards/${slug}`;
  return {
    // 루트 layout의 template이 " · KSaju"를 붙인다. 타겟 검색어를 맨 앞에 둔다.
    title: `${card.name_en} Tarot Card Meaning`,
    description: guide.summary,
    alternates: {
      canonical: getPathname({ locale: locale as Locale, href }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href })]),
      ),
    },
    openGraph: {
      type: "article",
      title: `${card.name_en} Tarot Card Meaning`,
      description: guide.summary,
      images: [{ url: `/tarot/${card.filename}`, width: 848, height: 1264, alt: card.name_en }],
    },
    twitter: {
      // 카드 아트가 세로 비율이라 large image가 아니라 summary.
      card: "summary",
      title: `${card.name_en} Tarot Card Meaning`,
      description: guide.summary,
      images: [`/tarot/${card.filename}`],
    },
  };
}

export default async function CardGuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const card = cardBySlug(slug);
  const guide = getGuide(locale as Locale, slug);
  if (!card || !guide) notFound();

  const t = await getTranslations("Cards");
  const base = "https://ksaju.me";
  const url = `${base}${getPathname({ locale: locale as Locale, href: `/cards/${slug}` })}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${card.name_en} Tarot Card Meaning`,
        description: guide.summary,
        image: `${base}/tarot/${card.filename}`,
        inLanguage: locale,
        mainEntityOfPage: url,
        isPartOf: { "@type": "WebSite", name: "KSaju", url: base },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "KSaju", item: base },
          {
            "@type": "ListItem",
            position: 2,
            name: t("hubTitle"),
            item: `${base}${getPathname({ locale: locale as Locale, href: "/cards" })}`,
          },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardGuideArticle card={card} guide={guide} />
      <div className="w-full max-w-2xl">
        <CardCta slug={slug} />
      </div>
      <RelatedCards card={card} />
      <Link
        href="/cards"
        className="mt-12 text-sm text-primary underline-offset-2 hover:underline"
      >
        {t("backToHub")}
      </Link>
    </div>
  );
}
