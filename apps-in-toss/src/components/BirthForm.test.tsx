import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { BirthForm } from "./BirthForm";

test("년·월·일을 드롭다운으로 고르면 숫자로 제출한다", async () => {
  const onSubmit = vi.fn();
  render(<BirthForm onSubmit={onSubmit} />);

  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), "1994");
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), "9");
  await userEvent.selectOptions(screen.getByLabelText("태어난 날"), "12");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ year: 1994, month: 9, day: 12 }),
    "", // 이름 칸은 withName 일 때만 뜬다
  );
});

test("태어난 시각은 '모름'이 기본이고, 고르면 시(hour)로 넘어간다", async () => {
  const onSubmit = vi.fn();
  render(<BirthForm onSubmit={onSubmit} />);

  const hour = screen.getByLabelText("태어난 시각");
  expect((hour as HTMLSelectElement).value).toBe("");

  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), "2000");
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), "1");
  await userEvent.selectOptions(screen.getByLabelText("태어난 날"), "5");
  await userEvent.selectOptions(hour, "13");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ hour: 13 }),
    "",
  );
});

test("고른 달에 없는 날짜는 선택지에서 빠진다 (2월 30일 차단)", async () => {
  render(<BirthForm onSubmit={vi.fn()} />);
  await userEvent.selectOptions(screen.getByLabelText("태어난 해"), "2001");
  await userEvent.selectOptions(screen.getByLabelText("태어난 달"), "2");

  const days = screen.getByLabelText("태어난 날") as HTMLSelectElement;
  const values = [...days.options].map((o) => o.value);
  expect(values).toContain("28");
  expect(values).not.toContain("29"); // 2001은 평년
  expect(values).not.toContain("30");
});
