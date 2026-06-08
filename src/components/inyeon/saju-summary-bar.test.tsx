// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SajuSummaryBar } from "./saju-summary-bar";
import { DAY_MASTER_KEYWORDS } from "@/lib/saju-data";
import type { UserSaju } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("SajuSummaryBar", () => {
  it("renders the day-master keyword and color-codes hanja by element", () => {
    const { container } = render(<SajuSummaryBar saju={RM} />);
    // day-master keyword (辛 = Yin Metal …)
    expect(screen.getByText(DAY_MASTER_KEYWORDS["辛"])).toBeInTheDocument();
    // 辛 is metal → text-wuxing-geum appears at least once (pillars + day master)
    expect(container.querySelector(".text-wuxing-geum")).not.toBeNull();
    // keeps the edit link
    expect(screen.getByRole("link", { name: /edit on home/i })).toHaveAttribute("href", "/");
  });
});
