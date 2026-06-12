// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}));

describe("SiteFooter", () => {
  it("links to all four trust pages with correct hrefs", () => {
    render(<SiteFooter />);
    const expected: Array<[RegExp, string]> = [
      [/about/i, "/about"],
      [/faq/i, "/faq"],
      [/privacy/i, "/privacy"],
      [/terms/i, "/terms"],
    ];
    for (const [name, href] of expected) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
    }
  });
});
