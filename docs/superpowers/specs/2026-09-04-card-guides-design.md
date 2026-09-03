# Tarot Card Guides — `/cards` Content System — Design Spec

**Date:** 2026-09-04
**Cycle:** 27 (card guides)
**Status:** Approved

---

## 1. Overview

A library of long-form tarot card interpretations at `/cards`, published in all four
locales. Each of the 78 cards gets its own page: the card art, what it means, the
symbols in the artwork, upright and reversed readings, and — the part no competitor
has — how the card reads **through a saju lens**.

**Three goals, in priority order:**

1. **AdSense re-approval** — accumulate substantive, original text content.
2. **SEO traffic** — capture `"<card> tarot card meaning"` searches.
3. **Ko-fi conversion** — every card page routes to the printable deck.

**Locked decisions (from brainstorming):**

1. **All four locales, fully translated.** `/cards` lives inside `[locale]`, not as an
   English-only route. Every published card exists in `en`, `ko`, `ja`, and `zh-TW`.
2. **Standard depth + saju lens.** ~500–600 English words per card across seven fields,
   with a mandatory `sajuLens` paragraph.
3. **Two-stage generator script.** English master first, reviewed by hand, then
   translated. No runtime LLM calls — pages are fully static.
4. **Major Arcana first.** 22 cards in this cycle; the remaining 56 stay unrouted.

**Existing assets reused as-is:** `public/tarot/*.png` (78 images),
`data/ksaju-tarot.json` (78 entries with `theme`, `keywords`, `element`),
`src/lib/tarot.ts`, `AppChrome`, the hanji theme, and the multi-sink `track()`.

**No new npm packages.**

---

## 2. The publish gate

The single most important mechanism in this design.

A card is **published** only when its slug appears in **all four** locale files. The
published set is the intersection:

```
publishedSlugs() = keys(en) ∩ keys(ko) ∩ keys(ja) ∩ keys(zh-TW)
```

Everything downstream reads from this one function — `generateStaticParams`, the hub
grid, the sitemap, and related-card links. Three consequences follow:

- A half-translated card is invisible in **every** locale, so `hreflang` never points
  at a missing page.
- Thin or empty pages can never be indexed, which is what sinks AdSense reviews.
- Content can land incrementally without a feature flag. Writing 22 cards and shipping
  is the same operation as writing 3 and shipping.

`dynamicParams = false` on the `[slug]` segment, so an unpublished slug 404s rather
than rendering at request time.

---

## 3. Routes

```
src/app/[locale]/cards/
  page.tsx           hub — grid of published cards, grouped by suit
  [slug]/page.tsx    one card guide
```

`[locale]/layout.tsx` already emits the four locales from `routing.locales`. Per the
Next 16 docs, a child `generateStaticParams` runs once per parent param set, and its
`params` argument is a plain object — not a Promise, unlike the page component's. Since
the publish gate is a locale intersection, the published set is identical for every
locale, so the child needs no argument at all:

```ts
// [slug]/page.tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedSlugs().map((slug) => ({ slug }));
}
```

Next runs this once per locale and produces the cross-product.

The middleware, `AppChrome`, hanji theme, header, and footer are inherited unchanged.
Nothing in the existing routing is modified.

**Page count this cycle:** 22 cards × 4 locales + 4 hubs = **92 URLs**.
At full deck: 78 × 4 + 4 = 316.

---

## 4. Data

### 4.1 Layout

Mirrors `messages/`, so the parity test can mirror `messages-parity.test.ts`:

```
data/card-guides/en.json
data/card-guides/ko.json
data/card-guides/ja.json
data/card-guides/zh-TW.json
```

Each file is a flat map keyed by slug:

```json
{
  "the-fool": { "title": "...", "summary": "...", "meaning": ["...", "..."], ... },
  "the-magician": { ... }
}
```

### 4.2 Schema

```ts
// src/lib/card-guides.ts
export type CardGuide = {
  title: string;                                // H1. ko: "광대 · The Fool"
  summary: string;                              // 140–160 chars. meta description + hub subtitle
  meaning: string[];                            // 2 paragraphs
  symbols: { label: string; text: string }[];   // 3–4 entries
  upright: string;                              // 3–4 sentences
  reversed: string;                             // 3 sentences
  love: string;                                 // one line
  work: string;                                 // one line
  sajuLens: string;                             // 1 paragraph — the differentiator
};
```

**Why structured fields instead of Markdown bodies:** each field maps directly onto a
`<p>`, `<dl>`, or `<section>`. No Markdown parser, no `gray-matter`, no MDX — zero new
dependencies, and the parity test can verify field-by-field rather than guessing at
prose completeness.

**What is deliberately absent:** `slug`, `element`, `name_en`, `name_kr`, and the image
filename. Those already live in `data/ksaju-tarot.json` and are joined at read time. A
guide file holds prose and nothing else.

### 4.3 Where guides must NOT live

**Not in `messages/*.json`.** Those are handed to `NextIntlClientProvider` and shipped
to the browser in full. `messages/en.json` is 8 KB today; adding 78 guides would push
several hundred KB of prose into every page's client bundle.

Guides are read in Server Components only. A new `Cards` namespace goes into
`messages/` for **chrome labels only** — "Upright", "Reversed", "In love", "In work",
"Through a saju lens", "Related cards", the two CTA labels, and the hub heading.

---

## 5. Access layer — `src/lib/card-guides.ts`

| Function | Behavior |
|---|---|
| `cardSlug(card: TarotCard): string` | `name_en` → kebab slug. Pure, no data migration. |
| `cardBySlug(slug): TarotCard \| null` | Reverse lookup over `TAROT_CARDS`. |
| `getGuide(locale, slug): CardGuide \| null` | Guide lookup; `null` when absent. |
| `publishedSlugs(): string[]` | Four-locale intersection, ordered by card `id`. |
| `relatedCards(card): TarotCard[]` | 4 cards for internal linking. |

**Slug derivation** is a pure function over `name_en` — lowercase, non-alphanumerics to
hyphens, collapse, trim. Verified: all 78 produce unique slugs (`The Fool` → `the-fool`,
`Ace of Wands` → `ace-of-wands`). `data/ksaju-tarot.json` is **not** modified, so
`scripts/seed-tarot.mjs` stays the sole owner of that file.

**Related cards:** walk outward from the card's `id` within its own suit — `id-1`,
`id+1`, `id-2`, `id+2` — wrapping at the suit boundary, and **keep only published
slugs**, continuing outward until four are found or the suit is exhausted. Major Arcana
therefore link to numeric neighbours; minors stay inside their suit.

Filtering by `publishedSlugs()` is not optional: with 22 of 78 cards live, an unfiltered
neighbour list would link straight into 404s and feed dead URLs to the crawler. The
suit-exhausted case returns fewer than four rather than reaching across suits, so the
component renders nothing when the list is empty.

Guides are imported statically from the four JSON files. Because only Server Components
call into this module, the prose never reaches the client bundle.

---

## 6. Components

```
src/components/cards/
  card-grid.tsx            hub grid, grouped by suit           (server)
  card-guide-article.tsx   the article body                     (server)
  related-cards.tsx        internal links                       (server)
  card-cta.tsx             the two CTAs                         (client)
```

Everything is a Server Component except `card-cta.tsx`. These pages ship no
interactivity beyond the CTAs, which keeps them fast and fully static — the shape
AdSense reviews favour.

**`card-cta.tsx` is `"use client"` solely for click tracking.** An untracked Ko-fi CTA
cannot be evaluated, so it cannot be improved. It fires:

```ts
track("card_cta_clicked", { target: "tarot" | "kofi", slug })
```

`card_cta_clicked` is added to the `AnalyticsEvent` union in `src/lib/analytics.ts`.
`AppChrome` is already a client boundary, so this island adds no new bundle weight.

**The two CTAs, on every card page, below the article:**

1. `Pull your daily card →` → `/tarot` via the locale-aware `Link`.
2. `Get the full deck →` → `https://ko-fi.com/ksaju`, `target="_blank"`,
   `rel="noopener noreferrer"`.

**Visual language** follows the existing hanji light theme and its dark counterpart:
`font-display` headings, `border-border/50` dividers, `text-primary` links, oh-haeng
accent colors via the existing `ELEMENT_TEXT` map in `src/lib/saju-display.ts` — the
minor arcana carry an `element`, so a Cups card page reads in water tones and a Wands
page in fire tones. Major Arcana have `element: null` and use the default hanji accent.

Card art is rendered with a plain `<img>` and an explicit `loading="lazy"`, matching
the existing `tarot-draw.tsx` convention (with its `eslint-disable` comment).

---

## 7. SEO

**Per-card metadata** via `generateMetadata`:

- `title`: `"The Fool Tarot Card Meaning"` — the target query verbatim, first. The root
  layout's `template: "%s · KSaju"` appends the brand.
- `description`: the guide's `summary`.
- `openGraph.images`: the card art at `/tarot/<filename>`. The art is portrait, so
  `twitter.card` is `summary`, not `summary_large_image`. Build cost: zero.

**hreflang is mandatory, not optional.** Full translation only reads as legitimate
localization — rather than duplicate content — when the four locales declare each other:

```ts
alternates: {
  canonical: getPathname({ locale, href: `/cards/${slug}` }),
  languages: Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ locale: l, href: `/cards/${slug}` })]),
  ),
}
```

`getPathname` is already exported from `src/i18n/navigation.ts`.

**JSON-LD**, inline in the page: `Article` (headline, image, description, `inLanguage`)
plus `BreadcrumbList` (Home → Card meanings → the card).

**Sitemap** (`src/app/sitemap.ts`) gains `/cards` and every published card URL across
four locales, built from `publishedSlugs()` so it can never drift from what is routed.

> **Pre-existing bug fixed here:** `/tarot` is missing from `CORE_ROUTES` and has never
> been in the sitemap. Since this cycle rewrites that file, `/tarot` is added. The URL
> count assertion in `sitemap.test.ts` moves from 24 to 24 + 4 (`/tarot`) + 4 (`/cards`)
> + 88 (22 cards × 4) = **120**.

**Internal linking:** a `Card meanings` link in `SiteFooter` (site-wide, so the hub is
reachable from every page) and a link from `/tarot` to the hub. The header is left
alone — it already carries three items and is tight on mobile.

---

## 8. Draft generator — `scripts/draft-card-guides.mjs`

Follows the established one-off generator pattern (`seed-idols.mjs`, `seed-tarot.mjs`),
run as `npm run draft:cards`. Node ESM, native `fetch`, no new dependencies.

**Stage 1 — English master:**

```bash
npm run draft:cards -- --lang en --suit major
```

Grounds the model in what already exists for each card — `name_en`, `name_kr`, `theme`,
`keywords`, `suit`, `element` — and requests the `CardGuide` shape as JSON. Grounding
matters: it keeps a card's page consistent with the reading the app gives for that same
card in `/tarot`.

**Stage 2 — translations:**

```bash
npm run draft:cards -- --lang ko,ja,zh-TW --suit major
```

Translates from the **reviewed** English entry, not from scratch, so all four locales
say the same thing.

**Invariants:**

- **Idempotent.** A slug already present in the target file is skipped. Hand-edited
  prose is never overwritten. Interrupted runs resume.
- `--force <slug>` regenerates one card deliberately.
- **Validates before writing** — every `CardGuide` field present, arrays non-empty,
  `summary` within 120–200 characters. A malformed response fails that card and leaves
  the file untouched.
- Writes JSON with stable key order (card `id`) so diffs stay readable.
- Requires `OPENROUTER_API_KEY`; exits with a clear message when absent.
- Model: `anthropic/claude-haiku-4-5-20251001`, matching the tarot reading route.

The script is a **build-time authoring tool**. It never runs in the app. Only its JSON
output is committed, and every page stays static.

---

## 9. Testing

| File | Covers |
|---|---|
| `src/lib/card-guides.test.ts` | 78 unique slugs; known-answer slugs (`the-fool`, `ace-of-wands`); `cardBySlug` round-trip; `publishedSlugs` is the four-locale intersection; unpublished slug returns `null`; `relatedCards` returns 4, excludes self, stays in-suit, and **omits unpublished cards** |
| `src/lib/card-guides-parity.test.ts` | Mirrors `messages-parity.test.ts`: identical slug sets and identical field keys across the four files, and no empty strings. **The safety net for the four-locale decision.** |
| `src/app/sitemap.test.ts` | Extended: `/cards` and card URLs per locale, `/tarot` present, new total |
| `src/components/cards/card-guide-article.test.tsx` | Renders all sections; `sajuLens` present |
| `src/components/cards/card-cta.test.tsx` | Both CTAs; Ko-fi link has `rel="noopener noreferrer"`; `track` called with the right target |

TDD throughout: the parity and gate tests are written before the data files exist, so
the first run fails on empty content and passes once the guides land.

**Definition of done:** `npm test` green, `tsc --noEmit` clean, `eslint` clean, and
`next build` reporting `/[locale]/cards` and `/[locale]/cards/[slug]` as static (`●`).

---

## 10. Scope

**In:**

- Both routes, the access layer, the four components, metadata, JSON-LD, sitemap
- The draft generator and its npm script
- `Cards` namespace in all four `messages/*.json`
- Footer link, `/tarot` → hub link
- 22 Major Arcana guides in four languages
- `/tarot` sitemap fix

**Out (deliberately):**

- The 56 Minor Arcana. Unwritten cards stay unrouted via the publish gate; a later
  cycle re-runs the generator with `--suit wands` and ships.
- Per-card `next/og` images. The card art works today at zero build cost.
- Search or filtering on the hub. 22 cards fit on one screen; premature at 78.
- Any change to `/tarot`, `data/ksaju-tarot.json`, or the reading API.
- Adding `/cards` to the site header.

---

## 11. Risks

**Translation quality is the load-bearing risk.** Four-locale publication is only
legitimate if each locale is genuinely readable. Google's spam policy targets
*unreviewed* bulk machine translation. Mitigation: Stage 2 translates from a
hand-reviewed English master rather than generating independently, and the `ko` output
is directly checkable by the author. If `ja`/`zh-TW` quality cannot be verified,
narrowing to `en` + `ko` remains available — the publish gate makes that a one-line
change to the intersection set.

**AdSense re-approval is not guaranteed by this cycle.** Review assesses the whole site,
not one section. 22 substantive pages move in the right direction; they are not by
themselves a decision.

**Ranking timeline is long.** `"the fool meaning"` is dominated by established tarot
sites and will not fall quickly. The realistic first traffic comes from the saju angle —
`사주 타로`, `oh-haeng tarot`, `korean tarot meaning` — which is precisely why
`sajuLens` is a required field rather than an optional flourish.
