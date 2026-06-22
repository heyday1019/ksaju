import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpreadScreen } from "./SpreadScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

test("사주 없으면 안내가 보인다", () => {
  render(<SpreadScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
});

test("뽑기 버튼을 누르면 과거/현재/미래 3장과 합 문장이 보인다", async () => {
  render(<SpreadScreen me={me} onNeedSaju={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: /카드 뽑기/ }));
  expect(await screen.findByText(/과거의 카드/)).toBeInTheDocument();
  expect(screen.getByText(/현재의 카드/)).toBeInTheDocument();
  expect(screen.getByText(/미래의 카드/)).toBeInTheDocument();
});
