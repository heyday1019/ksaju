// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneShareCard } from "./fortune-share-card";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneShareCard", () => {
  it("renders the day-master hero, four fortunes and the watermark", () => {
    render(<FortuneShareCard userSaju={RM} luck={LUCK} />);
    // 辛 day master → "辛 Metal" hero. Text is split across a <span> + text node,
    // and "Metal" alone also appears in a fortune line, so match the hero's exact
    // composite textContent.
    expect(
      screen.getByText((_, el) => el?.textContent === "辛 Metal"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Money/)).toBeInTheDocument();
    expect(screen.getByText(/Love/)).toBeInTheDocument();
    expect(screen.getByText(/Career/)).toBeInTheDocument();
    expect(screen.getByText(/This Year/)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });
});
