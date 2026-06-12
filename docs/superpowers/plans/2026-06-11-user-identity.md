# User Identity (Anonymous Memory) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 재방문 시 생일 재입력 없이 바로 사주 결과로 진입할 수 있도록, 로그인 없이 디바이스 UUID + Supabase `anon_users` 로 사용자를 기억한다.

**Architecture:** localStorage의 `ksaju_uid` (UUID)로 디바이스를 식별. 생일 제출 시 `BirthData`를 localStorage(`ksaju:birthData:v1`)와 Supabase `anon_users` 양쪽에 저장. 재방문 시 localStorage에서 즉시 `UserSaju` + `BirthData`를 읽어 "Welcome back" 배너를 표시하고, 백그라운드에서 Supabase 프로필을 동기화한다. Supabase 저장은 fire-and-forget(실패해도 앱 동작에 영향 없음).

**Tech Stack:** Next.js App Router (client component), `@supabase/ssr` `createBrowserClient`, `crypto.randomUUID()`, vitest + happy-dom + RTL

---

## File Map

| 역할 | 파일 | 신규/수정 |
|------|------|----------|
| UID + 프로필 CRUD | `src/lib/user-identity.ts` | 신규 |
| 테스트 | `src/lib/user-identity.test.ts` | 신규 |
| "Welcome back" UI | `src/components/home/returning-user-banner.tsx` | 신규 |
| UI 테스트 | `src/components/home/returning-user-banner.test.tsx` | 신규 |
| DB 스키마 | `docs/supabase-migration.sql` | 수정 |
| 메인 페이지 | `src/app/page.tsx` | 수정 |

---

## Task 1: Supabase `anon_users` 테이블 + RLS

**Files:**
- Modify: `docs/supabase-migration.sql`

- [ ] **Step 1: migration SQL에 anon_users 테이블 추가**

`docs/supabase-migration.sql` 파일 끝에 추가:

```sql
-- Anonymous user identity table (cycle 26)
-- uid = crypto.randomUUID() generated on device; stored in localStorage ksaju_uid
-- Service role reads/writes bypass RLS. Anon key uses policies below.
create table if not exists anon_users (
  uid        text        primary key,
  birthdate  date        not null,
  birth_time time,
  timezone   text        not null default 'Asia/Seoul',
  day_master text,
  email      text,
  last_visit timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table anon_users enable row level security;

-- uid is a client-generated UUID (unguessable) — allow anon full CRUD on own row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon insert'
  ) then
    create policy "anon_users: anon insert"
      on anon_users for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon select'
  ) then
    create policy "anon_users: anon select"
      on anon_users for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename = 'anon_users' and policyname = 'anon_users: anon update'
  ) then
    create policy "anon_users: anon update"
      on anon_users for update to anon using (true) with check (true);
  end if;
end $$;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행 (사용자 수동)**

> ⚠️ 이 스텝은 자동화할 수 없습니다. Supabase 대시보드 → SQL Editor에서 `docs/supabase-migration.sql` 전체 내용 실행.

- [ ] **Step 3: 커밋**

```bash
git add docs/supabase-migration.sql
git commit -m "feat(db): add anon_users table with RLS for anonymous user identity"
```

---

## Task 2: `user-identity.ts` — UID + 프로필 CRUD

**Files:**
- Create: `src/lib/user-identity.ts`
- Create: `src/lib/user-identity.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/user-identity.test.ts`:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run src/lib/user-identity.test.ts
```

Expected: FAIL — "Cannot find module './user-identity'"

- [ ] **Step 3: `user-identity.ts` 구현**

`src/lib/user-identity.ts`:

```typescript
import { getSupabaseClient } from "./supabase-client";
import type { BirthData } from "./kst-types";

const UID_KEY = "ksaju_uid";
const BIRTH_KEY = "ksaju:birthData:v1";

export interface UserProfile {
  uid: string;
  birthdate: string;        // "YYYY-MM-DD"
  birth_time: string | null; // "HH:MM" or null
  timezone: string;
  day_master: string | null;
  email: string | null;
}

export function getOrCreateUID(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(UID_KEY);
    if (existing) return existing;
    const uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
    return uid;
  } catch {
    return crypto.randomUUID();
  }
}

export function saveBirthData(birth: BirthData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BIRTH_KEY, JSON.stringify(birth));
  } catch { /* best-effort */ }
}

export function loadBirthData(): BirthData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BIRTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BirthData;
  } catch {
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("anon_users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();
    if (error) { console.error("[user-identity] getUserProfile:", error.message); return null; }
    return data as UserProfile | null;
  } catch (e) {
    console.error("[user-identity] getUserProfile unexpected:", e);
    return null;
  }
}

// BirthData → "YYYY-MM-DD" / "HH:MM"
function toBirthdateStr(b: BirthData): string {
  return `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
}
function toBirthTimeStr(b: BirthData): string | null {
  if (b.hour === undefined) return null;
  return `${String(b.hour).padStart(2, "0")}:${String(b.minute ?? 0).padStart(2, "0")}`;
}

export async function saveUserProfile(
  uid: string,
  birth: BirthData,
  dayMaster: string,
): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from("anon_users").upsert(
      {
        uid,
        birthdate: toBirthdateStr(birth),
        birth_time: toBirthTimeStr(birth),
        timezone: birth.timezone,
        day_master: dayMaster,
        last_visit: new Date().toISOString(),
      },
      { onConflict: "uid" },
    );
    if (error) console.error("[user-identity] saveUserProfile:", error.message);
  } catch (e) {
    console.error("[user-identity] saveUserProfile unexpected:", e);
  }
}

export async function saveEmail(uid: string, email: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb
      .from("anon_users")
      .update({ email })
      .eq("uid", uid);
    if (error) console.error("[user-identity] saveEmail:", error.message);
  } catch (e) {
    console.error("[user-identity] saveEmail unexpected:", e);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run src/lib/user-identity.test.ts
```

Expected: all pass

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npx vitest run
```

Expected: 기존 192 + 새 테스트 모두 pass

- [ ] **Step 6: 커밋**

```bash
git add src/lib/user-identity.ts src/lib/user-identity.test.ts
git commit -m "feat(identity): add user-identity — UID/BirthData localStorage + Supabase anon_users CRUD"
```

---

## Task 3: `ReturningUserBanner` 컴포넌트

**Files:**
- Create: `src/components/home/returning-user-banner.tsx`
- Create: `src/components/home/returning-user-banner.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/home/returning-user-banner.test.tsx`:

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReturningUserBanner } from "./returning-user-banner";

const onContinue = vi.fn();
const onReset = vi.fn();

afterEach(() => { vi.clearAllMocks(); });

describe("ReturningUserBanner", () => {
  it("일간 한자와 'Welcome back' 텍스트를 렌더한다", () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText("甲")).toBeInTheDocument();
  });

  it("Continue 버튼 클릭 시 onContinue 호출", async () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("'Change birthday' 링크 클릭 시 onReset 호출", async () => {
    render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    await userEvent.click(screen.getByRole("button", { name: /change birthday/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("일간별로 서로 다른 오행 레이블을 보여준다", () => {
    const { rerender } = render(
      <ReturningUserBanner dayMaster="甲" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Wood/i)).toBeInTheDocument();

    rerender(
      <ReturningUserBanner dayMaster="壬" onContinue={onContinue} onReset={onReset} />
    );
    expect(screen.getByText(/Water/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx vitest run src/components/home/returning-user-banner.test.tsx
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: 컴포넌트 구현**

`src/components/home/returning-user-banner.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { dayMasterInfo, WUXING_META } from "@/lib/saju-display";

interface Props {
  dayMaster: string;
  onContinue: () => void;
  onReset: () => void;
}

export function ReturningUserBanner({ dayMaster, onContinue, onReset }: Props) {
  const dm = dayMasterInfo(dayMaster);
  const meta = WUXING_META[dm.element];

  return (
    <div className="space-y-5 text-center py-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
          Welcome back ✨
        </p>
        <p
          className="hanja text-6xl font-bold"
          style={{ color: meta.color ?? undefined }}
        >
          {dayMaster}
        </p>
        <p className="mt-1 text-base font-semibold text-muted-foreground">
          {meta.emoji} {meta.label} · {dm.keyword}
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={onContinue}>
        Continue as {dayMaster} day master →
      </Button>

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Not you? Change birthday
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run src/components/home/returning-user-banner.test.tsx
```

Expected: all pass

- [ ] **Step 5: 전체 테스트 회귀 확인**

```bash
npx vitest run
```

Expected: 기존 192 + 새 테스트 pass, 0 fail

- [ ] **Step 6: 커밋**

```bash
git add src/components/home/returning-user-banner.tsx src/components/home/returning-user-banner.test.tsx
git commit -m "feat(ui): ReturningUserBanner — welcome back card with day master + continue/reset"
```

---

## Task 4: `page.tsx` — 재방문 감지 + 프로필 저장 연결

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx 수정**

`src/app/page.tsx` 전체를 아래로 교체:

```tsx
"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BirthForm } from "@/components/kst/birth-form";
import { SajuResult } from "@/components/saju/saju-result";
import { ReturningUserBanner } from "@/components/home/returning-user-banner";
import { convertToKST } from "@/lib/kst-converter";
import { calcUserSaju, calcCurrentLuck } from "@/app/actions/saju";
import { saveUserSaju, loadUserSaju } from "@/lib/saju-storage";
import {
  getOrCreateUID,
  saveBirthData,
  loadBirthData,
  saveUserProfile,
} from "@/lib/user-identity";
import { track } from "@/lib/analytics";
import type { BirthData, KSTResult } from "@/lib/kst-types";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";

const subscribeTz = () => () => {};
const getTzSnapshot = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getTzServerSnapshot = () => undefined;

type View = "form" | "welcome" | "result";

export default function Home() {
  const [view, setView] = useState<View>("form");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(null);
  const [kst, setKst] = useState<KSTResult | null>(null);
  const [currentLuck, setCurrentLuck] = useState<CurrentLuck | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const defaultTz = useSyncExternalStore(subscribeTz, getTzSnapshot, getTzServerSnapshot);

  // 재방문 감지: localStorage에 UserSaju + BirthData 있으면 welcome 뷰로
  useEffect(() => {
    const cached = loadUserSaju();
    const birth = loadBirthData();
    if (cached && birth) {
      setUserSaju(cached);
      setView("welcome");
    }
  }, []);

  const handleContinue = async () => {
    const birth = loadBirthData();
    const cached = loadUserSaju();
    if (!birth || !cached) { setView("form"); return; }
    setSubmitting(true);
    try {
      const [kstResult, luck] = await Promise.all([
        Promise.resolve(convertToKST(birth)),
        calcCurrentLuck(),
      ]);
      setKst(kstResult);
      setCurrentLuck(luck);
      setView("result");
    } catch (err) {
      console.error("Continue failed:", err);
      setView("form");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem("ksaju:userSaju:v1");
      localStorage.removeItem("ksaju:birthData:v1");
    } catch { /* best-effort */ }
    setUserSaju(null);
    setKst(null);
    setCurrentLuck(null);
    setView("form");
  };

  const handleSubmit = async (data: BirthData) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const kstResult = convertToKST(data);
      const [saju, luck] = await Promise.all([
        calcUserSaju(data),
        calcCurrentLuck(),
      ]);
      setKst(kstResult);
      setUserSaju(saju);
      setCurrentLuck(luck);
      saveUserSaju(saju);
      saveBirthData(data);
      // fire-and-forget: Supabase 프로필 저장
      const uid = getOrCreateUID();
      void saveUserProfile(uid, data, saju.dayMaster);
      setView("result");
      track("birth_submitted", { has_time: data.hour !== undefined });
    } catch (err) {
      console.error("Saju calculation failed:", err);
      setErrorMessage(
        "Couldn't read this birth date. Please double-check your info and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = view === "form" || (!userSaju && view !== "result");
  const showWelcome = view === "welcome" && !!userSaju;
  const showResult = view === "result" && !!userSaju && !!kst && !!currentLuck;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="font-display text-7xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          KSaju
        </h1>
        <p className="hanja text-5xl font-bold tracking-[0.4em]">사 주</p>
        <p className="font-serif italic text-xl text-primary">
          Saju, but make it K.
        </p>

        <Card className="relative overflow-hidden border-border mt-8 py-6">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />

          {showResult ? (
            <CardContent className="pt-8 pb-2 text-left">
              <SajuResult
                userSaju={userSaju}
                kst={kst}
                currentLuck={currentLuck}
                onEdit={handleReset}
              />
            </CardContent>
          ) : showWelcome ? (
            <CardContent className="pt-8 pb-2">
              <ReturningUserBanner
                dayMaster={userSaju.dayMaster}
                onContinue={handleContinue}
                onReset={handleReset}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">When were you born?</CardTitle>
                <CardDescription>
                  Korea uses KST · we&apos;ll convert for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-left text-sm text-destructive"
                  >
                    {errorMessage}
                  </div>
                )}
                <BirthForm
                  onSubmit={handleSubmit}
                  defaultTimezone={defaultTz}
                  submitting={submitting}
                />
              </CardContent>
            </>
          )}

          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: tsc + lint 확인**

```bash
npx tsc --noEmit
```

Expected: 출력 없음 (에러 0)

- [ ] **Step 3: 전체 테스트 회귀 확인**

```bash
npx vitest run
```

Expected: 기존 192 + Task 2/3 테스트 모두 pass, 0 fail

- [ ] **Step 4: 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat(home): returning user detection — skip form on return visit, show welcome banner"
```

---

## Task 5: 최종 통합 확인 + push

- [ ] **Step 1: 빌드 확인**

```bash
npx next build 2>&1 | tail -20
```

Expected: `Route (app)` 테이블에 `/` ƒ (dynamic), `/inyeon` ○ static — 에러 없음.
(home이 `useEffect` 포함 client component라 ƒ dynamic이 됨 — 정상)

- [ ] **Step 2: 전체 테스트 최종 확인**

```bash
npx vitest run
```

Expected: 192 + 신규 테스트 모두 pass.

- [ ] **Step 3: push**

```bash
git push origin main
```

---

## 구현 후 수동 확인 체크리스트

배포 후 브라우저에서 확인:

1. **첫 방문**: 생일 폼 정상 표시 → 제출 → 결과 표시 → `localStorage` 에 `ksaju_uid`, `ksaju:birthData:v1`, `ksaju:userSaju:v1` 저장됨
2. **재방문** (새 탭 열기): "Welcome back ✨ 甲 day master →" 배너 표시 → "Continue" 클릭 → 전체 결과 로드
3. **"Change birthday"**: 클릭 시 폼으로 돌아감, localStorage 항목 삭제됨
4. **Supabase 대시보드**: `anon_users` 테이블에 행 삽입됨 확인
5. **콘솔 에러 없음**: `[user-identity]` 에러 메시지 없음
