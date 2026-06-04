// 사용자 사주(UserSaju)를 localStorage에 영속. 홈(/)↔인연(/inyeon) 간 공유.
// client-safe (manseryeok 미import). SSR 안전(window 가드).
import type { UserSaju } from "./saju-types";

const KEY = "ksaju:userSaju:v1";

export function saveUserSaju(saju: UserSaju): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(saju));
  } catch {
    // localStorage 비활성/용량초과 등 — 조용히 무시(공유는 best-effort)
  }
}

export function loadUserSaju(): UserSaju | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSaju;
  } catch {
    return null;
  }
}
