// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InyeonPage from "./page";

describe("InyeonPage", () => {
  it("'coming soon' 플레이스홀더를 렌더한다", () => {
    render(<InyeonPage />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByText(/compatibility/i)).toBeInTheDocument();
  });
});
