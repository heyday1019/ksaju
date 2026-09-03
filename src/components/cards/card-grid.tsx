import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { TarotCard } from "@/lib/tarot";
import { cardBySlug, cardSlug, getGuide, publishedSlugs } from "@/lib/card-guides";

const SUIT_ORDER = ["major", "wands", "cups", "swords", "pentacles"] as const;
const SUIT_LABEL = {
  major: "suitMajor",
  wands: "suitWands",
  cups: "suitCups",
  swords: "suitSwords",
  pentacles: "suitPentacles",
} as const;

/** 발행된 카드만 수트별로 묶어 보여준다. 미발행 수트 섹션은 통째로 생략. */
export async function CardGrid({ locale }: { locale: Locale }) {
  const t = await getTranslations("Cards");
  const cards = publishedSlugs()
    .map(cardBySlug)
    .filter((c): c is TarotCard => c !== null);

  return (
    <div className="w-full max-w-3xl space-y-10">
      {SUIT_ORDER.map((suit) => {
        const inSuit = cards.filter((c) => c.suit === suit);
        if (inSuit.length === 0) return null;

        return (
          <section key={suit} className="space-y-4">
            <h2 className="font-display text-xl font-semibold">{t(SUIT_LABEL[suit])}</h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {inSuit.map((card) => {
                const slug = cardSlug(card);
                const guide = getGuide(locale, slug);
                return (
                  <li key={card.id}>
                    <Link
                      href={`/cards/${slug}`}
                      className="block rounded-xl border border-border/50 bg-card/50 p-3 transition hover:border-primary/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/tarot/${card.filename}`}
                        alt=""
                        width={848}
                        height={1264}
                        loading="lazy"
                        className="mb-2 w-full rounded"
                      />
                      <span className="block text-center text-xs font-semibold">
                        {guide?.title ?? card.name_en}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
