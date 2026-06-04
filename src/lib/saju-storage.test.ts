// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { saveUserSaju, loadUserSaju } from "./saju-storage";
import type { UserSaju } from "./saju-types";

const RM: UserSaju = {
  pillars: { year: "壬申", month: "己酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

describe("saju-storage", () => {
  beforeEach(() => localStorage.clear());

  it("save → load 왕복 일치", () => {
    saveUserSaju(RM);
    expect(loadUserSaju()).toEqual(RM);
  });

  it("저장값 없으면 null", () => {
    expect(loadUserSaju()).toBeNull();
  });

  it("손상된 JSON이면 null", () => {
    localStorage.setItem("ksaju:userSaju:v1", "{not valid");
    expect(loadUserSaju()).toBeNull();
  });
});
