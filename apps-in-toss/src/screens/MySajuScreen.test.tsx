import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { MySajuScreen } from "./MySajuScreen";
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

const noop = { onSelect: () => {}, onRemove: () => {} };

test("저장된 사람이 없으면 생일 폼이 바로 뜬다", async () => {
  const onAdd = vi.fn(async () => {});
  render(
    <MySajuScreen profiles={[]} active={null} onAdd={onAdd} {...noop} />,
  );
  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), "1994");
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), "9");
  await userEvent.selectOptions(screen.getByLabelText("태어난 날"), "12");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));

  expect(onAdd).toHaveBeenCalledWith(
    "나",
    expect.objectContaining({ year: 1994, month: 9, day: 12 }),
  );
});

test("사주가 저장돼 있어도 '+ 사람 추가' 로 다른 사람 생일 폼을 열 수 있다", async () => {
  render(
    <MySajuScreen
      profiles={[me]}
      active={me}
      onAdd={vi.fn(async () => {})}
      {...noop}
    />,
  );
  // 저장된 사주가 있으면 결과부터 보인다
  expect(screen.getByText("나의 일간")).toBeInTheDocument();
  expect(screen.queryByLabelText("태어난 해")).toBeNull();

  await userEvent.click(screen.getByRole("button", { name: "+ 사람 추가" }));

  expect(
    screen.getByRole("heading", { name: "누구의 사주를 볼까요?" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("태어난 해")).toBeInTheDocument();
});
