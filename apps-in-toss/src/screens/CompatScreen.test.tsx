import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { CompatScreen } from "./CompatScreen";
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
const friend: Profile = { ...me, id: "p2", name: "민지" };

test("사주 없으면 안내, 있으면 아이돌 검색이 보인다", () => {
  const { rerender } = render(
    <CompatScreen profiles={[]} me={null} onNeedSaju={() => {}} />,
  );
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
  rerender(<CompatScreen profiles={[me]} me={me} onNeedSaju={() => {}} />);
  expect(screen.getByPlaceholderText(/아이돌 검색/)).toBeInTheDocument();
});

test("아이돌 검색·선택 시 궁합 점수와 한국어 레이블이 보인다", async () => {
  render(<CompatScreen profiles={[me]} me={me} onNeedSaju={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/아이돌 검색/), "RM");
  await userEvent.click(await screen.findByRole("button", { name: /RM/ }));
  expect(await screen.findByText(/나 ✕ RM/)).toBeInTheDocument();
  expect(screen.getByText("/100")).toBeInTheDocument();
});

test("'친구 · 연인' 으로 바꾸면 저장된 사람과 생일 입력이 보인다", async () => {
  render(
    <CompatScreen profiles={[me, friend]} me={me} onNeedSaju={() => {}} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "친구 · 연인" }));

  expect(screen.getByRole("button", { name: "민지" })).toBeInTheDocument();
  expect(screen.getByLabelText("태어난 해")).toBeInTheDocument();
});

test("저장된 친구를 고르면 그 사람과의 궁합이 나온다", async () => {
  render(
    <CompatScreen profiles={[me, friend]} me={me} onNeedSaju={() => {}} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "친구 · 연인" }));
  await userEvent.click(screen.getByRole("button", { name: "민지" }));

  expect(await screen.findByText(/나 ✕ 민지/)).toBeInTheDocument();
});
