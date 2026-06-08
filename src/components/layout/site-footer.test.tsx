// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

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
