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
            href="mailto:ksaju.korea@gmail.com"
          >
            ksaju.korea@gmail.com
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
