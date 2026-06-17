// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "en" }));

import { TarotShareCard } from "./tarot-share-card";
import { getCardById } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

const saju: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛", isTimeCorrected: false,
};

describe("TarotShareCard", () => {
  it("renders the card name, theme, reading, and CTA footer", () => {
    render(<TarotShareCard saju={saju} card={getCardById(0)!} reading="A bright start awaits." />);
    expect(screen.getByText("The Fool")).toBeInTheDocument();
    expect(screen.getByText(/A bright start awaits\./)).toBeInTheDocument();
    expect(screen.getByText(/ksaju\.me/)).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });

  it("ko: leads with the Korean card name as the title, English as subtitle", () => {
    const { container } = render(
      <TarotShareCard saju={saju} card={getCardById(0)!} reading="시작이 빛나요." locale="ko" />,
    );
    const title = container.querySelector(".font-display.text-2xl");
    expect(title?.textContent).toBe("광대");          // name_kr leads
    expect(screen.getByText("The Fool")).toBeInTheDocument(); // name_en now the subtitle
  });

  it("ko: localizes the header (오늘의 카드 · element in hangul)", () => {
    // saju dayMaster 辛 = metal → ko element label "금"
    render(<TarotShareCard saju={saju} card={getCardById(0)!} reading="시작이 빛나요." locale="ko" />);
    expect(screen.getByText("오늘의 카드 · 금")).toBeInTheDocument();
  });

  it("en: header stays English (Card of the Day · Metal)", () => {
    render(<TarotShareCard saju={saju} card={getCardById(0)!} reading="A bright start awaits." locale="en" />);
    expect(screen.getByText("Card of the Day · Metal")).toBeInTheDocument();
  });

  it("en (default) leads with the English card name", () => {
    const { container } = render(
      <TarotShareCard saju={saju} card={getCardById(0)!} reading="A bright start awaits." locale="en" />,
    );
    const title = container.querySelector(".font-display.text-2xl");
    expect(title?.textContent).toBe("The Fool");
  });
});
