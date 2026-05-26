// ============================================================
// KSaju 아이돌 DB 연동 (src/lib/idols.ts)
//
// data/ksaju-idol-db.json (사주 사전 계산됨) 을 로드하고,
// compatibility.ts 엔진에 연결하는 데이터 레이어.
//   검색/선택 UX(컴포넌트)는 별도 사이클.
// ============================================================

import rawIdols from "../../data/ksaju-idol-db.json";
import {
  calcCompatibility,
  normalizeIdolSaju,
  type SajuPillars,
  type CompatibilityResult,
} from "./compatibility";

/** 사주 한 기둥 (한글 + 한자) */
export interface IdolPillar {
  kr: string; // 예 "임신"
  hanja: string; // 예 "壬申"
}

export interface IdolSaju {
  year: IdolPillar;
  month: IdolPillar;
  day: IdolPillar; // day.hanja[0] = 일간(Day Master)
  dayMaster: string; // 일간 한자 (day.hanja[0]와 동일, 표시 편의용)
}

/** ksaju-idol-db.json 엔트리 */
export interface Idol {
  id: string;
  name: string;
  group: string;
  birthdate: string; // ISO "YYYY-MM-DD"
  saju: IdolSaju;
}

/** 전체 아이돌 목록 (DB 순서 보존) */
export const idols: Idol[] = rawIdols as Idol[];

/** 중복 없는 그룹 목록 (등장 순서 보존) */
export const groups: string[] = [...new Set(idols.map((i) => i.group))];

/** id로 아이돌 조회 */
export function getIdolById(id: string): Idol | undefined {
  return idols.find((i) => i.id === id);
}

/** 특정 그룹의 멤버만 반환 */
export function getIdolsByGroup(group: string): Idol[] {
  return idols.filter((i) => i.group === group);
}

/**
 * 이름 또는 그룹명으로 검색 (대소문자 무시, 부분 일치).
 * 빈/공백 쿼리는 전체 목록을 반환한다.
 */
export function searchIdols(query: string): Idol[] {
  const q = query.trim().toLowerCase();
  if (q === "") return idols;
  return idols.filter(
    (i) =>
      i.name.toLowerCase().includes(q) || i.group.toLowerCase().includes(q),
  );
}

/**
 * 사용자 사주 vs 아이돌 궁합 계산.
 * 아이돌 DB 객체를 SajuPillars로 정규화한 뒤 엔진에 넘기는 래퍼.
 */
export function compatForIdol(
  me: SajuPillars,
  idol: Idol,
): CompatibilityResult {
  return calcCompatibility(me, normalizeIdolSaju(idol.saju));
}
