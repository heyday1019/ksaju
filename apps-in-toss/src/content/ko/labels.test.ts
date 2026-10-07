import { describe, expect, it } from "vitest";
import { wuxingSummaryKo } from "./labels";
import type { WuXing } from "../../lib/saju-types";

/** 읽기 쉬운 테스트를 위한 헬퍼 — 적지 않은 오행은 0으로 채운다. */
function balance(partial: Partial<Record<WuXing, number>>) {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0, ...partial };
}

describe("wuxingSummaryKo", () => {
  it("고르게 퍼져 있으면 균형형이라고 말한다", () => {
    const s = wuxingSummaryKo(balance({ wood: 2, fire: 2, earth: 2, metal: 1, water: 1 }));
    expect(s).toContain("고르게");
    expect(s).not.toContain("비어");
  });

  it("한 오행이 두터우면 그 오행과 성향을 함께 말한다", () => {
    const s = wuxingSummaryKo(balance({ wood: 4, fire: 1, earth: 1, metal: 1, water: 1 }));
    expect(s).toContain("목");
    expect(s).toContain("뻗어나가는 힘");
  });

  it("빈 오행이 있으면 챙길 것으로 짚어준다", () => {
    const s = wuxingSummaryKo(balance({ wood: 4, fire: 0, earth: 2, metal: 1, water: 1 }));
    expect(s).toContain("비어 있어요");
    expect(s).toContain("드러내는 힘"); // fire 의 성향
  });

  // 조사가 틀리면 바로 어색해진다. 목(ㄱ)·금(ㅁ)은 '이', 화·토·수는 '가'.
  it("종성에 따라 조사를 맞춘다", () => {
    expect(wuxingSummaryKo(balance({ wood: 4, earth: 2, metal: 1, water: 1 }))).toContain("목이");
    expect(wuxingSummaryKo(balance({ fire: 4, earth: 2, metal: 1, water: 1 }))).toContain("화가");
    expect(wuxingSummaryKo(balance({ metal: 4, earth: 2, fire: 1, water: 1 }))).toContain("금이");
    expect(wuxingSummaryKo(balance({ water: 4, earth: 2, fire: 1, metal: 1 }))).toContain("수가");
  });

  it("두터운 오행이 여럿이면 가운뎃점으로 묶고 마지막 글자로 조사를 정한다", () => {
    const s = wuxingSummaryKo(balance({ wood: 3, metal: 3, earth: 1, fire: 1 }));
    expect(s).toContain("목·금이");
  });

  // 10대도 보는 콘텐츠다. 단정하거나 겁주는 표현을 쓰지 않는다.
  it("단정·부정 표현을 쓰지 않는다", () => {
    const cases = [
      balance({ wood: 8 }),
      balance({ wood: 4, fire: 0, earth: 2, metal: 1, water: 1 }),
      balance({ wood: 2, fire: 2, earth: 2, metal: 1, water: 1 }),
    ];
    for (const b of cases) {
      const s = wuxingSummaryKo(b);
      expect(s).not.toMatch(/반드시|틀림없|위험|나쁘|불행|조심하세요/);
      expect(s.length).toBeLessThan(120);
    }
  });

  it("시주가 없어 6글자여도 동작한다", () => {
    expect(() => wuxingSummaryKo(balance({ wood: 3, fire: 2, earth: 1 }))).not.toThrow();
  });
});
