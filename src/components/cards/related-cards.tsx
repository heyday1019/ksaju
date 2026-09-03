import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { TarotCard } from "@/lib/tarot";
import { cardSlug, relatedCards } from "@/lib/card-guides";

/** 같은 수트의 발행된 이웃 카드 링크. 발행분이 없으면 아무것도 렌더하지 않는다. */
export async function RelatedCards({ card }: { card: TarotCard }) {
  const related = relatedCards(card);
  if (related.length === 0) return null;

  const t = await getTranslations("Cards");

  return (
    <section className="mt-12 w-full max-w-2xl space-y-3">
      <h2 className="font-display text-lg font-semibold">{t("relatedHeading")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {related.map((c) => (
          <li key={c.id}>
            <Link
              href={`/cards/${cardSlug(c)}`}
              className="block rounded-lg border border-border/50 bg-card/50 p-3 text-center text-xs transition hover:border-primary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/tarot/${c.filename}`}
                alt=""
                width={848}
                height={1264}
                loading="lazy"
                className="mx-auto mb-2 w-full rounded"
              />
              {c.name_en}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
