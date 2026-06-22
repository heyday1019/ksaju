import { render, screen } from "@testing-library/react";
import { TarotScreen } from "./TarotScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

test("사주 없으면 안내가 보인다", () => {
  render(<TarotScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
});

test("오늘의 카드 한국어 리딩이 결정적으로 보인다", () => {
  render(<TarotScreen me={me} onNeedSaju={() => {}} />);
  expect(screen.getByText(/오늘 당신의 카드는/)).toBeInTheDocument();
});
