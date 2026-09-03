import { TAROT_CARDS, type TarotCard } from "./tarot";
import type { Locale } from "@/i18n/routing";
import enGuides from "../../data/card-guides/en.json";
import koGuides from "../../data/card-guides/ko.json";
import jaGuides from "../../data/card-guides/ja.json";
import zhTWGuides from "../../data/card-guides/zh-TW.json";

/** "Ace of Wands" → "ace-of-wands". Derived, never stored — seed-tarot.mjs owns the card JSON. */
export function cardSlug(card: TarotCard): string {
  return card.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BY_SLUG = new Map(TAROT_CARDS.map((c) => [cardSlug(c), c]));

export function cardBySlug(slug: string): TarotCard | null {
  return BY_SLUG.get(slug) ?? null;
}

export type CardGuide = {
  title: string;
  summary: string;
  meaning: string[];
  symbols: { label: string; text: string }[];
  upright: string;
  reversed: string;
  love: string;
  work: string;
  sajuLens: string;
};

type GuideFile = Record<string, CardGuide>;

const GUIDES: Record<Locale, GuideFile> = {
  en: enGuides as GuideFile,
  ko: koGuides as GuideFile,
  ja: jaGuides as GuideFile,
  "zh-TW": zhTWGuides as GuideFile,
};

export function getGuide(locale: Locale, slug: string): CardGuide | null {
  return GUIDES[locale]?.[slug] ?? null;
}

/**
 * 발행 게이트 — 4개 로케일 파일에 모두 존재하는 슬러그만.
 * 라우팅·허브·사이트맵·관련카드가 전부 이 함수 하나를 본다.
 * 반쯤 번역된 카드는 어느 언어에서도 존재하지 않는다.
 */
export function publishedSlugs(): string[] {
  const files = Object.values(GUIDES);
  return TAROT_CARDS.map(cardSlug).filter((slug) => files.every((f) => slug in f));
}
