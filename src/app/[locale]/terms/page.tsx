import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Terms");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function TermsPage() {
  const t = await getTranslations("Terms");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("entertainmentHeading")}</h2>
          <p>{t("entertainmentBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("guaranteesHeading")}</h2>
          <p>{t("guaranteesBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("idolsHeading")}</h2>
          <p>{t("idolsBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("kindHeading")}</h2>
          <p>{t("kindBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("cardsHeading")}</h2>
          <p>{t("cardsBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("changesHeading")}</h2>
          <p>{t("changesBody")}</p>
        </section>

        <p>
          {t("contact")}{" "}
          <a className="text-primary underline-offset-2 hover:underline" href="mailto:ksaju.korea@gmail.com">
            ksaju.korea@gmail.com
          </a>
          .
        </p>

        <p>
          <LocaleLink href="/" className="text-primary underline-offset-2 hover:underline">
            {t("back")}
          </LocaleLink>
        </p>
      </article>
    </div>
  );
}
