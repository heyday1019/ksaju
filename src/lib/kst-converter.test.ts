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
