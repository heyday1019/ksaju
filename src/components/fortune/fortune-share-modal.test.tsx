// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FortuneShareModal } from "./fortune-share-modal";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("FortuneShareModal", () => {
  it("renders the share card and a Share button when open", () => {
    render(
      <FortuneShareModal open onClose={() => {}} userSaju={RM} luck={LUCK} />,
    );
    expect(screen.getByText(/My Saju Fortune/i)).toBeInTheDocument();
    expect(screen.getAllByText(/💰/)[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share/i })).toBeEnabled();
  });

  it("renders nothing when closed", () => {
    render(
      <FortuneShareModal
        open={false}
        onClose={() => {}}
        userSaju={RM}
        luck={LUCK}
      />,
    );
    expect(screen.queryByText(/My Saju Fortune/i)).not.toBeInTheDocument();
  });
});
