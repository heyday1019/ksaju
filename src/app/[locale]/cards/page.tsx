import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { CardGrid } from "@/components/cards/card-grid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Cards");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: getPathname({ locale: locale as Locale, href: "/cards" }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href: "/cards" })]),
      ),
    },
  };
}

export default async function CardsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Cards");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <header className="mb-10 w-full max-w-3xl space-y-3 text-center">
        <h1 className="font-display text-3xl font-bold">{t("hubTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("hubIntro")}</p>
      </header>
      <CardGrid locale={locale as Locale} />
    </div>
  );
}
