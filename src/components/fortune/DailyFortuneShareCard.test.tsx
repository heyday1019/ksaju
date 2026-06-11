// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortuneShareCard } from "./DailyFortuneShareCard";
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

describe("DailyFortuneShareCard", () => {
  it("renders today's pillar hanja as the hero", () => {
    render(<DailyFortuneShareCard ref={null} data={DATA} />);
    expect(screen.getByText("壬申")).toBeInTheDocument();
  });

  it("renders the fortune message", () => {
    render(<DailyFortuneShareCard ref={null} data={DATA} />);
    expect(screen.getByText(/The universe has your back today/)).toBeInTheDocument();
  });

  it("renders the lucky color badge", () => {
    render(<DailyFortuneShareCard ref={null} data={DATA} />);
    expect(screen.getByText("Sage Green")).toBeInTheDocument();
  });

  it("renders the ksaju.me watermark via ShareCardFooter", () => {
    render(<DailyFortuneShareCard ref={null} data={DATA} />);
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
  });

  it("renders the energy stars (4 filled + 1 empty)", () => {
    render(<DailyFortuneShareCard ref={null} data={DATA} />);
    const starsText = "★★★★☆";
    expect(screen.getByText(starsText)).toBeInTheDocument();
  });
});
