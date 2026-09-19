import { beforeEach, expect, test } from "vitest";
import {
  loadProfiles,
  upsertProfile,
  removeProfile,
  getActiveProfile,
  setActiveProfile,
  LEGACY_KEY,
} from "./profiles";
import type { UserSaju } from "../lib/saju-types";

const saju: UserSaju = {
  pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛",
  isTimeCorrected: false,
};

beforeEach(() => localStorage.clear());

test("프로필을 추가하면 목록에 쌓이고 방금 넣은 사람이 활성이 된다", () => {
  const me = upsertProfile({ name: "나", saju });
  expect(loadProfiles()).toHaveLength(1);
  expect(getActiveProfile()?.id).toBe(me.id);

  const friend = upsertProfile({ name: "민지", saju });
  expect(loadProfiles()).toHaveLength(2);
  expect(getActiveProfile()?.id).toBe(friend.id);
});

test("활성 프로필을 바꿀 수 있다", () => {
  const me = upsertProfile({ name: "나", saju });
  upsertProfile({ name: "민지", saju });
  setActiveProfile(me.id);
  expect(getActiveProfile()?.name).toBe("나");
});

test("프로필을 지우면 남은 사람이 활성이 된다", () => {
  const me = upsertProfile({ name: "나", saju });
  const friend = upsertProfile({ name: "민지", saju });
  removeProfile(friend.id);
  expect(loadProfiles()).toHaveLength(1);
  expect(getActiveProfile()?.id).toBe(me.id);
});

test("마지막 프로필을 지우면 활성 프로필이 없다", () => {
  const me = upsertProfile({ name: "나", saju });
  removeProfile(me.id);
  expect(loadProfiles()).toEqual([]);
  expect(getActiveProfile()).toBeNull();
});

test("예전 단일 저장(ksaju.toss.userSaju.v1)은 '나' 프로필로 옮겨온다", () => {
  localStorage.setItem(LEGACY_KEY, JSON.stringify(saju));
  const list = loadProfiles();
  expect(list).toHaveLength(1);
  expect(list[0].name).toBe("나");
  expect(list[0].saju.dayMaster).toBe("辛");
  // 한 번 옮겼으면 예전 키는 지워 중복 생성되지 않는다
  expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  expect(loadProfiles()).toHaveLength(1);
});
