// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardCta } from "./card-cta";

const track = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/lib/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

describe("CardCta", () => {
  beforeEach(() => track.mockClear());

  it("links to /tarot and to Ko-fi", () => {
    render(<CardCta slug="the-fool" />);
    expect(screen.getByRole("link", { name: "ctaTarot" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "ctaDeck" })).toHaveAttribute(
      "href",
      "https://ko-fi.com/ksaju",
    );
  });

  it("opens the Ko-fi link safely in a new tab", () => {
    render(<CardCta slug="the-fool" />);
    const kofi = screen.getByRole("link", { name: "ctaDeck" });
    expect(kofi).toHaveAttribute("target", "_blank");
    expect(kofi).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("tracks each CTA with its target and slug", () => {
    render(<CardCta slug="the-fool" />);
    fireEvent.click(screen.getByRole("link", { name: "ctaTarot" }));
    expect(track).toHaveBeenCalledWith("card_cta_clicked", { target: "tarot", slug: "the-fool" });

    fireEvent.click(screen.getByRole("link", { name: "ctaDeck" }));
    expect(track).toHaveBeenCalledWith("card_cta_clicked", { target: "kofi", slug: "the-fool" });
  });
});
