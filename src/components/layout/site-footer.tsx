import Link from "next/link";

/** Slim footer. Trust-page nav (About/FAQ/Privacy/Terms) + entertainment disclaimer. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-8 border-t border-border/50 px-8 py-6 text-center text-xs text-muted-foreground">
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
      <p className="mt-2">KSaju · For entertainment 🌙</p>
    </footer>
  );
}
