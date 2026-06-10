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
              href="mailto:ksaju.korea@gmail.com"
            >
              ksaju.korea@gmail.com
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
