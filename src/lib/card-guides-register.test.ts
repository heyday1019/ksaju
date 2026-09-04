import { describe, expect, it } from "vitest";
import guides from "../../data/card-guides/ko.json";
import { findPlainForm, politen } from "../../scripts/fix-ko-register.mjs";

// 한국어 해설의 문체 기준은 손으로 쓴 the-fool = 존댓말(합쇼체).
// 나머지 56장을 `npm run draft:cards -- --lang ko` 로 붙일 때 초안이 해라체로
// 나오는 일이 있어서, 파일 자체를 불변으로 고정해 둔다. 깨지면 `npm run fix:ko`.
describe("ko 카드 해설 문체", () => {
  it("해라체 종결이 하나도 없다", () => {
    expect(findPlainForm(guides)).toEqual([]);
  });

  it("22장 전부 존댓말 문장을 갖는다", () => {
    const slugs = Object.keys(guides);
    expect(slugs).toHaveLength(22);
    for (const slug of slugs) {
      const entry = (guides as Record<string, { upright: string }>)[slug];
      expect(entry.upright, slug).toMatch(/(습니다|입니다|세요)/);
    }
  });
});

// 구현하며 실제로 밟은 함정들. 스크립트 self-check 와 같은 내용을 테스트에서도 고정한다.
describe("politen", () => {
  it.each([
    ["아니다", "아닙니다"], // -니다로 끝나지만 해라체
    ["카드다", "카드입니다"], // 명사 + 계사 축약 (동사로 보면 '카듭니다')
    ["것이다", "것입니다"],
    ["있다", "있습니다"],
    ["간다", "갑니다"],
    ["읽는다", "읽습니다"],
    ["중요하다", "중요합니다"],
    ["확인하라", "확인하세요"],
    ["있는가", "있나요"],
  ])("%s -> %s", (input, want) => {
    expect(politen(input)).toBe(want);
  });

  it.each([
    ["있습니다"], // 이미 존댓말 — 재변환하면 '있습닙니다'
    ["무언가"], // 명사이지 의문형이 아니다
    ["저승사자"],
  ])("%s 는 그대로 둔다", (input) => {
    expect(politen(input)).toBeNull();
  });
});
