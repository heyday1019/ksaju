import { render, screen } from "@testing-library/react";
import { FortuneCards } from "./FortuneCards";
import type { FortuneCard } from "../lib/fortune";

const cards: FortuneCard[] = [
  {
    key: "money",
    emoji: "💰",
    element: "metal",
    tierLabel: "돈복 좋음",
    line: "올해는 돈이 들어와요",
  },
  {
    key: "love",
    emoji: "💘",
    element: "fire",
    tierLabel: "열정형",
    line: "사랑운 상승",
  },
];

test("운세 카드 라인과 티어 라벨이 보인다", () => {
  render(<FortuneCards cards={cards} />);
  expect(screen.getByText("올해는 돈이 들어와요")).toBeInTheDocument();
  expect(screen.getByText("돈복 좋음")).toBeInTheDocument();
  expect(screen.getByText(/금전운/)).toBeInTheDocument();
});
