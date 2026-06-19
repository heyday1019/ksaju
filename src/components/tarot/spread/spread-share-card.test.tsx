// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/share/share-card-footer", () => ({ ShareCardFooter: () => <div data-testid="footer" /> }));

import { SpreadShareCard } from "./spread-share-card";
import { getCardById } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

const saju: UserSaju = { pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null }, dayMaster: "辛", isTimeCorrected: false };
const cards = [getCardById(0)!, getCardById(1)!, getCardById(2)!] as [ReturnType<typeof getCardById> & object, never, never];

describe("SpreadShareCard", () => {
  it("renders 3 card faces and the synthesis", () => {
    const { container, getByText } = render(
      <SpreadShareCard saju={saju} cards={cards as never} synthesis="A bright arc ahead." locale="en" />,
    );
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(getByText(/A bright arc ahead\./)).toBeTruthy();
  });
});
