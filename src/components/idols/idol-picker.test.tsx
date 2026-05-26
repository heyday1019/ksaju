// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdolPicker } from "./idol-picker";
import { idols } from "@/lib/idols";

describe("IdolPicker", () => {
  it("기본 상태(빈 검색)에서 그룹 브라우징으로 전체 아이돌을 렌더한다", () => {
    render(<IdolPicker onSelect={() => {}} />);
    // 그룹 헤딩 노출
    expect(screen.getByRole("heading", { name: "BTS" })).toBeInTheDocument();
    // 전체 아이돌이 radio로 렌더됨
    expect(screen.getAllByRole("radio")).toHaveLength(idols.length);
  });

  it("검색어를 입력하면 매칭 결과만 남는다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    await userEvent.type(screen.getByRole("searchbox"), "blackpink");
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(0);
    expect(radios.length).toBeLessThan(idols.length);
    // 결과는 모두 BLACKPINK
    for (const r of radios) {
      expect(within(r).getByText("BLACKPINK")).toBeInTheDocument();
    }
  });

  it("매칭이 없으면 empty state를 보여준다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    await userEvent.type(screen.getByRole("searchbox"), "zzzzzzz");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByText(/no idols found/i)).toBeInTheDocument();
  });

  it("카드를 선택하면 올바른 idol로 onSelect가 호출되고 단일 하이라이트된다", async () => {
    const onSelect = vi.fn();
    render(<IdolPicker onSelect={onSelect} />);
    await userEvent.type(screen.getByRole("searchbox"), "rm");
    const rm = screen.getByRole("radio");
    await userEvent.click(rm);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ id: "rm-bts" });
    expect(rm).toHaveAttribute("aria-checked", "true");
  });

  it("단일 선택: 다른 카드를 고르면 이전 선택이 해제된다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[0]);
    await userEvent.click(radios[1]);
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });
});
