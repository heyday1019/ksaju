import { render, screen } from "@testing-library/react";
import { TarotScreen } from "./TarotScreen";
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
  render(<TarotScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
});

test("오늘의 카드가 이름·방향·본문과 함께 보인다", () => {
  render(<TarotScreen me={me} onNeedSaju={() => {}} />);
  // 방향(정/역)은 리딩의 일부다 — 같은 카드라도 본문이 달라진다.
  expect(screen.getByText(/정방향|역방향/)).toBeInTheDocument();
  // 모티프 한 줄은 78장 전부에 있다.
  expect(screen.getByText(/^—\s/)).toBeInTheDocument();
});

test("같은 사람·같은 날이면 카드도 방향도 고정된다", () => {
  const { unmount } = render(<TarotScreen me={me} onNeedSaju={() => {}} />);
  const first = document.body.textContent ?? "";
  unmount();
  render(<TarotScreen me={me} onNeedSaju={() => {}} />);
  expect(document.body.textContent).toBe(first);
});
