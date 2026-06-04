// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserSaju } from "@/lib/saju-types";

// 상대 사주 계산(server action) 모킹 — 고정 UserSaju 반환
vi.mock("@/app/actions/saju", () => ({
  calcUserSaju: vi.fn(async () => ({
    pillars: { year: "甲子", month: "丙寅", day: "戊辰", hour: null },
    dayMaster: "戊",
    isTimeCorrected: false,
  })),
}));

import { PartnerCompatSection } from "./partner-compat-section";

const ME: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("PartnerCompatSection", () => {
  it("이름+생일 제출 시 궁합 결과 모달이 열린다", async () => {
    render(<PartnerCompatSection userSaju={ME} />);
    await userEvent.type(screen.getByLabelText(/their name/i), "Alex");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await userEvent.type(dateInput, "1998-05-20");
    await userEvent.click(screen.getByRole("button", { name: /reveal compatibility/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText(/You × Alex/)).toBeInTheDocument();
  });
});
