import { describe, it, expect } from "vitest";
import { calcUserSaju } from "./saju";

describe("calcUserSaju (server action)", () => {
  it("유효한 입력 → UserSaju 반환", async () => {
    const s = await calcUserSaju({
      year: 1992,
      month: 9,
      day: 12,
      timezone: "Asia/Seoul",
    });
    expect(s.pillars.day).toBe("辛卯");
    expect(s.dayMaster).toBe("辛");
  });

  it("잘못된 입력(월 13)은 서버에서 검증 거부한다", async () => {
    await expect(
      calcUserSaju({
        year: 1992,
        month: 13,
        day: 12,
        timezone: "Asia/Seoul",
      }),
    ).rejects.toThrow();
  });
});
