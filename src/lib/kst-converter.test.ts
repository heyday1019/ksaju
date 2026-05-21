import { describe, it, expect, test } from "vitest";
import { getJiziHour } from "./kst-converter";

describe("getJiziHour", () => {
  test.each([
    [0, "Rat"],      // 자시
    [1, "Ox"],       // 축시
    [2, "Ox"],
    [3, "Tiger"],    // 인시
    [4, "Tiger"],
    [5, "Rabbit"],
    [11, "Horse"],   // 오시
    [12, "Horse"],
    [13, "Sheep"],
    [22, "Pig"],     // 해시
    [23, "Rat"],     // 자시 wraparound
  ])("hour %i → %s", (hour, animal) => {
    expect(getJiziHour(hour).animal).toBe(animal);
  });

  it("returns JiziHour with all fields populated", () => {
    const result = getJiziHour(4); // Tiger
    expect(result).toMatchObject({
      idx: 2,
      animal: "Tiger",
      animalKo: "호랑이",
      range: "03:00 – 05:00",
    });
    expect(result.name).toContain("寅");
  });
});

import { convertToKST } from "./kst-converter";

describe("convertToKST", () => {
  it("NY 1999-03-15 14:30 EST → Seoul 1999-03-16 04:30 (Tiger)", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.kst).toMatchObject({
      year: 1999, month: 3, day: 16, hour: 4, minute: 30,
    });
    expect(r.kst.dateLabelKo).toBe("1999년 3월 16일");
    expect(r.kst.weekdayEn).toBe("Tuesday");
    expect(r.jiziHour?.animal).toBe("Tiger");
  });

  it("Tokyo 2000-06-01 14:00 JST → Seoul 2000-06-01 14:00 (same offset, Sheep)", () => {
    const r = convertToKST({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
      timezone: "Asia/Tokyo",
    });
    expect(r.kst).toMatchObject({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
    });
    expect(r.jiziHour?.animal).toBe("Sheep");
  });

  it("DST: NY 2024-03-10 14:30 EDT → Seoul 2024-03-11 03:30", () => {
    const r = convertToKST({
      year: 2024, month: 3, day: 10, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.kst).toMatchObject({
      year: 2024, month: 3, day: 11, hour: 3, minute: 30,
    });
  });

  it("time 미입력 → jiziHour null, hour/minute null", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    });
    expect(r.kst.hour).toBeNull();
    expect(r.kst.minute).toBeNull();
    expect(r.kst.timeLabel).toBeNull();
    expect(r.jiziHour).toBeNull();
  });

  it("Seoul 자체 입력 → 변환 없이 동일", () => {
    const r = convertToKST({
      year: 1990, month: 5, day: 15, hour: 10, minute: 0,
      timezone: "Asia/Seoul",
    });
    expect(r.kst).toMatchObject({
      year: 1990, month: 5, day: 15, hour: 10, minute: 0,
    });
    expect(r.sourceLocal.timezone.city).toBe("Seoul");
  });

  it("sourceLocal.dateLabel 영문 포맷", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    });
    expect(r.sourceLocal.dateLabel).toBe("March 15, 1999");
  });
});
