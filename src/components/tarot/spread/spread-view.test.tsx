// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const store = vi.hoisted(() => ({ saju: null as unknown }));
vi.mock("@/lib/saju-storage", () => ({ loadUserSaju: () => store.saju, saveUserSaju: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "en" }));
vi.mock("@/components/kst/birth-form", () => ({ BirthForm: () => <div data-testid="birth-form" /> }));
vi.mock("@/components/tarot/spread/spread-draw", () => ({ SpreadDraw: () => <div data-testid="spread-draw" /> }));
vi.mock("@/app/actions/saju", () => ({ calcUserSaju: vi.fn() }));

import { SpreadView } from "./spread-view";

describe("SpreadView", () => {
  beforeEach(() => { store.saju = null; });

  it("shows the birth form when no saju is stored", async () => {
    store.saju = null;
    render(<SpreadView />);
    expect(await screen.findByTestId("birth-form")).toBeInTheDocument();
    expect(screen.queryByTestId("spread-draw")).toBeNull();
  });

  it("shows the spread draw when a saju is stored", async () => {
    store.saju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };
    render(<SpreadView />);
    expect(await screen.findByTestId("spread-draw")).toBeInTheDocument();
    expect(screen.queryByTestId("birth-form")).toBeNull();
  });
});
