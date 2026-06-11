// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortuneShareModal } from "./DailyFortuneShareModal";
import type { DailyFortuneData } from "./DailyFortuneShareCard";

const DATA: DailyFortuneData = {
  id: "test",
  date: "2026-06-11",
  day_master: "辛",
  today_pillar: "壬申",
  relation: "generate-me",
  message: "The universe has your back today — lean into it! 🍀",
  energy: 4,
  lucky_color: "Sage Green",
};

describe("DailyFortuneShareModal", () => {
  it("renders the share card and Share button when open", () => {
    render(<DailyFortuneShareModal open onClose={() => {}} data={DATA} />);
    expect(screen.getByText(/오늘의 운세/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
  });

  it("renders nothing when closed", () => {
    render(
      <DailyFortuneShareModal open={false} onClose={() => {}} data={DATA} />,
    );
    expect(screen.queryByText(/오늘의 운세/i)).not.toBeInTheDocument();
  });
});
