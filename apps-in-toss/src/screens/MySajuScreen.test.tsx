import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MySajuScreen } from "./MySajuScreen";

test("생일 입력 후 4기둥과 일간이 보인다", async () => {
  const onCalc = vi.fn();
  render(<MySajuScreen saju={null} onCalc={onCalc} />);
  await userEvent.type(screen.getByPlaceholderText("년"), "1994");
  await userEvent.type(screen.getByPlaceholderText("월"), "9");
  await userEvent.type(screen.getByPlaceholderText("일"), "12");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));
  expect(await screen.findByText("일주")).toBeInTheDocument();
  expect(onCalc).toHaveBeenCalled();
});
