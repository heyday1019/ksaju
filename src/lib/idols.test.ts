import { describe, it, expect } from "vitest";
import {
  idols,
  groups,
  getIdolById,
  getIdolsByGroup,
  searchIdols,
  compatForIdol,
  type Idol,
} from "./idols";
import { calcCompatibility, normalizeIdolSaju } from "./compatibility";
import { calculateSaju } from "@fullstackfamily/manseryeok";

// === 데이터 로드 / 무결성 ===
describe("idols 데이터 로드", () => {
  it("전체 아이돌을 로드한다", () => {
    expect(idols.length).toBe(124);
  });

  it("신규 그룹들이 groups에 포함된다", () => {
    for (const g of ["SEVENTEEN", "NCT", "ATEEZ", "ZEROBASEONE", "RIIZE", "EXO", "SHINee", "MAMAMOO", "GOT7", "NMIXX"]) {
      expect(groups).toContain(g);
    }
  });

  it("모든 엔트리가 필수 필드를 갖는다", () => {
    for (const i of idols) {
      expect(i.id).toBeTruthy();
      expect(i.name).toBeTruthy();
      expect(i.group).toBeTruthy();
      expect(i.birthdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(i.saju.year.hanja).toHaveLength(2);
      expect(i.saju.month.hanja).toHaveLength(2);
      expect(i.saju.day.hanja).toHaveLength(2);
    }
  });

  it("id가 모두 고유하다", () => {
    const ids = idols.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dayMaster는 일주(day) 한자의 첫 글자와 일치한다", () => {
    for (const i of idols) {
      expect(i.saju.dayMaster).toBe(i.saju.day.hanja[0]);
    }
  });

  it("모든 엔트리의 사주가 생일로 재계산한 결과와 일치한다", () => {
    for (const i of idols) {
      const [y, m, d] = i.birthdate.split("-").map(Number);
      const s = calculateSaju(y, m, d);
      expect(i.saju.year.hanja).toBe(s.yearPillarHanja);
      expect(i.saju.year.kr).toBe(s.yearPillar);
      expect(i.saju.month.hanja).toBe(s.monthPillarHanja);
      expect(i.saju.month.kr).toBe(s.monthPillar);
      expect(i.saju.day.hanja).toBe(s.dayPillarHanja);
      expect(i.saju.day.kr).toBe(s.dayPillar);
      expect(i.saju.dayMaster).toBe(s.dayPillarHanja[0]);
    }
  });
});

// === groups ===
describe("groups", () => {
  it("중복 없는 그룹 목록을 노출한다", () => {
    expect(new Set(groups).size).toBe(groups.length);
  });

  it("idols에 등장하는 모든 그룹을 포함한다", () => {
    const fromIdols = new Set(idols.map((i) => i.group));
    expect(new Set(groups)).toEqual(fromIdols);
  });
});

// === getIdolById ===
describe("getIdolById", () => {
  it("존재하는 id로 아이돌을 찾는다", () => {
    const rm = getIdolById("rm-bts");
    expect(rm?.name).toBe("RM");
    expect(rm?.group).toBe("BTS");
  });

  it("없는 id면 undefined", () => {
    expect(getIdolById("no-such-id")).toBeUndefined();
  });
});

// === getIdolsByGroup ===
describe("getIdolsByGroup", () => {
  it("그룹의 멤버만 반환한다", () => {
    const bts = getIdolsByGroup("BTS");
    expect(bts.length).toBeGreaterThan(0);
    expect(bts.every((i) => i.group === "BTS")).toBe(true);
  });

  it("없는 그룹이면 빈 배열", () => {
    expect(getIdolsByGroup("NO GROUP")).toEqual([]);
  });
});

// === searchIdols ===
describe("searchIdols", () => {
  it("이름으로 검색 (대소문자 무시)", () => {
    const r = searchIdols("rm");
    expect(r.some((i) => i.id === "rm-bts")).toBe(true);
  });

  it("그룹명으로 검색", () => {
    const r = searchIdols("blackpink");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.group.toLowerCase().includes("blackpink"))).toBe(
      true,
    );
  });

  it("부분 일치를 지원한다", () => {
    const full = searchIdols("New");
    expect(full.some((i) => i.group === "NewJeans")).toBe(true);
  });

  it("앞뒤 공백을 무시한다", () => {
    expect(searchIdols("  rm  ").some((i) => i.id === "rm-bts")).toBe(true);
  });

  it("빈 쿼리는 전체를 반환한다", () => {
    expect(searchIdols("").length).toBe(idols.length);
    expect(searchIdols("   ").length).toBe(idols.length);
  });

  it("매치 없으면 빈 배열", () => {
    expect(searchIdols("zzzzzzz")).toEqual([]);
  });
});

// === compatForIdol ===
describe("compatForIdol", () => {
  const me = { year: "壬申", month: "己酉", day: "辛卯" };

  it("normalizeIdolSaju + calcCompatibility 결과와 동일하다", () => {
    const idol = getIdolById("rm-bts") as Idol;
    const expected = calcCompatibility(me, normalizeIdolSaju(idol.saju));
    expect(compatForIdol(me, idol)).toEqual(expected);
  });

  it("점수는 0-100 범위", () => {
    for (const idol of idols) {
      const r = compatForIdol(me, idol);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });
});
