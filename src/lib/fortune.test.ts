import { describe, it, expect } from "vitest";
import { calcFortune } from "./fortune";
import type { UserSaju, CurrentLuck } from "./saju-types";

// RM: 壬申/己酉/辛卯, 일간 辛(metal). 오행: water1, metal3, earth1, wood1, fire0
const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};
const LUCK_2026: CurrentLuck = { yearPillar: "丙午", monthPillar: "癸巳" };

describe("calcFortune", () => {
  it("4개 카드를 money/love/career/time 순서로 반환", () => {
    const cards = calcFortune(RM, LUCK_2026);
    expect(cards.map((c) => c.key)).toEqual(["money", "love", "career", "time"]);
  });

  it("Money: 재성=일간이 극하는 오행. 辛(metal)→재성 wood, count 1 → Steady", () => {
    const money = calcFortune(RM, LUCK_2026)[0];
    expect(money.element).toBe("wood");
    expect(money.tierLabel).toBe("Steady"); // count 1 → some
  });

  it("Career: 관성=일간을 극하는 오행. 辛(metal)→관성 fire, count 0 → Free Agent", () => {
    const career = calcFortune(RM, LUCK_2026)[2];
    expect(career.element).toBe("fire");
    expect(career.tierLabel).toBe("Free Agent"); // count 0 → none
  });

  it("Love: 일간 천간 테이블. 辛 → Refined, element=metal", () => {
    const love = calcFortune(RM, LUCK_2026)[1];
    expect(love.element).toBe("metal");
    expect(love.tierLabel).toBe("Refined");
  });

  it("This Year: 辛 일간 + 丙午年 → 천간합(丙辛) → Magnetic", () => {
    const time = calcFortune(RM, LUCK_2026)[3];
    expect(time.tierLabel).toBe("Magnetic");
    expect(time.element).toBe("fire"); // 연간 丙 = fire
    expect(time.subLine).toBeTruthy();
  });

  it("Money 강함: 재성 오행 3개 → Magnet", () => {
    // 일간 甲(wood) → 재성 earth. earth 3개 이상 구성
    const earthy: UserSaju = {
      pillars: { year: "戊辰", month: "己丑", day: "甲戌", hour: null },
      dayMaster: "甲",
      isTimeCorrected: false,
    };
    // 戊(earth)辰(earth) 己(earth)丑(earth) 甲(wood)戌(earth) → earth 5
    const money = calcFortune(earthy, LUCK_2026)[0];
    expect(money.element).toBe("earth");
    expect(money.tierLabel).toBe("Magnet"); // count>=3
  });

  it("This Year 비합 관계: 甲(wood) 일간 + 丙(fire)年 → 일간이 생(상생) → Giving", () => {
    const woody: UserSaju = {
      pillars: { year: "甲子", month: "甲子", day: "甲子", hour: null },
      dayMaster: "甲",
      isTimeCorrected: false,
    };
    const time = calcFortune(woody, LUCK_2026)[3];
    expect(time.tierLabel).toBe("Giving"); // wood→fire 생
  });

  it("결정적: 동일 입력 → 동일 출력", () => {
    expect(calcFortune(RM, LUCK_2026)).toEqual(calcFortune(RM, LUCK_2026));
  });

  it("Love 테이블은 10천간 전부 정의", () => {
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    for (const s of stems) {
      const saju: UserSaju = {
        pillars: { year: "甲子", month: "甲子", day: s + "子", hour: null },
        dayMaster: s,
        isTimeCorrected: false,
      };
      const love = calcFortune(saju, LUCK_2026)[1];
      expect(love.line.length).toBeGreaterThan(0);
      expect(love.tierLabel.length).toBeGreaterThan(0);
    }
  });
});
