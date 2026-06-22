import { describe, it, expect } from "vitest";
import { birthToSaju, toCompatPillars, dateToLuck } from "./saju";
import type { BirthData } from "./kst-types";

const seoul = (
  y: number,
  m: number,
  d: number,
  hour?: number,
  minute?: number,
): BirthData => ({
  year: y,
  month: m,
  day: d,
  hour,
  minute,
  timezone: "Asia/Seoul",
});

describe("birthToSaju", () => {
  it("RM(1992-09-12, 한국, 시간없음) → DB 사전계산값과 일치", () => {
    const s = birthToSaju(seoul(1992, 9, 12));
    expect(s.pillars.year).toBe("壬申");
    expect(s.pillars.month).toBe("己酉");
    expect(s.pillars.day).toBe("辛卯");
    expect(s.dayMaster).toBe("辛");
  });

  it("Jin(1992-12-04, 한국) → 일주 甲寅, 일간 甲", () => {
    const s = birthToSaju(seoul(1992, 12, 4));
    expect(s.pillars.day).toBe("甲寅");
    expect(s.dayMaster).toBe("甲");
  });

  it("dayMaster는 항상 일주 한자의 첫 글자다", () => {
    const s = birthToSaju(seoul(1992, 9, 12));
    expect(s.dayMaster).toBe(s.pillars.day[0]);
  });

  it("출생시각 미입력 → hour pillar는 null", () => {
    const s = birthToSaju(seoul(1992, 9, 12));
    expect(s.pillars.hour).toBeNull();
  });

  it("출생시각 입력 → hour pillar 채워지고 진태양시 보정 적용", () => {
    const s = birthToSaju(seoul(1992, 9, 12, 14, 30));
    expect(s.pillars.hour).not.toBeNull();
    expect(s.isTimeCorrected).toBe(true);
  });

  it("타임존 변환: 출생지 로컬이 아니라 KST 날짜로 사주를 계산한다", () => {
    // 호놀룰루(UTC-10) 1992-09-11 23:00 → KST 1992-09-12 18:00.
    // KST 날짜(09-12)의 일주 辛卯여야 함. 나이브 로컬(09-11)이면 庚寅.
    const s = birthToSaju({
      year: 1992,
      month: 9,
      day: 11,
      hour: 23,
      minute: 0,
      timezone: "Pacific/Honolulu",
    });
    expect(s.pillars.day).toBe("辛卯");
  });
});

describe("toCompatPillars", () => {
  it("UserSaju에서 궁합용 3기둥(year/month/day)만 추출한다", () => {
    const s = birthToSaju(seoul(1992, 9, 12, 14, 30));
    const p = toCompatPillars(s);
    expect(p).toEqual({
      year: s.pillars.year,
      month: s.pillars.month,
      day: s.pillars.day,
    });
    expect(p).not.toHaveProperty("hour");
  });
});

describe("dateToLuck", () => {
  it("2026-06-02(KST) → 세운 연주 = 丙午", () => {
    // 정오 UTC로 만들어도 Asia/Seoul 기준 같은 날짜
    const now = new Date("2026-06-02T03:00:00Z"); // = 2026-06-02 12:00 KST
    const luck = dateToLuck(now);
    expect(luck.yearPillar).toBe("丙午");
  });

  it("2026-06-02(KST) → 월운 월주 = 癸巳", () => {
    const now = new Date("2026-06-02T03:00:00Z");
    const luck = dateToLuck(now);
    expect(luck.monthPillar).toBe("癸巳");
  });
});
