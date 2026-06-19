// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SpreadCardBack } from "./spread-card-back";

describe("SpreadCardBack", () => {
  it("renders an svg with the ㅎ stamp", () => {
    const { container, getByText } = render(<SpreadCardBack className="w-10" />);
    expect(container.querySelector("svg")).toBeTruthy();
    expect(getByText("ㅎ")).toBeTruthy();
  });
  it("forwards className to the svg", () => {
    const { container } = render(<SpreadCardBack className="w-10" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("w-10");
  });
});
