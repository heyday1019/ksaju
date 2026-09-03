// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const store = vi.hoisted(() => ({ saju: null as unknown }));
vi.mock("@/lib/saju-storage", () => ({
  loadUserSaju: () => store.saju,
  saveUserSaju: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/components/kst/birth-form", () => ({
  BirthForm: () => <div data-testid="birth-form" />,
}));
vi.mock("@/components/tarot/tarot-draw", () => ({
  TarotDraw: () => <div data-testid="tarot-draw" />,
}));
// Mock the server action so the test never imports server-only manseryeok.
vi.mock("@/app/actions/saju", () => ({ calcUserSaju: vi.fn() }));

import { TarotView } from "./tarot-view";

describe("TarotView", () => {
  beforeEach(() => { store.saju = null; });

  it("shows the birth form when no saju is stored", async () => {
    store.saju = null;
    render(<TarotView />);
    expect(await screen.findByTestId("birth-form")).toBeInTheDocument();
    expect(screen.queryByTestId("tarot-draw")).toBeNull();
  });

  it("shows the draw when a saju is stored", async () => {
    store.saju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };
    render(<TarotView />);
    expect(await screen.findByTestId("tarot-draw")).toBeInTheDocument();
    expect(screen.queryByTestId("birth-form")).toBeNull();
  });
});
