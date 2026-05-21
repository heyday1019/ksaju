"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // SSR/CSR hydration 안전을 위한 mount-detection. next-themes 표준 패턴.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        size="icon"
        variant="ghost"
        disabled
        aria-label="Loading theme toggle"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} />
    </Button>
  );
}
