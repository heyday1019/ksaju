import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FAQ");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function FaqPage() {
  const t = await getTranslations("FAQ");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q1")}</h2>
          <p>{t("a1")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q2")}</h2>
          <p>{t("a2")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q3")}</h2>
          <p>{t("a3")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q4")}</h2>
          <p>
            {t("a4Before")}{" "}
            <LocaleLink href="/privacy" className="text-primary underline-offset-2 hover:underline">
              {t("a4Link")}
            </LocaleLink>{" "}
            {t("a4After")}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q5")}</h2>
          <p>{t("a5")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q6")}</h2>
          <p>{t("a6")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q7")}</h2>
          <p>{t("a7")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("q8")}</h2>
          <p>
            {t("a8")}{" "}
            <a className="text-primary underline-offset-2 hover:underline" href="mailto:ksaju.me@gmail.com">
              ksaju.me@gmail.com
            </a>
            .
          </p>
        </section>

        <p>
          <LocaleLink href="/" className="text-primary underline-offset-2 hover:underline">
            {t("back")}
          </LocaleLink>
        </p>
      </article>
    </div>
  );
}
