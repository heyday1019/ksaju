import type { UserSaju } from "../lib/saju-types";

/** 사주를 본 사람 한 명. 나·친구·연인을 모두 같은 모양으로 담는다. */
export type Profile = {
  id: string;
  name: string;
  saju: UserSaju;
};

const KEY = "ksaju.toss.profiles.v1";
const ACTIVE_KEY = "ksaju.toss.activeProfile.v1";
/** 프로필이 하나뿐이던 시절의 저장 키. 첫 로드에서 '나' 프로필로 옮기고 지운다. */
export const LEGACY_KEY = "ksaju.toss.userSaju.v1";

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시 (프라이빗 모드 등) — 화면은 메모리 상태로 계속 동작한다
  }
}

function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 예전 단일 저장본을 '나' 프로필로 승격. 멱등(한 번 옮기면 예전 키를 지운다). */
function migrateLegacy(): Profile[] | null {
  const legacy = read<UserSaju>(LEGACY_KEY);
  if (!legacy?.dayMaster) return null;
  const list: Profile[] = [{ id: newId(), name: "나", saju: legacy }];
  write(KEY, list);
  write(ACTIVE_KEY, list[0].id);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* 지우기 실패해도 목록이 이미 있으므로 다음 로드에서 중복되지 않는다 */
  }
  return list;
}

export function loadProfiles(): Profile[] {
  const stored = read<Profile[]>(KEY);
  if (stored && Array.isArray(stored)) return stored;
  return migrateLegacy() ?? [];
}

/** 새 사람을 넣거나(id 없음) 기존 사람을 고친다. 어느 쪽이든 그 사람이 활성이 된다. */
export function upsertProfile(input: {
  id?: string;
  name: string;
  saju: UserSaju;
}): Profile {
  const list = loadProfiles();
  const profile: Profile = {
    id: input.id ?? newId(),
    name: input.name.trim() || "이름 없음",
    saju: input.saju,
  };
  const at = list.findIndex((p) => p.id === profile.id);
  if (at >= 0) list[at] = profile;
  else list.push(profile);
  write(KEY, list);
  write(ACTIVE_KEY, profile.id);
  return profile;
}

export function removeProfile(id: string): Profile[] {
  const list = loadProfiles().filter((p) => p.id !== id);
  write(KEY, list);
  if (read<string>(ACTIVE_KEY) === id) {
    write(ACTIVE_KEY, list[0]?.id ?? null);
  }
  return list;
}

export function getActiveProfile(): Profile | null {
  const list = loadProfiles();
  if (list.length === 0) return null;
  const id = read<string>(ACTIVE_KEY);
  return list.find((p) => p.id === id) ?? list[0];
}

export function setActiveProfile(id: string): void {
  write(ACTIVE_KEY, id);
}
