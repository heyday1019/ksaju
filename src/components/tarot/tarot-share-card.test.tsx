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
});
