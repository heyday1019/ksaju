// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleSwitcher } from "./locale-switcher";

const mockReplace = vi.fn();
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

describe("LocaleSwitcher", () => {
  beforeEach(() => mockReplace.mockClear());

  it("4개 locale 옵션 렌더", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText("EN · English")).toBeInTheDocument();
    expect(screen.getByText("JA · 日本語")).toBeInTheDocument();
    expect(screen.getByText("KO · 한국어")).toBeInTheDocument();
    expect(screen.getByText("ZH · 繁中")).toBeInTheDocument();
  });

  it("현재 locale(en)에 font-semibold 클래스", () => {
    render(<LocaleSwitcher />);
    const enBtn = screen.getByText("EN · English");
    expect(enBtn.className).toContain("font-semibold");
  });

  it("JA 선택 시 router.replace 호출", async () => {
    render(<LocaleSwitcher />);
    await userEvent.click(screen.getByText("JA · 日本語"));
    expect(mockReplace).toHaveBeenCalledWith("/", { locale: "ja" });
  });
});
