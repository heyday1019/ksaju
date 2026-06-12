"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";

interface SiteHeaderProps {
  labels?: { mySaju: string; inyeon: string };
  showLocaleSwitcher?: boolean;
}

const DEFAULTS = { mySaju: "My Saju", inyeon: "Inyeon" };

/** 모든 페이지 공통 슬림 헤더: 로고(→/) + 네비 + 테마토글. usePathname으로 활성표시. */
export function SiteHeader({
  labels = DEFAULTS,
  showLocaleSwitcher = false,
}: SiteHeaderProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/", label: labels.mySaju },
    { href: "/inyeon", label: labels.inyeon },
  ] as const;

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-6 pb-3 pt-9">
      <Link href="/" className="flex items-baseline gap-1.5">
        <span className="font-display text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </span>
        <span className="hanja text-sm font-bold text-muted-foreground">사주</span>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || /^\/[a-z]{2}(-[A-Z]{2})?(\/)?$/.test(pathname)
              : pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        {showLocaleSwitcher && <LocaleSwitcher />}
        <ThemeToggle />
      </nav>
    </header>
  );
}
