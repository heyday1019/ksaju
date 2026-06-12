import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("collectHeading")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("collectItem1")}</li>
            <li>{t("collectItem2")}</li>
            <li>{t("collectItem3")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("notHeading")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("notItem1")}</li>
            <li>{t("notItem2")}</li>
            <li>{t("notItem3")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t("thirdHeading")}</h2>
          <p>{t("thirdBody")}</p>
        </section>

        <p className="text-muted-foreground">
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
