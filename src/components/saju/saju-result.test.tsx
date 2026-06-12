// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SajuResult } from "./saju-result";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
import { DAY_MASTER_KEYWORDS } from "@/lib/saju-data";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";
import type { KSTResult } from "@/lib/kst-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

const KST: KSTResult = {
  sourceLocal: {
    dateLabel: "Sep 12, 1992",
    timeLabel: null,
    timezone: { city: "Seoul", iana: "Asia/Seoul", gmt: "GMT+9" },
  },
  kst: {
    year: 1992,
    month: 9,
    day: 12,
    hour: null,
    minute: null,
    dateLabelKo: "1992년 9월 12일",
    timeLabel: null,
    weekdayKo: "토요일",
    weekdayEn: "Saturday",
  },
  jiziHour: null,
  funFact: "Born in the Year of the Monkey.",
};

const LUCK: CurrentLuck = {
  yearPillar: "丙午",
  monthPillar: "癸巳",
};

describe("SajuResult", () => {
  it("일주 한자와 일간 키워드를 렌더한다", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    expect(screen.getAllByText("辛").length).toBeGreaterThan(0);
    expect(screen.getByText(DAY_MASTER_KEYWORDS["辛"])).toBeInTheDocument();
  });

  it("오행 밸런스를 보여준다 (metal 3)", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    expect(screen.getByLabelText("Metal: 3")).toBeInTheDocument();
  });

  it("KST 날짜와 daily saju tip을 보여준다", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    expect(screen.getByText(/1992년 9월 12일/)).toBeInTheDocument();
    expect(screen.getByText(/Today's saju tip/i)).toBeInTheDocument();
  });

  it("'인연' 페이지로 가는 궁합 CTA 링크를 렌더한다", () => {
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={() => {}} />);
    const cta = screen.getByRole("link", { name: /인연.*compatibility/i });
    expect(cta).toHaveAttribute("href", "/inyeon");
  });

  it("Edit 버튼이 onEdit을 호출한다", async () => {
    const onEdit = vi.fn();
    render(<SajuResult userSaju={RM} kst={KST} currentLuck={LUCK} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: /edit my info/i }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
