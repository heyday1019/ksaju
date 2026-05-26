// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatibilityModal } from "./compatibility-modal";
import { compatForIdol } from "@/lib/idols";
import type { Idol } from "@/lib/idols";
import type { SajuPillars } from "@/lib/compatibility";

const me: SajuPillars = { year: "壬申", month: "己酉", day: "辛卯" };
const idol: Idol = {
  id: "jin-bts",
  name: "Jin",
  group: "BTS",
  birthdate: "1992-12-04",
  saju: {
    year: { kr: "임신", hanja: "壬申" },
    month: { kr: "신해", hanja: "辛亥" },
    day: { kr: "갑인", hanja: "甲寅" },
    dayMaster: "甲",
  },
};
const result = compatForIdol(me, idol);

describe("CompatibilityModal", () => {
  it("점수·레이블·아이돌명을 렌더한다", () => {
    render(
      <CompatibilityModal
        open
        onClose={() => {}}
        mePillars={me}
        idol={idol}
        result={result}
      />,
    );
    expect(screen.getByText(String(result.score))).toBeInTheDocument();
    expect(screen.getByText(result.label)).toBeInTheDocument();
    expect(screen.getByText(/You × Jin/)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
  });

  it("'Check another idol'이 onClose를 호출한다", async () => {
    const onClose = vi.fn();
    render(
      <CompatibilityModal
        open
        onClose={onClose}
        mePillars={me}
        idol={idol}
        result={result}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /check another idol/i }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
