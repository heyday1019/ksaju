import { loadUserSaju, saveUserSaju } from "./user-saju";
import type { UserSaju } from "../lib/saju-types";

const sample: UserSaju = {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

test("저장 후 로드 라운드트립", () => {
  saveUserSaju(sample);
  expect(loadUserSaju()?.dayMaster).toBe("辛");
  expect(loadUserSaju()?.pillars.day).toBe("辛卯");
});

test("저장된 값이 없으면 null", () => {
  localStorage.clear();
  expect(loadUserSaju()).toBeNull();
});
