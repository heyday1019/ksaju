// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompatShareCard } from "./compat-share-card";
import { getReading } from "@/lib/reading";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

const ME: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const OTHER: SajuPillars = { year: "甲子", month: "丙寅", day: "戊辰" };
const RESULT: CompatibilityResult = {
  score: 87,
  label: "Steamy chemistry 🔥",
  breakdown: {
    dayMaster: { score: 30, type: "combo", note: "Magnetic pull (합)" },
    elementBalance: { score: 27 },
    branch: { score: 30, type: "three-harmony", note: "In sync (삼합)" },
  },
};

describe("CompatShareCard", () => {
  it("renders score, label, both names and the watermark", () => {
    render(
      <CompatShareCard
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER }}
        result={RESULT}
      />,
    );
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
    expect(screen.getByText("Steamy chemistry 🔥")).toBeInTheDocument();
    expect(screen.getAllByText(/RM/).length).toBeGreaterThan(0);
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
    // reading hero is rendered; analytical breakdown is gone
    expect(
      screen.getByText(getReading(ME, OTHER, RESULT.score)),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Day Master:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Branch:/)).not.toBeInTheDocument();
  });

  it("colors the mini-saju hanja by element (辛 in 辛卯 → metal)", () => {
    const { container } = render(
      <CompatShareCard
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER }}
        result={RESULT}
      />,
    );
    // ME.day = 辛卯 → 辛 is metal → text-wuxing-geum
    expect(container.querySelector(".text-wuxing-geum")).not.toBeNull();
  });
});
