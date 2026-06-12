import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppChrome } from "@/components/layout/app-chrome";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "SiteHeader" });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppChrome
        headerLabels={{ mySaju: t("mySaju"), inyeon: t("inyeon") }}
        showLocaleSwitcher
      >
        {children}
      </AppChrome>
    </NextIntlClientProvider>
  );
}
