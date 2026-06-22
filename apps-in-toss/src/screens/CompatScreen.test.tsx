import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatScreen } from "./CompatScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

test("사주 없으면 안내, 있으면 아이돌 검색이 보인다", () => {
  const { rerender } = render(<CompatScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
  rerender(<CompatScreen me={me} onNeedSaju={() => {}} />);
  expect(screen.getByPlaceholderText(/아이돌 검색/)).toBeInTheDocument();
});

test("아이돌 검색·선택 시 궁합 점수와 한국어 레이블이 보인다", async () => {
  render(<CompatScreen me={me} onNeedSaju={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/아이돌 검색/), "RM");
  await userEvent.click(await screen.findByRole("button", { name: /RM/ }));
  expect(await screen.findByText(/점/)).toBeInTheDocument();
});
