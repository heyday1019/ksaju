"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

/**
 * 카드 해설 하단 CTA 2개. 이 기능에서 유일한 클라이언트 컴포넌트로,
 * 이유는 클릭 추적 하나뿐 — 측정 못 하는 Ko-fi 유도는 개선할 수도 없다.
 */
export function CardCta({ slug }: { slug: string }) {
  const t = useTranslations("Cards");

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/tarot"
        onClick={() => track("card_cta_clicked", { target: "tarot", slug })}
        className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4 text-center text-sm font-semibold text-primary transition hover:bg-primary/20"
      >
        {t("ctaTarot")}
      </Link>
      <a
        href="https://ko-fi.com/ksaju"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("card_cta_clicked", { target: "kofi", slug })}
        className="flex-1 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-center text-sm font-semibold text-accent-foreground transition hover:bg-accent/20"
      >
        {t("ctaDeck")}
      </a>
    </div>
  );
}
