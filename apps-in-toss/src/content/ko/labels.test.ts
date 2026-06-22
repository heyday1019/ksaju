import { describe, test, expect } from "vitest";
import { compatLabelKo, dayMasterKeywordKo } from "./labels";

describe("compatLabelKo", () => {
  test("화×수 조합은 뜨겁고 차가운 케미 레이블", () => {
    // 丙(화) × 壬(수)
    expect(compatLabelKo("丙", "壬")).toBe("뜨겁고 차가운 케미 🔥💧");
  });

  test("정의된 오행쌍(목×목)은 해당 레이블을 반환한다", () => {
    // 甲(목) × 甲(목) 은 정의돼 있으므로, 정의된 레이블 반환 확인
    expect(compatLabelKo("甲", "甲")).toBe("나란히 자라는 사이 🌳🌳");
  });

  test("매핑되지 않는 입력은 기본 레이블로 폴백한다", () => {
    // 龍과 虎는 천간/지지가 아니므로 elementOf가 undefined 반환 → 폴백
    expect(compatLabelKo("龍", "虎")).toBe("세상에 하나뿐인 인연 ✨");
  });
});

describe("dayMasterKeywordKo", () => {
  test("일간 辛 → 음금 키워드(한국어)", () => {
    expect(dayMasterKeywordKo("辛")).toBe("음금(陰金) — 세공된 보석처럼 섬세하고 우아한 사람");
  });
});
