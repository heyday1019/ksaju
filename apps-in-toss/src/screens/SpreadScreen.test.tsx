import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpreadScreen } from "./SpreadScreen";
import type { Profile } from "../state/profiles";

const me: Profile = {
  id: "p1",
  name: "나",
  saju: {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
    isTimeCorrected: false,
  },
};

test("사주 없으면 안내가 보인다", () => {
  render(<SpreadScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
});

test("뽑기 버튼을 누르면 과거/현재/미래 3장과 맺음말이 보인다", async () => {
  render(<SpreadScreen me={me} onNeedSaju={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: /카드 뽑기/ }));

  // 자리 이름은 카드 위(그리드)와 리딩 위에 각각 나온다.
  expect((await screen.findAllByText("과거")).length).toBeGreaterThan(0);
  expect(screen.getAllByText("현재").length).toBeGreaterThan(0);
  expect(screen.getAllByText("미래").length).toBeGreaterThan(0);

  // 세 장 모두 방향 배지를 단다.
  expect(screen.getAllByText(/정방향|역방향/)).toHaveLength(3);

  // 맺음말은 세 카드의 키워드를 엮는다 — 전에는 오행 하나로만 결정돼 늘 같았다.
  expect(screen.getByText(/한 걸음 옮겨보세요/)).toBeInTheDocument();
});
