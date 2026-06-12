"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { GlobeIcon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES = [
  { code: "en", label: "EN · English" },
  { code: "ja", label: "JA · 日本語" },
  { code: "ko", label: "KO · 한국어" },
  { code: "zh-TW", label: "ZH · 繁中" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Language"
        >
          <HugeiconsIcon icon={GlobeIcon} className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => router.replace(pathname, { locale: code })}
          >
            <span
              className={
                locale === code
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }
            >
              {label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
