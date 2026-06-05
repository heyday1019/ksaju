# KSaju Deploy Runbook (Vercel + ksaju.me)

> One-time setup to take the app live. The app is zero-config Next.js with
> **no environment variables** and no external services yet, so this is short.

## 1. Push the repo

```bash
git push origin main
```

## 2. Import into Vercel

1. Go to <https://vercel.com> → **Add New… → Project**.
2. Import the GitHub repo `heyday1019/ksaju` (authorize GitHub access if asked).
3. Framework Preset: **Next.js** (auto-detected). Leave Build & Output settings at their defaults.
4. Environment Variables: **none** — skip this section.
5. Click **Deploy** and wait for the first build to finish.

## 3. Verify the preview deployment

Open the generated `*.vercel.app` URL and check:

- `/` loads (birthday form); `/inyeon` loads.
- Enter a birthday on `/` → saju result + fortune cards render.
- On `/inyeon`: restore/enter your saju → expand an idol group → pick an idol → the compatibility modal opens → **Share ✨** downloads a PNG.
- Paste the `*.vercel.app` URL into <https://www.opengraph.xyz> (or a chat app) and confirm the OG card renders (KSaju wordmark + tagline).
- `*.vercel.app/robots.txt` and `*.vercel.app/sitemap.xml` resolve.

## 4. Connect the domain ksaju.me

1. Vercel → Project → **Settings → Domains** → add `ksaju.me` and `www.ksaju.me`.
2. Vercel shows the exact DNS records to create. At your domain registrar, set them:
   - Apex `ksaju.me` → **A** record to Vercel's shown IP (or switch to Vercel nameservers).
   - `www.ksaju.me` → **CNAME** to `cname.vercel-dns.com` (as shown).
3. Wait for DNS propagation and automatic SSL issuance (minutes to a few hours).

## 5. Final checks

- <https://ksaju.me> loads over HTTPS with no certificate warnings.
- <https://ksaju.me/robots.txt> and <https://ksaju.me/sitemap.xml> resolve.
- Re-check the OG card for the real domain on <https://www.opengraph.xyz>.

## 6. Turn on analytics (optional, anytime)

The app runs fine without analytics — events simply no-op until a key is present.

1. Create a project at <https://posthog.com> (free tier). Copy the **Project API key** (`phc_...`).
2. In Vercel → Project → **Settings → Environment Variables**, add for Production + Preview:
   - `NEXT_PUBLIC_POSTHOG_KEY` = your `phc_...` key
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (or `https://eu.i.posthog.com`)
3. Redeploy (Vercel → Deployments → Redeploy) so the new env vars are baked in.
4. For local dev, copy `.env.example` to `.env.local` and fill the same values.
5. In PostHog, build a funnel: `$pageview → saju_calculated → idol_picked → compat_revealed → card_shared`,
   and a breakdown of `idol_picked` by the `idol` property for most-picked bias.

## Rollback

Vercel → **Deployments** → pick a previous healthy deployment → **Promote to Production**.

## Notes

- The `sitemap.xml` / `robots.txt` / OG image all hard-code `https://ksaju.me`. If you
  ever change the production domain, update `metadataBase` in `src/app/layout.tsx`,
  the URL in `src/app/robots.ts`, and the base in `src/app/sitemap.ts`.
- Future deploys are automatic: pushing to `main` triggers a production deploy; other
  branches/PRs get preview deployments.
