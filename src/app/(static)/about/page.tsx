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
