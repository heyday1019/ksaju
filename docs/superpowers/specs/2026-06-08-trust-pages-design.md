# Trust Pages (About / FAQ / Terms) — Design

> **Status:** Approved (design). Cycle 18.
> **Goal:** Add About, FAQ, and Terms pages to KSaju for trust, SEO, and AdSense readiness. Privacy already shipped in cycle 15; this completes the trust-page set and extends the footer.

---

## Context

- KSaju is live (Vercel, auto-deploy from `main`). The roadmap's remaining trust item (#4, 2026-06-05 list) is About/FAQ/Terms.
- An existing static page, `src/app/privacy/page.tsx`, establishes the exact pattern to mirror: a server component with a `metadata` export and a hanji-styled `<article>`.
- `src/components/layout/site-footer.tsx` currently links only to Privacy; its own comment says it "Seeds the later About/FAQ footer."
- `src/app/sitemap.ts` currently lists only `/` and `/inyeon` — it omits `/privacy`.
- Content language is **English** (target audience: English-speaking foreign K-pop fans). Copy below is the approved draft for review; the user owns final English wording.

## Goals

- Three new static routes: `/about`, `/faq`, `/terms`, each mirroring the privacy-page pattern.
- About in **brand voice** ("KSaju is…"); FAQ as ~8 Q&A; Terms as a light, non-scary "for entertainment" disclaimer.
- Footer nav extended to `About · FAQ · Privacy · Terms`.
- Sitemap extended to include all four trust pages (`/about`, `/faq`, `/privacy`, `/terms`) plus the existing `/` and `/inyeon`.
- Contact email reuses the existing `hello@ksaju.me`.

## Non-Goals

- No CMS/MDX/i18n — copy is inline JSX, English only.
- No new design system work — reuse the existing hanji `<article>` styling from the privacy page.
- No client-side interactivity, state, or analytics on these pages (pure static server components).
- No redesign of the existing privacy page beyond adding it to the sitemap/footer set.

---

## Architecture

Three server components, each self-contained and statically prerendered, following `src/app/privacy/page.tsx` exactly:

- `src/app/about/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/terms/page.tsx`

Each file:
- Exports `metadata: Metadata` with a page-specific `title` (`"About · KSaju"`, etc.) and `description`.
- Renders the same outer shell as privacy:
  ```tsx
  <div className="flex flex-1 flex-col items-center px-8 py-12">
    <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
      <h1 className="font-display text-3xl font-bold">…</h1>
      {/* sections with <h2 className="font-display text-lg font-semibold"> */}
      <p><Link href="/" className="text-primary underline-offset-2 hover:underline">← Back to KSaju</Link></p>
    </article>
  </div>
  ```
- Uses `<section className="space-y-2">` blocks with `<h2>` headings and `<ul className="list-disc space-y-1 pl-5">` where lists fit (FAQ uses `<h3>`/`<p>` Q&A pairs rather than bullets).

### Wiring

- **Footer** (`src/components/layout/site-footer.tsx`): extend the `<nav>` to four links in order `About · FAQ · Privacy · Terms`. Keep the existing styling (`underline-offset-2 hover:underline hover:text-foreground`) and the `KSaju · For entertainment 🌙` line.
- **Sitemap** (`src/app/sitemap.ts`): return six entries — `/`, `/inyeon`, `/about`, `/faq`, `/privacy`, `/terms` — all with the `ksaju.me` base and `lastModified`.

---

## Content (approved draft)

### `/about`

```
# About KSaju

KSaju is saju, but make it K. It's a fun, free little toy that turns your
birthday into a Korean four-pillars (사주, saju) reading — then lets you check
your cosmic chemistry with your K-pop bias.

## What's saju?
Saju is a traditional Korean way of reading your destiny from the year, month,
day, and hour you were born. For centuries people have used it to understand
personality and relationships. We take that idea and make it light, colorful,
and shareable.

## What you can do here
- Enter your birthday and get your saju at a glance — your day master, your
  five-element balance, and a few fun fortune cards (money, love, career, this year).
- Head to Inyeon (인연) to check your compatibility with a K-pop idol — or with
  anyone you like.
- Make a pretty card and share it with your friends. ✨

## What KSaju is not
A serious fortune-telling service. We don't sell deep readings or tell you what
to do with your life. KSaju is for fun and for sharing — a playful way to
connect with K-pop and a slice of Korean culture. For entertainment 🌙
```

### `/faq`

```
# FAQ

Is this real fortune-telling?
Nope — KSaju is just for fun. Think of it as a personality toy with a Korean
twist, not a prediction of your future.

What is saju?
Saju (사주) is traditional Korean four-pillars astrology. It reads the year,
month, day, and hour of your birth as four "pillars," each tied to one of the
five elements (wood, fire, earth, metal, water).

How is compatibility calculated?
With classic five-element rules — which elements support or clash, and how the
birth pillars meet. It's a transparent rule-based score, not random and not AI
mysticism.

Do you store my birthday?
No. Your birthday is used in your browser to compute your saju. We only keep a
coarse age range (like 18–24) for anonymous analytics — never your exact date.
See our Privacy page. [link → /privacy]

Why K-pop idols? Where do their birthdays come from?
Because checking your chemistry with your bias is fun! Idol names and birthdays
are public information. We don't use official photos or logos, and KSaju isn't
affiliated with any artist or label.

Is it free?
Yes, completely free.

Can I share my result?
Yes — every result can be turned into a card image you can save and post. ✨

I found a mistake, or my favorite idol is missing!
We'd love to hear it. Reach us at hello@ksaju.me.
```

### `/terms`

```
# Terms of Use

By using KSaju, you agree to these simple terms. We've kept them short and human.

For entertainment only.
KSaju is a fun toy. Nothing here is professional advice — not for your
relationships, health, finances, or any real-life decision. Please don't take
it too seriously. 🌙

No guarantees.
We offer KSaju "as is" and do our best to keep it fun and accurate, but we can't
promise it's error-free or always available.

Idols & names.
Idol names and birthdays are used as public information for entertainment. We
don't use official photos or logos, and KSaju is not affiliated with, endorsed
by, or connected to any artist, group, or label.

Be kind.
KSaju is a light, friendly, all-ages space for fans. The "shipping" here is
playful fun — keep it respectful.

Your cards.
Cards you create are yours to share. The KSaju name, design, and code belong to us.

Changes.
We may update these terms as KSaju grows. Continued use means you're okay with
the latest version.

Questions? Reach us at hello@ksaju.me.
```

---

## Testing

- **Sitemap** (`src/app/sitemap.test.ts`): extend the existing test to assert all six URLs are present (`/`, `/inyeon`, `/about`, `/faq`, `/privacy`, `/terms`) with the `ksaju.me` base and `Date` `lastModified`. Update the `toHaveLength(2)` expectation to `6`.
- **Footer** (`src/components/layout/site-footer.test.tsx`, new): smoke test — renders links named About, FAQ, Privacy, Terms with correct `href`s. (happy-dom + RTL, mirrors `site-header.test.tsx`.)
- **Pages:** no per-page unit tests — they are static content components with no logic, matching the untested `privacy/page.tsx`. Coverage comes from `next build` static prerender + the sitemap/footer tests.

## Verification

- `npm test` — all suites green (sitemap + new footer test included).
- `npx tsc --noEmit` — clean.
- `npm run lint` — only the two pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang).
- `npm run build` — succeeds; `/about`, `/faq`, `/terms`, `/privacy` all static `○`.
- Manual (user): visit each page in dev + prod, check footer links, dark mode, mobile readability.

## Decisions

- **3 separate routes** over a combined page — mirrors privacy, cleaner for SEO/AdSense, each page shareable.
- **Brand voice** for About over a personal maker story — neutral, scalable, no personal-info exposure.
- **Add `/privacy` to the sitemap** while we're here — it was missing; including all four trust pages is consistent.
- **English only, inline JSX** — no i18n/MDX overhead for static copy the user owns.
