// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// usePathname을 가변값으로 모킹 (vi.hoisted로 호이스팅 안전)
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
// next-themes 모킹 — ThemeToggle이 provider/matchMedia 없이 결정적으로 렌더되도록
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));
// LocaleSwitcher 의존성 모킹 (정적 import로 인해 필요)
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("로고와 두 네비 링크를 올바른 href로 렌더한다", () => {
    nav.pathname = "/";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /My Saju/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Inyeon/ })).toHaveAttribute("href", "/inyeon");
  });

  it("현재 경로(/inyeon) 링크에 aria-current='page'를 표시한다", () => {
    nav.pathname = "/inyeon";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /Inyeon/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /My Saju/ })).not.toHaveAttribute("aria-current");
  });

  it("홈(/) 경로에서는 My Saju가 활성이다", () => {
    nav.pathname = "/";
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /My Saju/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Inyeon/ })).not.toHaveAttribute("aria-current");
  });

  it("labels prop으로 커스텀 네비 텍스트 렌더", () => {
    render(
      <SiteHeader labels={{ mySaju: "私の四柱", inyeon: "縁" }} />
    );
    expect(screen.getByText("私の四柱")).toBeInTheDocument();
    expect(screen.getByText("縁")).toBeInTheDocument();
  });

  it("labels prop 미전달 시 EN 기본값 사용", () => {
    render(<SiteHeader />);
    expect(screen.getByText("My Saju")).toBeInTheDocument();
    expect(screen.getByText("Inyeon")).toBeInTheDocument();
  });
});
