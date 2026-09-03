import { getTranslations } from "next-intl/server";
import type { TarotCard } from "@/lib/tarot";
import type { CardGuide } from "@/lib/card-guides";
import { ELEMENT_TEXT } from "@/lib/saju-display";

/** 카드 해설 본문. 서버 컴포넌트 — 클라이언트 JS 0. */
export async function CardGuideArticle({
  card,
  guide,
}: {
  card: TarotCard;
  guide: CardGuide;
}) {
  const t = await getTranslations("Cards");
  // 마이너 아르카나는 수트마다 오행이 있어 그 색을 쓴다. 메이저는 element: null → 기본 단청황.
  const accent = card.element ? ELEMENT_TEXT[card.element] : "text-accent";

  return (
    <article className="w-full max-w-2xl space-y-8 text-sm leading-relaxed text-foreground">
      <header className="space-y-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/tarot/${card.filename}`}
          alt={`${card.name_en} (${card.name_kr}) — KSaju tarot card`}
          width={848}
          height={1264}
          loading="lazy"
          className="mx-auto w-full max-w-[280px] rounded-xl border border-border/50 shadow-sm"
        />
        <h1 className="font-display text-3xl font-bold">{guide.title}</h1>
        <p className={`text-xs uppercase tracking-widest ${accent}`}>{card.keywords}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("meaningHeading")}</h2>
        {guide.meaning.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("symbolsHeading")}</h2>
        <dl className="space-y-3">
          {guide.symbols.map((symbol) => (
            <div key={symbol.label}>
              <dt className={`font-semibold ${accent}`}>{symbol.label}</dt>
              <dd className="text-muted-foreground">{symbol.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("uprightHeading")}</h2>
        <p>{guide.upright}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("reversedHeading")}</h2>
        <p>{guide.reversed}</p>
      </section>

      <dl className="grid gap-3 rounded-xl border border-border/50 bg-card/50 p-5 sm:grid-cols-2">
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
            {t("loveLabel")}
          </dt>
          <dd className="mt-1">{guide.love}</dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
            {t("workLabel")}
          </dt>
          <dd className="mt-1">{guide.work}</dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("sajuHeading")}</h2>
        <p>{guide.sajuLens}</p>
      </section>
    </article>
  );
}
