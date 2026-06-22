import { render } from "@testing-library/react";
import { ShareFooter } from "./ShareFooter";

test("푸터에 외부 링크/URL/QR이 없다", () => {
  const { container } = render(<ShareFooter />);
  expect(container.querySelectorAll("a").length).toBe(0);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).not.toMatch(/ksaju\.me|ko-fi|http/i);
  expect(container.textContent).toContain("K사주");
});
