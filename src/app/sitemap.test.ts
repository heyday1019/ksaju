import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("EN 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/");
    expect(urls).toContain("https://ksaju.me/inyeon");
  });

  it("JA 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/ja/");
    expect(urls).toContain("https://ksaju.me/ja/inyeon");
  });

  it("KO 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/ko/");
    expect(urls).toContain("https://ksaju.me/ko/inyeon");
  });

  it("ZH-TW 코어 라우트 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/zh-TW/");
    expect(urls).toContain("https://ksaju.me/zh-TW/inyeon");
  });

  it("Trust 페이지 EN만 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/about");
    expect(urls).toContain("https://ksaju.me/faq");
    expect(urls).toContain("https://ksaju.me/privacy");
    expect(urls).toContain("https://ksaju.me/terms");
    // locale prefix trust 페이지는 Phase 3
    expect(urls.filter((u) => u.includes("/ja/about"))).toHaveLength(0);
  });

  it("총 12개 URL (4 locale × 2 코어 + 4 trust EN)", () => {
    expect(sitemap()).toHaveLength(12);
  });
});
