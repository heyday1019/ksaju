// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFortune } from "./DailyFortune";
import type { DailyFortuneData } from "@/components/fortune/DailyFortuneShareCard";

const MOCK_DATA: DailyFortuneData = {
  id: "test-id",
  date: "2026-06-11",
  day_master: "辛",
  today_pillar: "壬申",
  relation: "generate-me",
  message: "The universe has your back today — lean into it! 🍀",
  energy: 4,
  lucky_color: "Sage Green",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DailyFortune", () => {
  it("shows loading skeleton (no Share button) while fetch is pending", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    render(<DailyFortune dayMaster="辛" />);
    expect(screen.queryByRole("button", { name: /share/i })).not.toBeInTheDocument();
  });

  it("renders fortune message and Share button after fetch resolves", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => MOCK_DATA,
    } as Response);

    render(<DailyFortune dayMaster="辛" />);

    await screen.findByText(/The universe has your back today/);
    expect(screen.getByText("Sage Green")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
    expect(screen.getByText(/Come back tomorrow/)).toBeInTheDocument();
  });

  it("renders today's pillar hanja in the date line", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => MOCK_DATA,
    } as Response);

    render(<DailyFortune dayMaster="辛" />);
    await screen.findByText(/壬申/);
  });
});
