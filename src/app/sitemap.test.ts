import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists / and /inyeon with the ksaju.me base", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.url)).toEqual([
      "https://ksaju.me/",
      "https://ksaju.me/inyeon",
    ]);
    for (const e of entries) {
      expect(e.lastModified).toBeInstanceOf(Date);
    }
  });
});
