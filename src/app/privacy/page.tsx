import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · KSaju",
  description: "How KSaju handles your data. For entertainment 🌙",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <article className="w-full max-w-2xl space-y-5 text-sm leading-relaxed text-foreground">
        <h1 className="font-display text-3xl font-bold">Privacy</h1>
        <p className="text-muted-foreground">
          KSaju is a fun, for-entertainment saju toy. We keep data collection to a minimum.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Anonymous usage events (pages viewed, buttons tapped) to understand how the site is used.</li>
            <li>A coarse <strong>age range</strong> (e.g. 18–24) derived from the birth date you enter. We never send or store your exact birth date.</li>
            <li>Approximate country, inferred from your IP address by our analytics provider.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">What we do not do</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>No accounts, no login, no advertising profiles.</li>
            <li>No cookies for analytics — events are anonymous and not linked across visits.</li>
            <li>Your birth date is used in your browser to compute your saju; the raw date is not stored on our servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Third parties</h2>
          <p>
            We use <strong>PostHog</strong> for anonymous product analytics. Your usage events are
            processed by PostHog on our behalf.
          </p>
        </section>

        <p className="text-muted-foreground">
          Questions? Reach out at{" "}
          <a className="text-primary underline-offset-2 hover:underline" href="mailto:hello@ksaju.me">
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
