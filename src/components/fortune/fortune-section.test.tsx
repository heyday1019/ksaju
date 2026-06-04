// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneSection } from "./fortune-section";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneSection", () => {
  it("운세 4카드 제목을 렌더한다", () => {
    render(<FortuneSection userSaju={RM} luck={LUCK} />);
    expect(screen.getByText(/Money/)).toBeInTheDocument();
    expect(screen.getByText(/Love/)).toBeInTheDocument();
    expect(screen.getByText(/Career/)).toBeInTheDocument();
    expect(screen.getByText(/This Year/)).toBeInTheDocument();
  });

  it("Share 티저 버튼은 비활성(disabled)이다", () => {
    render(<FortuneSection userSaju={RM} luck={LUCK} />);
    const share = screen.getByRole("button", { name: /share/i });
    expect(share).toBeDisabled();
  });
});
