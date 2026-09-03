import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { publishedSlugs } from "@/lib/card-guides";

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

  it("Trust 페이지 4 locale 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/about");
    expect(urls).toContain("https://ksaju.me/faq");
    expect(urls).toContain("https://ksaju.me/privacy");
    expect(urls).toContain("https://ksaju.me/terms");
    expect(urls).toContain("https://ksaju.me/ko/about");
    expect(urls).toContain("https://ksaju.me/ja/faq");
    expect(urls).toContain("https://ksaju.me/zh-TW/privacy");
  });

  it("타로 라우트 4 locale 포함 (사이트맵에서 누락돼 있던 버그)", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/tarot");
    expect(urls).toContain("https://ksaju.me/ko/tarot");
    expect(urls).toContain("https://ksaju.me/ja/tarot");
    expect(urls).toContain("https://ksaju.me/zh-TW/tarot");
  });

  it("카드 허브 4 locale 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/cards");
    expect(urls).toContain("https://ksaju.me/ko/cards");
  });

  it("발행된 카드만 4 locale로 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/cards/the-fool");
    expect(urls).toContain("https://ksaju.me/zh-TW/cards/the-fool");
    // 미발행 카드는 절대 나오면 안 된다 — 크롤러에게 404를 먹이는 셈이 된다.
    for (const url of urls) {
      const match = url.match(/\/cards\/([a-z0-9-]+)$/);
      if (match) expect(publishedSlugs()).toContain(match[1]);
    }
  });

  it("총 URL = 4 locale × (4 코어 + 4 trust) + 발행 카드 × 4", () => {
    expect(sitemap()).toHaveLength(32 + publishedSlugs().length * 4);
  });
});
