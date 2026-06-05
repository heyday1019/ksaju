# Production Launch-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make KSaju ready for a public soft launch at ksaju.me — social link-preview cards, a code-generated OG image, search-engine basics (robots + sitemap), pivot-leftover cleanup, and a deploy runbook for the user.

**Architecture:** Use Next.js App Router metadata-file conventions — `robots.ts`, `sitemap.ts`, and a `next/og`-generated `opengraph-image.tsx` — plus expanded root `metadata` (metadataBase + OpenGraph + Twitter). The app stays zero-config (no env vars, Server Action runs natively on Vercel). Vercel/DNS execution is documented as a runbook, not automated.

**Tech Stack:** Next.js 16 App Router, `next/og` ImageResponse, TypeScript, vitest (node env).

**Spec:** `docs/superpowers/specs/2026-06-05-launch-readiness-design.md`

---

## File Structure

- `src/app/robots.ts` (create) — robots policy (allow all + sitemap ref).
- `src/app/robots.test.ts` (create) — pure-function test.
- `src/app/sitemap.ts` (create) — `/` + `/inyeon` entries.
- `src/app/sitemap.test.ts` (create) — pure-function test.
- `src/app/opengraph-image.tsx` (create) — 1200×630 branded OG image via `next/og`.
- `src/app/layout.tsx` (modify) — expand root `metadata` (metadataBase, openGraph, twitter).
- `src/app/layout_org.tsx`, `src/app/page_org.tsx`, `src/app/globals_org.css` (delete) — dead pivot leftovers.
- `docs/deploy-runbook.md` (create) — user-run Vercel + DNS steps.

---

## Task 1: robots.ts

**Files:**
- Create: `src/app/robots.ts`
- Test: `src/app/robots.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/robots.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows all crawlers and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe("https://ksaju.me/sitemap.xml");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/robots.test.ts`
Expected: FAIL — `./robots` cannot be resolved.

- [ ] **Step 3: Write the implementation**

Create `src/app/robots.ts`:
```ts
import type { MetadataRoute } from "next";

/** Allow all crawlers (soft launch is indexable) and advertise the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://ksaju.me/sitemap.xml",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/robots.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts src/app/robots.test.ts
git commit -m "feat(seo): robots.txt — allow all + sitemap reference"
```

---

## Task 2: sitemap.ts

**Files:**
- Create: `src/app/sitemap.ts`
- Test: `src/app/sitemap.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/sitemap.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists / and /inyeon with the ksaju.me base", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.url)).toEqual([
      "https://ksaju.me/",
      "https://ksaju.me/inyeon",
    ]);
    for (const e of entries) {
      expect(e.lastModified).toBeInstanceOf(Date);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL — `./sitemap` cannot be resolved.

- [ ] **Step 3: Write the implementation**

Create `src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";

/** Static sitemap: the two public routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ksaju.me";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/inyeon`, lastModified },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat(seo): sitemap.xml — / and /inyeon"
```

---

## Task 3: opengraph-image.tsx

**Files:**
- Create: `src/app/opengraph-image.tsx`

> No unit test — `next/og` `ImageResponse` runs in the Edge/og runtime, not vitest. Verified by `npm run build` (the `/opengraph-image` route must generate without error) in Task 7. The build failing here is the test.

- [ ] **Step 1: Write the implementation**

Create `src/app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og";

// Image metadata (Next.js file-convention exports)
export const alt = "KSaju — Saju, but make it K.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hanji palette (CLAUDE.md): cream / ink / 진달래 pink / 단청황 gold.
// Latin-only text — no font fetch — keeps the build robust (CJK deferred).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#FBF6E8",
          color: "#1A1A2E",
          padding: "80px",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* 井 (well) grid motif — decorative lines */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ position: "absolute", left: "33%", top: 0, bottom: 0, width: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", left: "66%", top: 0, bottom: 0, width: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", top: "33%", left: 0, right: 0, height: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", top: "66%", left: 0, right: 0, height: 2, background: "#C49A3F", opacity: 0.25 }} />
        </div>

        <div style={{ display: "flex", fontSize: 140, fontWeight: 700, letterSpacing: -2 }}>
          KSaju
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: "#C8385A", marginTop: 8 }}>
          Saju, but make it K.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#1A1A2E", opacity: 0.6, marginTop: 40 }}>
          ksaju.me
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Smoke-verify it compiles + the dev route renders**

Run: `npx tsc --noEmit`
Expected: clean (no type errors).

Optionally (manual): `npm run dev` then open `http://localhost:3000/opengraph-image` — expect a 1200×630 PNG with the KSaju wordmark + tagline. (Full build verification is Task 7.)

- [ ] **Step 3: Commit**

```bash
git add src/app/opengraph-image.tsx
git commit -m "feat(seo): code-generated 1200x630 OG image (next/og)"
```

---

## Task 4: Expand root metadata

**Files:**
- Modify: `src/app/layout.tsx` (the `metadata` export at lines ~35-38)

> The OG/Twitter *image* is auto-attached by the `opengraph-image.tsx` file convention (Task 3) — do NOT list `images` here.

- [ ] **Step 1: Replace the metadata block**

In `src/app/layout.tsx`, replace exactly:
```ts
export const metadata: Metadata = {
  title: "KSaju · Korean fortune, made cosmic",
  description: "Authentic Korean saju for the K-content generation. Discover your inyeon.",
};
```
with:
```ts
const SITE_TITLE = "KSaju · Korean fortune, made cosmic";
const SITE_DESCRIPTION =
  "Authentic Korean saju for the K-content generation. Discover your inyeon.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ksaju.me"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://ksaju.me",
    siteName: "KSaju",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): metadataBase + OpenGraph + Twitter card metadata"
```

---

## Task 5: Remove dead pivot leftovers

**Files:**
- Delete: `src/app/layout_org.tsx`, `src/app/page_org.tsx`, `src/app/globals_org.css`

> Confirmed unreferenced (`grep -rn "_org"` → 0 matches). These are leftovers from the baekui-hanji pivot.

- [ ] **Step 1: Re-confirm no references, then delete**

Run:
```bash
grep -rn "_org" src/ && echo "STILL REFERENCED — STOP" || echo "clean"
git rm src/app/layout_org.tsx src/app/page_org.tsx src/app/globals_org.css
```
Expected: prints `clean`, then the three files are staged for deletion.

- [ ] **Step 2: Verify build inputs still resolve**

Run: `npx tsc --noEmit`
Expected: clean (nothing imported the deleted files).

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove dead _org pivot leftovers"
```

---

## Task 6: Deploy runbook doc

**Files:**
- Create: `docs/deploy-runbook.md`

- [ ] **Step 1: Write the runbook**

Create `docs/deploy-runbook.md`:
```markdown
# KSaju Deploy Runbook (Vercel + ksaju.me)

> One-time setup to take the app live. The app is zero-config Next.js
> with **no environment variables** and no external services yet.

## 1. Push the repo
```bash
git push origin main
```

## 2. Import into Vercel
1. Go to https://vercel.com → **Add New… → Project**.
2. Import the GitHub repo `heyday1019/ksaju` (authorize GitHub if asked).
3. Framework Preset: **Next.js** (auto-detected). Leave Build/Output settings default.
4. Environment Variables: **none** — skip.
5. Click **Deploy**. Wait for the first build to finish.

## 3. Verify the preview deployment
Open the generated `*.vercel.app` URL and check:
- `/` loads (birth form), `/inyeon` loads.
- Enter a birthday → saju result renders.
- On `/inyeon`, pick an idol → compatibility modal → **Share ✨** downloads a PNG.
- Paste the `*.vercel.app` URL into a chat / https://www.opengraph.xyz to confirm the OG card renders.

## 4. Connect the domain ksaju.me
1. Vercel → Project → **Settings → Domains** → add `ksaju.me` and `www.ksaju.me`.
2. Vercel shows the required DNS records. At your domain registrar, set:
   - `ksaju.me` → **A** record to Vercel's IP (as shown), or use Vercel nameservers.
   - `www.ksaju.me` → **CNAME** to `cname.vercel-dns.com` (as shown).
3. Wait for DNS propagation + automatic SSL issuance (minutes to a few hours).

## 5. Final checks
- Visit https://ksaju.me (HTTPS, no warnings).
- https://ksaju.me/robots.txt and https://ksaju.me/sitemap.xml resolve.
- Re-check the OG card on https://www.opengraph.xyz with the real domain.

## Rollback
Vercel → Deployments → pick a previous healthy deployment → **Promote to Production**.
```

- [ ] **Step 2: Commit**

```bash
git add docs/deploy-runbook.md
git commit -m "docs: Vercel + ksaju.me deploy runbook"
```

---

## Task 7: Final verification + roadmap docs

**Files:**
- Modify: `CLAUDE.md`, `task-log.md`

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: PASS — all prior tests + the new `robots` and `sitemap` tests (≈146 total).

- [ ] **Step 2: Lint + type-check**

Run: `npm run lint && npx tsc --noEmit`
Expected: lint shows only the 2 pre-existing warnings (`form.tsx` ref, `saju-data.ts` YinYang); tsc clean.

- [ ] **Step 3: Production build (the OG image / metadata routes must generate)**

Run: `npm run build`
Expected: build succeeds. Route output includes `/`, `/inyeon`, and the metadata routes `/opengraph-image`, `/robots.txt`, `/sitemap.xml`. (If the build hits a transient Google-font fetch error in `layout.tsx`, re-run once — it is unrelated to this change.)

- [ ] **Step 4: Update roadmap docs**

In `CLAUDE.md`, update roadmap step 9 line to note launch-readiness is done and only the Vercel/DNS runbook execution remains (e.g. `9. 🔨 Vercel 배포 + ksaju.me — 런치 준비(OG/robots/sitemap/메타) 완료(사이클 14), 배포 실행은 docs/deploy-runbook.md`). Add a cycle-14 completion entry to `task-log.md` summarizing the work, commits, and that the deploy runbook is ready for the user.

Then commit:
```bash
git add CLAUDE.md task-log.md
git commit -m "docs: mark cycle 14 (launch-readiness) complete"
```

---

## Self-Review Notes (author)

- **Spec coverage:** metadata (metadataBase/OG/twitter) → T4 ✓; opengraph-image (next/og, latin, hanji palette) → T3 ✓; robots → T1 ✓; sitemap → T2 ✓; cleanup `_org` → T5 ✓; deploy runbook → T6 ✓; tests for robots/sitemap → T1/T2 ✓; build verification of metadata+OG → T7 ✓; out-of-scope items (Vercel/DNS automation, CJK OG, analytics) are deliberately only in the runbook/not implemented ✓.
- **Type consistency:** `robots()` returns `MetadataRoute.Robots`, `sitemap()` returns `MetadataRoute.Sitemap`; OG exports `alt`/`size`/`contentType` + default `Image()` per Next convention; metadata uses `Metadata` type already imported in `layout.tsx`. Sitemap URLs (`https://ksaju.me/`, `/inyeon`) match between impl and test. robots `sitemap` URL matches across robots.ts and the runbook.
- **Placeholders:** none — every code/command step is complete.
