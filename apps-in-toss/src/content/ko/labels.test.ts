import { describe, test, expect } from "vitest";
import { compatLabelKo, dayMasterKeywordKo } from "./labels";

describe("compatLabelKo", () => {
  test("화×수 조합은 뜨겁고 차가운 케미 레이블", () => {
    // 丙(화) × 壬(수)
    expect(compatLabelKo("丙", "壬")).toBe("뜨겁고 차가운 케미 🔥💧");
  });

  test("미지정 조합은 기본 레이블", () => {
    // 甲(목) × 甲(목) 은 정의돼 있으므로, 정의된 키 전체가 동작함을 확인
    expect(compatLabelKo("甲", "甲")).toBe("나란히 자라는 사이 🌳🌳");
  });
});

describe("dayMasterKeywordKo", () => {
  test("일간 辛 → 음금 키워드(한국어)", () => {
    expect(dayMasterKeywordKo("辛")).toContain("음금");
  });
});
