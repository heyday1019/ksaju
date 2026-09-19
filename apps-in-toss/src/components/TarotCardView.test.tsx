import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { TarotCardView } from "./TarotCardView";
import type { TarotCard } from "../lib/tarot";

const fool: TarotCard = {
  id: 0,
  suit: "major",
  rank: "0",
  name_en: "The Fool",
  name_kr: "광대",
  filename: "major-00-fool.png",
  element: null,
  theme: "a free spirit, unbound",
  keywords: "pure heart; new beginnings",
} as TarotCard;

test("데이터의 filename 으로 덱 아트를 렌더한다 (이모지 플레이스홀더 아님)", () => {
  render(<TarotCardView card={fool} />);
  const img = screen.getByRole("img", { name: /광대/ });
  expect(img).toHaveAttribute("src", expect.stringContaining("major-00-fool"));
});

test("덱에 없는 카드여도 이름은 보여준다", () => {
  render(<TarotCardView card={{ ...fool, filename: "nope.png" }} />);
  expect(screen.getByText("광대")).toBeInTheDocument();
});
