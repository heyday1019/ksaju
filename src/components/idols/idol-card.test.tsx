// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdolCard } from "./idol-card";
import type { Idol } from "@/lib/idols";

const RM: Idol = {
  id: "rm-bts",
  name: "RM",
  group: "BTS",
  birthdate: "1992-09-12",
  saju: {
    year: { kr: "임신", hanja: "壬申" },
    month: { kr: "기유", hanja: "己酉" },
    day: { kr: "신묘", hanja: "辛卯" },
    dayMaster: "辛",
  },
};

describe("IdolCard", () => {
  it("이름과 그룹을 렌더한다", () => {
    render(<IdolCard idol={RM} selected={false} onSelect={() => {}} />);
    expect(screen.getByText("RM")).toBeInTheDocument();
    expect(screen.getByText("BTS")).toBeInTheDocument();
  });

  it("radio 역할 + aria-checked로 선택 상태를 노출한다", () => {
    const { rerender } = render(
      <IdolCard idol={RM} selected={false} onSelect={() => {}} />,
    );
    const radio = screen.getByRole("radio");
    expect(radio).toHaveAttribute("aria-checked", "false");
    rerender(<IdolCard idol={RM} selected onSelect={() => {}} />);
    expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true");
  });

  it("클릭하면 onSelect가 해당 idol로 호출된다", async () => {
    const onSelect = vi.fn();
    render(<IdolCard idol={RM} selected={false} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio"));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(RM);
  });
});
