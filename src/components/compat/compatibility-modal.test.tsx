// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CompatibilityModal } from "./compatibility-modal";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

const ME: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const OTHER_PILLARS: SajuPillars = { year: "甲子", month: "丙寅", day: "戊辰" };

const RESULT: CompatibilityResult = {
  score: 72,
  label: "Steady & flowing 🏔️💧",
  breakdown: {
    dayMaster: { score: 28, type: "same", note: "Kindred spirits (비화)" },
    elementBalance: { score: 22 },
    branch: { score: 22, type: "same", note: "Same wavelength" },
  },
};

describe("CompatibilityModal (범용)", () => {
  it("아이돌 케이스: name·sub·점수를 노출", () => {
    render(
      <CompatibilityModal
        open
        onClose={() => {}}
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER_PILLARS }}
        result={RESULT}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText(/RM · BTS/)).toBeInTheDocument();
    expect(within(dialog).getByText("You")).toBeInTheDocument();
  });

  it("상대 케이스: sub 없이 name만 노출 + closeLabel 적용", () => {
    const onClose = vi.fn();
    render(
      <CompatibilityModal
        open
        onClose={onClose}
        mePillars={ME}
        other={{ name: "Alex", pillars: OTHER_PILLARS }}
        result={RESULT}
        closeLabel="← Check someone else"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/You × Alex/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /check someone else/i }),
    ).toBeInTheDocument();
  });
});
