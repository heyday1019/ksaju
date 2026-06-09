// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdolPicker } from "./idol-picker";
import { idols } from "@/lib/idols";

describe("IdolPicker", () => {
  it("기본 상태(빈 검색): 정렬상 첫 그룹(aespa)이 펼쳐져 멤버가 보인다", () => {
    render(<IdolPicker onSelect={() => {}} />);
    const aespaToggle = screen.getByRole("button", { name: /aespa/i });
    expect(aespaToggle).toHaveAttribute("aria-expanded", "true");
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(0);
    for (const r of radios) {
      expect(within(r).getByText("aespa")).toBeInTheDocument();
    }
    // 다른 그룹(BTS)은 접혀 있다
    expect(screen.getByRole("button", { name: /BTS/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("그룹 토글이 알파벳 순서로 렌더된다 (aespa가 BTS보다 먼저)", () => {
    render(<IdolPicker onSelect={() => {}} />);
    const names = screen.getAllByRole("button").map((b) => b.textContent || "");
    const aespaIdx = names.findIndex((n) => /aespa/i.test(n));
    const btsIdx = names.findIndex((n) => /BTS/.test(n));
    expect(aespaIdx).toBeGreaterThanOrEqual(0);
    expect(aespaIdx).toBeLessThan(btsIdx);
  });

  it("검색 힌트를 보여준다", () => {
    render(<IdolPicker onSelect={() => {}} />);
    expect(screen.getByText(/try a name or group/i)).toBeInTheDocument();
  });

  it("그룹 토글을 누르면 해당 그룹 멤버만 펼쳐지고, 다시 누르면 접힌다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    const btsToggle = screen.getByRole("button", { name: /BTS/ });
    await userEvent.click(btsToggle);
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(0);
    // 펼쳐진 카드는 모두 BTS
    for (const r of radios) {
      expect(within(r).getByText("BTS")).toBeInTheDocument();
    }
    expect(btsToggle).toHaveAttribute("aria-expanded", "true");
    // 다시 누르면 접힘
    await userEvent.click(btsToggle);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(btsToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("아코디언: 다른 그룹을 열면 이전 그룹이 닫힌다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /BTS/ }));
    expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: /BLACKPINK/ }));
    const radios = screen.getAllByRole("radio");
    // 이제 BLACKPINK 멤버만 노출
    for (const r of radios) {
      expect(within(r).getByText("BLACKPINK")).toBeInTheDocument();
    }
  });

  it("검색어를 입력하면 그룹 접힘과 무관하게 매칭 결과를 플랫하게 보여준다", async () => {
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

  it("단일 선택: 같은 그룹 내 다른 카드를 고르면 이전 선택이 해제된다", async () => {
    render(<IdolPicker onSelect={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /BTS/ }));
    const radios = screen.getAllByRole("radio");
    await userEvent.click(radios[0]);
    await userEvent.click(radios[1]);
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });
});
