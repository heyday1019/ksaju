// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatibilitySection } from "./compatibility-section";
import type { UserSaju } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("CompatibilitySection", () => {
  it("아이돌을 선택하면 궁합 결과 모달이 열린다", async () => {
    render(<CompatibilitySection userSaju={RM} />);
    await userEvent.type(screen.getByRole("searchbox"), "rm");
    await userEvent.click(screen.getByRole("radio"));
    const dialog = await screen.findByRole("dialog");
    // 점수(/100)와 양쪽 사주 미니가 노출
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText("You")).toBeInTheDocument();
  });

  it("모달을 닫으면 결과 다시보기 버튼으로 재오픈할 수 있다", async () => {
    render(<CompatibilitySection userSaju={RM} />);
    await userEvent.type(screen.getByRole("searchbox"), "rm");
    await userEvent.click(screen.getByRole("radio"));
    await screen.findByRole("dialog");
    await userEvent.click(
      screen.getByRole("button", { name: /check another idol/i }),
    );
    const again = await screen.findByRole("button", {
      name: /view rm result again/i,
    });
    await userEvent.click(again);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
