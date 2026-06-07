# Trust Pages (About / FAQ / Terms) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three static trust pages — `/about`, `/faq`, `/terms` — mirroring the existing `/privacy` page, then wire them into the footer nav and sitemap.

**Architecture:** Each page is a static server component with a `metadata` export and a hanji-styled `<article>` (copied structure from `src/app/privacy/page.tsx`). The footer's `<nav>` is extended to four links; `sitemap.ts` returns all six public URLs. Pure static content — no client JS, no analytics, no new dependencies.

**Tech Stack:** Next.js 16 App Router (server components, `Metadata`), Tailwind v4 (existing hanji classes), vitest + happy-dom + React Testing Library (footer + sitemap tests).

**Spec:** `docs/superpowers/specs/2026-06-08-trust-pages-design.md`

---

## File Structure

- `src/app/about/page.tsx` (create) — `/about`, brand-voice content.
- `src/app/faq/page.tsx` (create) — `/faq`, ~8 Q&A pairs.
- `src/app/terms/page.tsx` (create) — `/terms`, light disclaimer.
- `src/app/sitemap.ts` (modify) — add `/about`, `/faq`, `/privacy`, `/terms`.
- `src/app/sitemap.test.ts` (modify) — assert all six URLs.
- `src/components/layout/site-footer.tsx` (modify) — four-link nav.
- `src/components/layout/site-footer.test.tsx` (create) — smoke test the four links.

**Reused pattern (read before starting):** `src/app/privacy/page.tsx` — the exact JSX shell, class names, and `metadata` shape to copy. `src/components/layout/site-header.test.tsx` — the happy-dom + RTL test pattern to mirror for the footer test.

---

## Task 1: `/about` page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/about/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · KSaju",
  description:
    "KSaju is a fun, free saju toy for K-pop fans. Saju, but make it K. 🌙",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">About KSaju</h1>
        <p>
          <strong>KSaju is saju, but make it K.</strong> It&apos;s a fun, free
          little toy that turns your birthday into a Korean four-pillars (사주,{" "}
          <em>saju</em>) reading — then lets you check your cosmic chemistry with
          your K-pop bias.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What&apos;s saju?</h2>
          <p>
            Saju is a traditional Korean way of reading your destiny from the
            year, month, day, and hour you were born. For centuries people have
            used it to understand personality and relationships. We take that
            idea and make it light, colorful, and shareable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            What you can do here
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Enter your birthday and get your saju at a glance — your day
              master, your five-element balance, and a few fun fortune cards
              (money, love, career, this year).
            </li>
            <li>
              Head to{" "}
              <Link
                href="/inyeon"
                className="text-primary underline-offset-2 hover:underline"
              >
                Inyeon (인연)
              </Link>{" "}
              to check your compatibility with a K-pop idol — or with anyone you
              like.
            </li>
            <li>Make a pretty card and share it with your friends. ✨</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            What KSaju is not
          </h2>
          <p>
            A serious fortune-telling service. We don&apos;t sell deep readings
            or tell you what to do with your life. KSaju is for fun and for
            sharing — a playful way to connect with K-pop and a slice of Korean
            culture. <span className="text-muted-foreground">For entertainment 🌙</span>
          </p>
        </section>

        <p>
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            ← Back to KSaju
          </Link>
        </p>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (no new errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat(trust): /about page (brand voice)"
```

---

## Task 2: `/faq` page

**Files:**
- Create: `src/app/faq/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/faq/page.tsx`. Each Q&A is an `<h2>` question + `<p>` answer:
```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ · KSaju",
  description:
    "Common questions about KSaju — what saju is, how compatibility works, and your privacy.",
};

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">FAQ</h1>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            Is this real fortune-telling?
          </h2>
          <p>
            Nope — KSaju is just for fun. Think of it as a personality toy with a
            Korean twist, not a prediction of your future.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What is saju?</h2>
          <p>
            Saju (사주) is traditional Korean four-pillars astrology. It reads the
            year, month, day, and hour of your birth as four &ldquo;pillars,&rdquo;
            each tied to one of the five elements (wood, fire, earth, metal,
            water).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            How is compatibility calculated?
          </h2>
          <p>
            With classic five-element rules — which elements support or clash,
            and how the birth pillars meet. It&apos;s a transparent rule-based
            score, not random and not AI mysticism.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            Do you store my birthday?
          </h2>
          <p>
            No. Your birthday is used in your browser to compute your saju. We
            only keep a coarse age range (like 18–24) for anonymous analytics —
            never your exact date. See our{" "}
            <Link
              href="/privacy"
              className="text-primary underline-offset-2 hover:underline"
            >
              Privacy
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            Why K-pop idols? Where do their birthdays come from?
          </h2>
          <p>
            Because checking your chemistry with your bias is fun! Idol names and
            birthdays are public information. We don&apos;t use official photos or
            logos, and KSaju isn&apos;t affiliated with any artist or label.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Is it free?</h2>
          <p>Yes, completely free.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            Can I share my result?
          </h2>
          <p>
            Yes — every result can be turned into a card image you can save and
            post. ✨
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            I found a mistake, or my favorite idol is missing!
          </h2>
          <p>
            We&apos;d love to hear it. Reach us at{" "}
            <a
              className="text-primary underline-offset-2 hover:underline"
              href="mailto:hello@ksaju.me"
            >
              hello@ksaju.me
            </a>
            .
          </p>
        </section>

        <p>
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            ← Back to KSaju
          </Link>
        </p>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/faq/page.tsx
git commit -m "feat(trust): /faq page (8 Q&A)"
```

---

## Task 3: `/terms` page

**Files:**
- Create: `src/app/terms/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/terms/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms · KSaju",
  description: "The simple, human terms of using KSaju. For entertainment 🌙",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">Terms of Use</h1>
        <p className="text-muted-foreground">
          By using KSaju, you agree to these simple terms. We&apos;ve kept them
          short and human.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">
            For entertainment only
          </h2>
          <p>
            KSaju is a fun toy. Nothing here is professional advice — not for
            your relationships, health, finances, or any real-life decision.
            Please don&apos;t take it too seriously. 🌙
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">No guarantees</h2>
          <p>
            We offer KSaju &ldquo;as is&rdquo; and do our best to keep it fun and
            accurate, but we can&apos;t promise it&apos;s error-free or always
            available.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Idols &amp; names</h2>
          <p>
            Idol names and birthdays are used as public information for
            entertainment. We don&apos;t use official photos or logos, and KSaju
            is not affiliated with, endorsed by, or connected to any artist,
            group, or label.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Be kind</h2>
          <p>
            KSaju is a light, friendly, all-ages space for fans. The
            &ldquo;shipping&rdquo; here is playful fun — keep it respectful.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Your cards</h2>
          <p>
            Cards you create are yours to share. The KSaju name, design, and code
            belong to us.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Changes</h2>
          <p>
            We may update these terms as KSaju grows. Continued use means
            you&apos;re okay with the latest version.
          </p>
        </section>

        <p>
          Questions? Reach us at{" "}
          <a
            className="text-primary underline-offset-2 hover:underline"
            href="mailto:hello@ksaju.me"
          >
            hello@ksaju.me
          </a>
          .
        </p>

        <p>
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            ← Back to KSaju
          </Link>
        </p>
      </article>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/terms/page.tsx
git commit -m "feat(trust): /terms page (light disclaimer)"
```

---

## Task 4: Extend the footer nav (TDD)

**Files:**
- Create: `src/components/layout/site-footer.test.tsx`
- Modify: `src/components/layout/site-footer.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/layout/site-footer.test.tsx`:
```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("links to all four trust pages with correct hrefs", () => {
    render(<SiteFooter />);
    const expected: Array<[RegExp, string]> = [
      [/about/i, "/about"],
      [/faq/i, "/faq"],
      [/privacy/i, "/privacy"],
      [/terms/i, "/terms"],
    ];
    for (const [name, href] of expected) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/site-footer.test.tsx`
Expected: FAIL — only the Privacy link exists; About/FAQ/Terms links are not found.

- [ ] **Step 3: Extend the footer nav**

In `src/components/layout/site-footer.tsx`, replace the `<nav>` block (currently the single Privacy link) with four links:
```tsx
      <nav className="flex flex-wrap justify-center gap-4">
        <Link href="/about" className="underline-offset-2 hover:underline hover:text-foreground">
          About
        </Link>
        <Link href="/faq" className="underline-offset-2 hover:underline hover:text-foreground">
          FAQ
        </Link>
        <Link href="/privacy" className="underline-offset-2 hover:underline hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="underline-offset-2 hover:underline hover:text-foreground">
          Terms
        </Link>
      </nav>
```
Also update the component doc comment from `Privacy link + entertainment disclaimer. Seeds the later About/FAQ footer.` to `Trust-page nav (About/FAQ/Privacy/Terms) + entertainment disclaimer.`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/layout/site-footer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/site-footer.tsx src/components/layout/site-footer.test.tsx
git commit -m "feat(trust): footer nav — About/FAQ/Privacy/Terms"
```

---

## Task 5: Extend the sitemap (TDD)

**Files:**
- Modify: `src/app/sitemap.test.ts`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Update the test (TDD)**

Replace the body of `src/app/sitemap.test.ts` with:
```ts
import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists all six public routes with the ksaju.me base", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.url)).toEqual([
      "https://ksaju.me/",
      "https://ksaju.me/inyeon",
      "https://ksaju.me/about",
      "https://ksaju.me/faq",
      "https://ksaju.me/privacy",
      "https://ksaju.me/terms",
    ]);
    for (const e of entries) {
      expect(e.lastModified).toBeInstanceOf(Date);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL — length is 2, missing the four trust URLs.

- [ ] **Step 3: Update the sitemap**

Replace the body of `src/app/sitemap.ts` with:
```ts
import type { MetadataRoute } from "next";

/** Static sitemap: the public routes (home, inyeon, and the trust pages). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ksaju.me";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/inyeon`, lastModified },
    { url: `${base}/about`, lastModified },
    { url: `${base}/faq`, lastModified },
    { url: `${base}/privacy`, lastModified },
    { url: `${base}/terms`, lastModified },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(trust): sitemap — add about/faq/privacy/terms"
```

---

## Task 6: Verification + docs

**Files:** Modify `task-log.md`, `CLAUDE.md`

- [ ] **Step 1: Full suite + type-check + lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all tests green (≈159: 157 prior + footer 1 + sitemap unchanged count), tsc clean, lint only the two pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds; `/about`, `/faq`, `/terms`, `/privacy`, `/`, `/inyeon` all static `○`. (Transient Google-font fetch error → re-run once.)

- [ ] **Step 3: Manual visual check (dev)**

Run: `npm run dev`. Visit `/about`, `/faq`, `/terms` directly and via the footer links. Confirm: hanji styling matches `/privacy`, headings/links render, `← Back to KSaju` works, footer shows four links on every page, dark mode + mobile width readable. Report results.

- [ ] **Step 4: Update roadmap docs + commit**

Add a cycle-18 completion entry to `task-log.md` (a new `## 2026-06-08 (월)` cycle-18 sub-section, newest-at-top convention) and mark the trust pages shipped in the `CLAUDE.md` roadmap (note Privacy was cycle 15; About/FAQ/Terms now complete the set; footer + sitemap extended). Then:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 18 (trust pages) complete"
```

- [ ] **Step 5: Finish the branch**

Announce and use **superpowers:finishing-a-development-branch** to verify tests and present merge/PR options (expect: fast-forward merge `feat/trust-pages` → `main` + push, per the project workflow).

---

## Self-Review Notes (author)

- **Spec coverage:** three routes mirroring privacy → T1/T2/T3 ✓; brand-voice About → T1 ✓; ~8 Q&A FAQ → T2 (8 sections) ✓; light Terms disclaimer → T3 (6 sections + intro) ✓; footer nav `About · FAQ · Privacy · Terms` → T4 ✓; sitemap six URLs incl. `/privacy` → T5 ✓; contact `hello@ksaju.me` → T2/T3 ✓; tests (footer smoke, sitemap six) → T4/T5 ✓; no per-page tests (matches untested privacy) → T1/T2/T3 ✓; verification (suite/tsc/lint/build) → T6 ✓. Non-goals (CMS/MDX/i18n, new design system, client JS/analytics, privacy redesign) — no task touches them ✓.
- **Placeholder scan:** none — every page's full JSX, the footer nav block, both test files, and the sitemap body are complete literal code.
- **Type consistency:** all three pages are default-export server components with `export const metadata: Metadata` (matches `privacy/page.tsx` and Next 16 App Router). `SiteFooter` stays a named export (test imports `{ SiteFooter }`, matching the existing `src/components/layout/site-footer.tsx`). `sitemap()` returns `MetadataRoute.Sitemap` with `{ url, lastModified }` entries (unchanged shape, only more rows). Footer links use the same class string as the existing Privacy link. FAQ/Terms reuse the `mailto:hello@ksaju.me` anchor pattern already in `privacy/page.tsx`.
