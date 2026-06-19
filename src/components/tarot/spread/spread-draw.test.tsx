// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Render motion.* as plain elements, dropping animation-only props.
vi.mock("motion/react", () => {
  const DROP = new Set(["initial", "animate", "exit", "transition", "whileTap", "whileHover", "layout", "layoutId"]);
  const make = (tag: string) => ({ children, ...rest }: Record<string, unknown>) => {
    const safe: Record<string, unknown> = {};
    for (const k of Object.keys(rest)) if (!DROP.has(k)) safe[k] = rest[k];
    return React.createElement(tag, safe, children as React.ReactNode);
  };
  return {
    motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MotionConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
vi.mock("next-intl", () => ({
  useTranslations: () => (k: string, vars?: Record<string, string>) => (vars?.position ? `${k}:${vars.position}` : k),
  useLocale: () => "en",
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("./spread-result", () => ({
  SpreadResult: () => <div data-testid="spread-result" />,
}));

import { SpreadDraw } from "./spread-draw";
import type { UserSaju } from "@/lib/saju-types";

const saju: UserSaju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };

describe("SpreadDraw", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({ past: "p", present: "c", future: "f", synthesis: "s" }),
    } as Response);
  });

  it("draws all three positions in order, then shows the result", async () => {
    render(<SpreadDraw saju={saju} />);
    // The draw button is labelled for the next position.
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:past" }));
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:present" }));
    fireEvent.click(screen.getByRole("button", { name: "drawPosition:future" }));
    expect(await screen.findByTestId("spread-result")).toBeInTheDocument();
  });
});
