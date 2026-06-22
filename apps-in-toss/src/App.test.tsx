import { render, screen } from "@testing-library/react";
import App from "./App";

test("앱 셸이 K사주 헤더를 렌더한다", () => {
  render(<App />);
  expect(screen.getByRole("banner")).toHaveTextContent("K사주");
});
