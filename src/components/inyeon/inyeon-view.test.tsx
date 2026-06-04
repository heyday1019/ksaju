// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserSaju } from "@/lib/saju-types";

const loadMock = vi.fn();
const saveMock = vi.fn();
vi.mock("@/lib/saju-storage", () => ({
  loadUserSaju: () => loadMock(),
  saveUserSaju: (s: UserSaju) => saveMock(s),
}));

vi.mock("@/app/actions/saju", () => ({
  calcUserSaju: vi.fn(),
}));

import { InyeonView } from "./inyeon-view";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("InyeonView", () => {
  beforeEach(() => {
    loadMock.mockReset();
    saveMock.mockReset();
  });

  it("저장된 내 사주가 있으면 아이돌·상대 두 섹션을 렌더한다", async () => {
    loadMock.mockReturnValue(RM);
    render(<InyeonView />);
    // 아이돌 검색 섹션
    expect(await screen.findByRole("searchbox")).toBeInTheDocument();
    // 일반 상대 섹션 (이름 입력)
    expect(screen.getByLabelText(/their name/i)).toBeInTheDocument();
  });

  it("저장된 사주가 없으면 폴백 생일 폼을 렌더한다", async () => {
    loadMock.mockReturnValue(null);
    render(<InyeonView />);
    expect(
      await screen.findByRole("button", { name: /see my saju/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
