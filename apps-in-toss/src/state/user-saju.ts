import type { UserSaju } from "../lib/saju-types";

const KEY = "ksaju.toss.userSaju.v1";

export function saveUserSaju(s: UserSaju): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 저장 실패는 무시 (프라이빗 모드 등)
  }
}

export function loadUserSaju(): UserSaju | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as UserSaju) : null;
  } catch {
    return null;
  }
}
