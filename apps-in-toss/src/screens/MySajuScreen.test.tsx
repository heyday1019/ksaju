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

test("생일이 없으면 오늘의 운세 티저가 폼 위에 뜨고, 눌러도 생일을 강요하지 않는다", async () => {
  const onAdd = vi.fn(async () => {});
  render(<MySajuScreen profiles={[]} active={null} onAdd={onAdd} {...noop} />);

  const teaser = screen.getByRole("button", { name: /생일 입력하기/ });
  expect(teaser).toBeInTheDocument();

  // 눌러도 새 화면이 열리지 않는다 — 같은 화면의 폼으로 데려갈 뿐이다.
  await userEvent.click(teaser);
  expect(screen.getByLabelText("태어난 해")).toBeInTheDocument();
  expect(onAdd).not.toHaveBeenCalled();
});

test("티저를 무시하고 폼을 바로 써도 똑같이 동작한다", async () => {
  const onAdd = vi.fn(async () => {});
  render(<MySajuScreen profiles={[]} active={null} onAdd={onAdd} {...noop} />);

  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), "1994");
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), "9");
  await userEvent.selectOptions(screen.getByLabelText("태어난 날"), "12");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));

  expect(onAdd).toHaveBeenCalledTimes(1);
});

test("사주가 있으면 티저 대신 실제 운세 카드가 보인다", async () => {
  render(
    <MySajuScreen profiles={[me]} active={me} onAdd={vi.fn(async () => {})} {...noop} />,
  );
  expect(screen.queryByRole("button", { name: /생일 입력하기/ })).toBeNull();
  // 규칙기반 운세는 동적 import 로 계산된다 — '{이름}의 오늘' 헤더로 확인한다.
  expect(await screen.findByText("나의 오늘")).toBeInTheDocument();
});

test("오행 균형에 해설 문장이 함께 나온다", async () => {
  render(
    <MySajuScreen profiles={[me]} active={me} onAdd={vi.fn(async () => {})} {...noop} />,
  );
  expect(screen.getByText("오행 균형")).toBeInTheDocument();
  // 辛卯·甲戌·癸酉 → 비어 있는 오행이 있어 '비어 있어요' 문장이 나온다.
  expect(screen.getByText(/비어 있어요|고르게|두터워요/)).toBeInTheDocument();
});
