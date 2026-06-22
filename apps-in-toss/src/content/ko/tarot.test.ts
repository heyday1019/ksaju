import { describe, it, expect } from "vitest";
import { dailyReadingKo, spreadReadingKo } from "./tarot";
import type { TarotCard } from "../../lib/tarot";

const card = (id: number, name_kr: string, suit: TarotCard["suit"]): TarotCard => ({
  id,
  suit,
  rank: "0",
  name_en: "x",
  name_kr,
  filename: "x.png",
  element: null,
  theme: "ENGLISH THEME",
  keywords: "x",
});

describe("한국어 타로 리딩", () => {
  it("오늘의 리딩은 한국어 카드명과 오행을 포함하고 영어 theme를 쓰지 않는다", () => {
    const out = dailyReadingKo(card(1, "광대", "major"), "fire");
    expect(out).toContain("광대");
    expect(out).toContain("화");
    expect(out).not.toContain("ENGLISH THEME");
  });

  it("스프레드는 과거/현재/미래/합 4문장이 모두 한국어", () => {
    const out = spreadReadingKo(
      [
        card(1, "광대", "major"),
        card(2, "마법사", "wands"),
        card(3, "여사제", "cups"),
      ],
      "water",
    );
    expect(out.past).toContain("광대");
    expect(out.present).toContain("마법사");
    expect(out.future).toContain("여사제");
    expect(out.synthesis).toContain("수");
  });
});
