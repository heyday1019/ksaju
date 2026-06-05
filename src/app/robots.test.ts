import { describe, it, expect } from "vitest";
import robots from "./robots";

describe("robots", () => {
  it("allows all crawlers and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe("https://ksaju.me/sitemap.xml");
  });
});
