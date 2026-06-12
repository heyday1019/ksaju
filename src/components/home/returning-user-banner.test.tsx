// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReturningUserBanner } from "./returning-user-banner";

const onContinue = vi.fn();
const onReset = vi.fn();

afterEach(() => { vi.clearAllMocks(); });

describe("ReturningUserBanner", () => {
  it("일간 한자와 'Welcome back' 텍스트를 렌더한다", () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText("甲")).toBeInTheDocument();
  });

  it("Continue 버튼 클릭 시 onContinue 호출", async () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("'Change birthday' 링크 클릭 시 onReset 호출", async () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    await userEvent.click(screen.getByRole("button", { name: /change birthday/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("일간별로 서로 다른 오행 레이블을 보여준다", () => {
    const { rerender } = render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Wood/i)).toBeInTheDocument();

    rerender(
      <ReturningUserBanner dayMaster="壬" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Water/i)).toBeInTheDocument();
  });
});
