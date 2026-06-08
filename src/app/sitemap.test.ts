import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists all six public routes with the ksaju.me base", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.url)).toEqual([
      "https://ksaju.me/",
      "https://ksaju.me/inyeon",
      "https://ksaju.me/about",
      "https://ksaju.me/faq",
      "https://ksaju.me/privacy",
      "https://ksaju.me/terms",
    ]);
    for (const e of entries) {
      expect(e.lastModified).toBeInstanceOf(Date);
    }
  });
});
