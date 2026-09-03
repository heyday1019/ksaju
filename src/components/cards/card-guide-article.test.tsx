// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardGuideArticle } from "./card-guide-article";
import { TAROT_CARDS } from "@/lib/tarot";
import type { CardGuide } from "@/lib/card-guides";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const guide: CardGuide = {
  title: "The Fool",
  summary: "summary text",
  meaning: ["first paragraph", "second paragraph"],
  symbols: [
    { label: "The mask", text: "mask text" },
    { label: "The bundle", text: "bundle text" },
    { label: "The edge", text: "edge text" },
  ],
  upright: "upright text",
  reversed: "reversed text",
  love: "love text",
  work: "work text",
  sajuLens: "saju lens text",
};

const fool = TAROT_CARDS.find((c) => c.name_en === "The Fool")!;

describe("CardGuideArticle", () => {
  it("renders every section of the guide", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    for (const text of [
      "first paragraph", "second paragraph",
      "mask text", "bundle text", "edge text",
      "upright text", "reversed text",
      "love text", "work text", "saju lens text",
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("renders the saju lens section — the differentiator, never optional", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    expect(screen.getByText("sajuHeading")).toBeInTheDocument();
    expect(screen.getByText("saju lens text")).toBeInTheDocument();
  });

  it("shows the card art with a descriptive alt", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/tarot/major-00-fool.png");
    expect(img).toHaveAttribute("alt", expect.stringContaining("The Fool"));
  });

  it("renders the title as the page h1", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Fool");
  });
});
