// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Supabase mock ────────────────────────────────────────────────────────────
const selectMock   = vi.fn();
const eqMock       = vi.fn();
const maybeSingleMock = vi.fn();
const upsertMock   = vi.fn();
const updateMock   = vi.fn();

// select chain: .from("anon_users").select("*").eq(...).maybeSingle()
eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
selectMock.mockReturnValue({ eq: eqMock });
// upsert chain: .from("anon_users").upsert(...)
upsertMock.mockResolvedValue({ error: null });
// update chain: .from("anon_users").update(...).eq(...)
const updateEqMock = vi.fn().mockResolvedValue({ error: null });
updateMock.mockReturnValue({ eq: updateEqMock });

const fromMock = vi.fn((table: string) => {
  if (table === "anon_users") {
    return { select: selectMock, upsert: upsertMock, update: updateMock };
  }
  return {};
});
const sbClientMock = { from: fromMock };
const getSupabaseClientMock = vi.fn(() => sbClientMock as unknown);
vi.mock("./supabase-client", () => ({
  getSupabaseClient: () => getSupabaseClientMock(),
}));
// ────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  getSupabaseClientMock.mockReturnValue(sbClientMock);
  eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
  selectMock.mockReturnValue({ eq: eqMock });
  upsertMock.mockResolvedValue({ error: null });
  updateMock.mockReturnValue({ eq: updateEqMock });
  fromMock.mockImplementation((table: string) => {
    if (table === "anon_users") {
      return { select: selectMock, upsert: upsertMock, update: updateMock };
    }
    return {};
  });
});

import type { BirthData } from "./kst-types";

const BIRTH: BirthData = {
  year: 1994, month: 9, day: 12,
  hour: 14, minute: 30,
  timezone: "Asia/Seoul",
};

describe("getOrCreateUID", () => {
  it("localStorage 비어 있으면 새 UUID 저장 후 반환", async () => {
    const { getOrCreateUID } = await import("./user-identity");
    const uid = getOrCreateUID();
    expect(uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem("ksaju_uid")).toBe(uid);
  });

  it("기존 UID가 있으면 재사용", async () => {
    localStorage.setItem("ksaju_uid", "existing-uid-abc");
    const { getOrCreateUID } = await import("./user-identity");
    expect(getOrCreateUID()).toBe("existing-uid-abc");
  });
});

describe("saveBirthData / loadBirthData", () => {
  it("저장 → 로드 왕복 일치", async () => {
    const { saveBirthData, loadBirthData } = await import("./user-identity");
    saveBirthData(BIRTH);
    expect(loadBirthData()).toEqual(BIRTH);
  });

  it("저장값 없으면 null", async () => {
    const { loadBirthData } = await import("./user-identity");
    expect(loadBirthData()).toBeNull();
  });

  it("손상된 JSON이면 null", async () => {
    localStorage.setItem("ksaju:birthData:v1", "{bad");
    const { loadBirthData } = await import("./user-identity");
    expect(loadBirthData()).toBeNull();
  });
});

describe("getUserProfile", () => {
  it("Supabase 결과가 있으면 프로필 반환", async () => {
    const profile = {
      uid: "test-uid",
      birthdate: "1994-09-12",
      birth_time: "14:30",
      timezone: "Asia/Seoul",
      day_master: "甲",
      email: null,
    };
    maybeSingleMock.mockResolvedValueOnce({ data: profile, error: null });
    const { getUserProfile } = await import("./user-identity");
    const result = await getUserProfile("test-uid");
    expect(result).toEqual(profile);
    expect(fromMock).toHaveBeenCalledWith("anon_users");
    expect(eqMock).toHaveBeenCalledWith("uid", "test-uid");
  });

  it("Supabase 결과 없으면 null", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const { getUserProfile } = await import("./user-identity");
    expect(await getUserProfile("nonexistent")).toBeNull();
  });

  it("Supabase 클라이언트 없으면 null 반환", async () => {
    getSupabaseClientMock.mockReturnValueOnce(null);
    const { getUserProfile } = await import("./user-identity");
    expect(await getUserProfile("uid")).toBeNull();
  });
});

describe("saveUserProfile", () => {
  it("Supabase upsert 호출 — birthdate/birth_time/timezone/day_master 포함", async () => {
    const { saveUserProfile } = await import("./user-identity");
    await saveUserProfile("my-uid", BIRTH, "甲");
    expect(fromMock).toHaveBeenCalledWith("anon_users");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: "my-uid",
        birthdate: "1994-09-12",
        birth_time: "14:30",
        timezone: "Asia/Seoul",
        day_master: "甲",
      }),
      { onConflict: "uid" },
    );
  });

  it("시각 없는 생일은 birth_time null로 저장", async () => {
    const { saveUserProfile } = await import("./user-identity");
    const noTime: BirthData = { year: 1994, month: 9, day: 12, timezone: "Asia/Seoul" };
    await saveUserProfile("my-uid", noTime, "甲");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ birth_time: null }),
      expect.anything(),
    );
  });

  it("Supabase 클라이언트 없어도 throws 하지 않음", async () => {
    getSupabaseClientMock.mockReturnValueOnce(null);
    const { saveUserProfile } = await import("./user-identity");
    await expect(saveUserProfile("uid", BIRTH, "甲")).resolves.toBeUndefined();
  });
});

describe("saveEmail", () => {
  it("Supabase update email 호출", async () => {
    const { saveEmail } = await import("./user-identity");
    await saveEmail("my-uid", "test@example.com");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com" }),
    );
    expect(updateEqMock).toHaveBeenCalledWith("uid", "my-uid");
  });

  it("Supabase 클라이언트 없어도 throws 하지 않음", async () => {
    getSupabaseClientMock.mockReturnValueOnce(null);
    const { saveEmail } = await import("./user-identity");
    await expect(saveEmail("uid", "a@b.com")).resolves.toBeUndefined();
  });
});
