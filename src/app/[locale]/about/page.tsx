import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p>
          <strong>{t("tagline")}</strong> {t("intro")}
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("sajuHeading")}</h2>
          <p>{t("sajuBody")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("canDoHeading")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("canDoItem1")}</li>
            <li>
              {t("canDoItem2Before")}{" "}
              <LocaleLink href="/inyeon" className="text-primary underline-offset-2 hover:underline">
                Inyeon (인연)
              </LocaleLink>{" "}
              {t("canDoItem2After")}
            </li>
            <li>{t("canDoItem3")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("notHeading")}</h2>
          <p>
            {t("notBody")}{" "}
            <span className="text-muted-foreground">{t("disclaimer")}</span>
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
