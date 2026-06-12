// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatibilityModal } from "./compatibility-modal";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/share-image", () => ({
  nodeToPngBlob: vi.fn().mockRejectedValue(new Error("no canvas in test")),
  shareOrDownloadPng: vi.fn(),
  canShareFiles: vi.fn(() => false),
}));

const ME: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const OTHER_PILLARS: SajuPillars = { year: "甲子", month: "丙寅", day: "戊辰" };

const RESULT: CompatibilityResult = {
  score: 72,
  label: "Steady & flowing 🏔️💧",
  breakdown: {
    dayMaster: { score: 28, type: "same", note: "Kindred spirits (비화)" },
    elementBalance: { score: 22 },
    branch: { score: 22, type: "same", note: "Same wavelength" },
  },
};

describe("CompatibilityModal (범용)", () => {
  it("아이돌 케이스: name·sub·점수를 노출", () => {
    render(
      <CompatibilityModal
        open
        onClose={() => {}}
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER_PILLARS }}
        result={RESULT}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("/100")).toBeInTheDocument();
    expect(within(dialog).getByText(/RM · BTS/)).toBeInTheDocument();
    expect(within(dialog).getByText("You")).toBeInTheDocument();
  });

  it("상대 케이스: sub 없이 name만 노출 + closeLabel 적용", () => {
    const onClose = vi.fn();
    render(
      <CompatibilityModal
        open
        onClose={onClose}
        mePillars={ME}
        other={{ name: "Alex", pillars: OTHER_PILLARS }}
        result={RESULT}
        closeLabel="← Check someone else"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/You × Alex/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /check someone else/i }),
    ).toBeInTheDocument();
  });

  it("Share 버튼 클릭 시 캡처 시도 (lib mock) — 에러 경로에서도 모달 유지", async () => {
    const user = userEvent.setup();
    render(
      <CompatibilityModal
        open
        onClose={() => {}}
        mePillars={ME}
        other={{ name: "RM", sub: "BTS", pillars: OTHER_PILLARS }}
        result={RESULT}
      />,
    );
    const dialog = screen.getByRole("dialog");
    const shareBtn = within(dialog).getByRole("button", { name: /share/i });
    expect(shareBtn).toBeEnabled();
    await user.click(shareBtn);
    // nodeToPngBlob is mocked to reject (no canvas in happy-dom) → modal
    // surfaces the inline error and stays open.
    expect(
      await within(dialog).findByText(/couldn't create image/i),
    ).toBeInTheDocument();
  });
});
