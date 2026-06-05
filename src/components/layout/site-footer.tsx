import Link from "next/link";

/** Slim footer. Privacy link + entertainment disclaimer. Seeds the later About/FAQ footer. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-8 border-t border-border/50 px-8 py-6 text-center text-xs text-muted-foreground">
      <nav className="flex justify-center gap-4">
        <Link href="/privacy" className="underline-offset-2 hover:underline hover:text-foreground">
          Privacy
        </Link>
      </nav>
      <p className="mt-2">KSaju · For entertainment 🌙</p>
    </footer>
  );
}
