"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Slim footer. Trust-page nav + entertainment disclaimer. Uses locale-aware Link. */
export function SiteFooter() {
  const t = useTranslations("SiteFooter");

  return (
    <footer className="relative z-10 mt-8 border-t border-border/50 px-8 py-6 text-center text-xs text-muted-foreground">
      <nav className="flex flex-wrap justify-center gap-4">
        <Link href="/about" className="underline-offset-2 hover:underline hover:text-foreground">
          {t("about")}
        </Link>
        <Link href="/faq" className="underline-offset-2 hover:underline hover:text-foreground">
          {t("faq")}
        </Link>
        <Link href="/privacy" className="underline-offset-2 hover:underline hover:text-foreground">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="underline-offset-2 hover:underline hover:text-foreground">
          {t("terms")}
        </Link>
      </nav>
      <p className="mt-2">KSaju · {t("disclaimer")}</p>
    </footer>
  );
}
