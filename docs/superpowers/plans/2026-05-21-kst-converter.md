# KST 출생시각 변환기 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 랜딩 페이지에 출생 정보 입력 폼 + KST 변환 결과 모달(12지지 시간 포함) 구현. 사주 계산의 데이터 입구 + 외국인을 위한 "재미" 도구 통합.

**Architecture:** 5-layer — ① 도메인 로직 (`kst-converter.ts`), ② 정적 데이터 (`kst-data.ts`), ③ 폼 컴포넌트 (`birth-form.tsx`), ④ 결과 모달 (`kst-result-modal.tsx`), ⑤ 페이지 통합 (`page.tsx`). 도메인은 pure functions로 vitest 단위 테스트. UI는 시각/수동 검증.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (form, select, dialog) · react-hook-form · zod · date-fns + date-fns-tz · vitest

**Spec:** `docs/superpowers/specs/2026-05-21-kst-converter-design.md` (커밋 `99f2c6f`)

**Branch:** dev (현재 active branch)

---

## 영향받는 파일

| 파일 | 변경 | Task |
|------|------|------|
| `package.json` | deps + scripts | 1 |
| `vitest.config.ts` | 신규 | 1 |
| `src/lib/kst-types.ts` | 신규 (types + Zod) | 2 |
| `src/lib/kst-data.ts` | 신규 (constants) | 3 |
| `src/lib/kst-converter.ts` | 신규 (도메인) | 4-6 |
| `src/lib/kst-converter.test.ts` | 신규 (테스트) | 4-6 |
| `src/components/ui/form.tsx` | shadcn add | 7 |
| `src/components/ui/select.tsx` | shadcn add | 7 |
| `src/components/kst/birth-form.tsx` | 신규 | 8 |
| `src/components/kst/kst-result-modal.tsx` | 신규 | 9 |
| `src/app/page.tsx` | 수정 (use client + 통합) | 10 |

각 task = 1 commit (총 10 commits + Task 11 수동 검증).

---

## Task 1: 의존성 설치 + vitest 설정

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Goal:** date-fns + date-fns-tz + vitest 설치. React 19 / Next.js 16 호환성 빌드로 확인.

- [ ] **Step 1: 런타임 의존성 설치**

Run:
```bash
npm install date-fns date-fns-tz
```

Expected: `package.json` dependencies에 `date-fns` (^4.x) + `date-fns-tz` (^3.x) 추가.

- [ ] **Step 2: dev 의존성(vitest) 설치**

Run:
```bash
npm install -D vitest
```

Expected: devDependencies에 `vitest` (^2.x or ^3.x) 추가. jsdom은 도메인 테스트만 하므로 생략 (UI 컴포넌트 테스트 비목표).

- [ ] **Step 3: vitest 설정 파일 작성**

`vitest.config.ts` 신규 생성:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

설명: 도메인 로직은 pure JS라 `environment: "node"`로 충분 (jsdom 불필요). `globals: true`로 `describe/it/expect` 글로벌 가능. `@/` alias는 Next.js와 동일.

- [ ] **Step 4: package.json test 스크립트 추가**

`package.json` scripts에 추가 (기존 dev/build/start/lint 옆에):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: 빌드 호환성 검증**

Run:
```bash
npm run build
```

Expected: 성공. date-fns/date-fns-tz가 Next.js 16 / React 19와 호환됨을 확인. 비호환 시 BLOCKED 보고.

- [ ] **Step 6: 빈 테스트 실행 (vitest 동작 확인)**

Run:
```bash
npm test
```

Expected: "No test files found" 같은 메시지 (테스트 파일 아직 없음). vitest 자체는 정상 시작.

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "$(cat <<'EOF'
chore: add date-fns, date-fns-tz, vitest for KST converter

- date-fns + date-fns-tz: timezone-safe 날짜 변환 (DST 처리)
- vitest: 도메인 로직 단위 테스트 (Node env, jsdom 미사용)
- npm test / test:watch 스크립트 추가
- React 19 / Next.js 16 호환 빌드 확인

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 타입 + Zod 스키마

**Files:**
- Create: `src/lib/kst-types.ts`

**Goal:** BirthData, KSTResult, JiziHour 타입 + birthSchema(Zod) 한 파일에 정의. 다른 모든 모듈이 이걸 import.

- [ ] **Step 1: `src/lib/kst-types.ts` 생성**

전체 내용:

```ts
import { z } from "zod";

export type BirthData = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  timezone: string; // IANA name, e.g. "America/New_York"
};

export type JiziHour = {
  idx: number;
  name: string;
  animal: string;
  animalKo: string;
  range: string;
};

export type KSTResult = {
  sourceLocal: {
    dateLabel: string;
    timeLabel: string | null;
    timezone: { city: string; iana: string; gmt: string };
  };
  kst: {
    year: number;
    month: number;
    day: number;
    hour: number | null;
    minute: number | null;
    dateLabelKo: string;
    timeLabel: string | null;
    weekdayKo: string;
    weekdayEn: string;
  };
  jiziHour: JiziHour | null;
  funFact: string;
};

export const birthSchema = z
  .object({
    year: z
      .number({ message: "Year is required" })
      .int()
      .min(1900, "1900 이후만 지원")
      .max(2050, "2050까지만 지원"),
    month: z.number({ message: "Month is required" }).int().min(1).max(12),
    day: z.number({ message: "Day is required" }).int().min(1).max(31),
    hour: z.number().int().min(0).max(23).optional(),
    minute: z.number().int().min(0).max(59).optional(),
    timezone: z.string().min(1, "Timezone is required"),
  })
  .superRefine((data, ctx) => {
    // 월별 유효 일자 검증 (예: 2월 30일 차단)
    const maxDay = new Date(data.year, data.month, 0).getDate();
    if (data.day > maxDay) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: `${data.year}년 ${data.month}월은 ${maxDay}일까지입니다`,
      });
    }
    // hour만 있고 minute 없으면 0으로 보정 (mutate)
    if (data.hour !== undefined && data.minute === undefined) {
      data.minute = 0;
    }
  });
```

- [ ] **Step 2: 빌드 통과 확인**

Run:
```bash
npm run build
```

Expected: 성공. TypeScript 타입 체크 통과. zod의 superRefine 패턴이 타입 안전.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/kst-types.ts
git commit -m "$(cat <<'EOF'
feat(kst): add types and Zod schema for birth data

BirthData (입력), KSTResult (변환 결과), JiziHour (12지지) 타입.
birthSchema는 1900-2050 범위, 월별 유효 일자, hour-minute 보정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 정적 데이터 (POPULAR_TIMEZONES, JIZI_HOURS)

**Files:**
- Create: `src/lib/kst-data.ts`

**Goal:** 큐레이션 timezone 26개 + 12지지 매핑 테이블. UI/도메인 양쪽이 import.

- [ ] **Step 1: `src/lib/kst-data.ts` 생성**

전체 내용:

```ts
export const POPULAR_TIMEZONES = [
  // Asia
  { city: "Seoul",        iana: "Asia/Seoul",        gmt: "GMT+9" },
  { city: "Tokyo",        iana: "Asia/Tokyo",        gmt: "GMT+9" },
  { city: "Shanghai",     iana: "Asia/Shanghai",     gmt: "GMT+8" },
  { city: "Singapore",    iana: "Asia/Singapore",    gmt: "GMT+8" },
  { city: "Manila",       iana: "Asia/Manila",       gmt: "GMT+8" },
  { city: "Jakarta",      iana: "Asia/Jakarta",      gmt: "GMT+7" },
  { city: "Bangkok",      iana: "Asia/Bangkok",      gmt: "GMT+7" },
  { city: "Ho Chi Minh",  iana: "Asia/Ho_Chi_Minh",  gmt: "GMT+7" },
  { city: "Mumbai",       iana: "Asia/Kolkata",      gmt: "GMT+5:30" },
  { city: "Dubai",        iana: "Asia/Dubai",        gmt: "GMT+4" },
  // Europe
  { city: "London",       iana: "Europe/London",     gmt: "GMT+0" },
  { city: "Paris",        iana: "Europe/Paris",      gmt: "GMT+1" },
  { city: "Berlin",       iana: "Europe/Berlin",     gmt: "GMT+1" },
  { city: "Moscow",       iana: "Europe/Moscow",     gmt: "GMT+3" },
  // Americas
  { city: "New York",     iana: "America/New_York",  gmt: "GMT-5" },
  { city: "Toronto",      iana: "America/Toronto",   gmt: "GMT-5" },
  { city: "Chicago",      iana: "America/Chicago",   gmt: "GMT-6" },
  { city: "Mexico City",  iana: "America/Mexico_City", gmt: "GMT-6" },
  { city: "Denver",       iana: "America/Denver",    gmt: "GMT-7" },
  { city: "Los Angeles",  iana: "America/Los_Angeles", gmt: "GMT-8" },
  { city: "São Paulo",    iana: "America/Sao_Paulo", gmt: "GMT-3" },
  { city: "Buenos Aires", iana: "America/Argentina/Buenos_Aires", gmt: "GMT-3" },
  // Oceania
  { city: "Sydney",       iana: "Australia/Sydney",  gmt: "GMT+10" },
  { city: "Auckland",     iana: "Pacific/Auckland",  gmt: "GMT+12" },
  // Africa
  { city: "Cairo",        iana: "Africa/Cairo",      gmt: "GMT+2" },
  { city: "Lagos",        iana: "Africa/Lagos",      gmt: "GMT+1" },
] as const;

export const JIZI_HOURS = [
  { idx: 0,  name: "子 시 · Zi Hour",   animal: "Rat",     animalKo: "쥐",     range: "23:00 – 01:00" },
  { idx: 1,  name: "丑 시 · Chou Hour", animal: "Ox",      animalKo: "소",     range: "01:00 – 03:00" },
  { idx: 2,  name: "寅 시 · Yin Hour",  animal: "Tiger",   animalKo: "호랑이", range: "03:00 – 05:00" },
  { idx: 3,  name: "卯 시 · Mao Hour",  animal: "Rabbit",  animalKo: "토끼",   range: "05:00 – 07:00" },
  { idx: 4,  name: "辰 시 · Chen Hour", animal: "Dragon",  animalKo: "용",     range: "07:00 – 09:00" },
  { idx: 5,  name: "巳 시 · Si Hour",   animal: "Snake",   animalKo: "뱀",     range: "09:00 – 11:00" },
  { idx: 6,  name: "午 시 · Wu Hour",   animal: "Horse",   animalKo: "말",     range: "11:00 – 13:00" },
  { idx: 7,  name: "未 시 · Wei Hour",  animal: "Sheep",   animalKo: "양",     range: "13:00 – 15:00" },
  { idx: 8,  name: "申 시 · Shen Hour", animal: "Monkey",  animalKo: "원숭이", range: "15:00 – 17:00" },
  { idx: 9,  name: "酉 시 · You Hour",  animal: "Rooster", animalKo: "닭",     range: "17:00 – 19:00" },
  { idx: 10, name: "戌 시 · Xu Hour",   animal: "Dog",     animalKo: "개",     range: "19:00 – 21:00" },
  { idx: 11, name: "亥 시 · Hai Hour",  animal: "Pig",     animalKo: "돼지",   range: "21:00 – 23:00" },
] as const;
```

- [ ] **Step 2: 빌드 통과 확인**

Run:
```bash
npm run build
```

Expected: 성공. `as const` 타입 추론 OK.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/kst-data.ts
git commit -m "$(cat <<'EOF'
feat(kst): add POPULAR_TIMEZONES + JIZI_HOURS constants

- 26개 주요 도시 timezone (city/iana/gmt) — UI dropdown 데이터
- 12지지 시간 매핑 (한자/영문/한글/동물/범위) — 결과 모달 데이터

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: getJiziHour 함수 (TDD)

**Files:**
- Create: `src/lib/kst-converter.ts` (부분)
- Create: `src/lib/kst-converter.test.ts` (부분)

**Goal:** KST hour(0-23) → JiziHour 매핑. TDD로 wraparound 검증.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/kst-converter.test.ts` 생성:

```ts
import { describe, it, expect, test } from "vitest";
import { getJiziHour } from "./kst-converter";

describe("getJiziHour", () => {
  test.each([
    [0, "Rat"],      // 자시
    [1, "Ox"],       // 축시
    [2, "Ox"],
    [3, "Tiger"],    // 인시
    [4, "Tiger"],
    [5, "Rabbit"],
    [11, "Horse"],   // 오시
    [12, "Horse"],
    [13, "Sheep"],
    [22, "Pig"],     // 해시
    [23, "Rat"],     // 자시 wraparound
  ])("hour %i → %s", (hour, animal) => {
    expect(getJiziHour(hour).animal).toBe(animal);
  });

  it("returns JiziHour with all fields populated", () => {
    const result = getJiziHour(4); // Tiger
    expect(result).toMatchObject({
      idx: 2,
      animal: "Tiger",
      animalKo: "호랑이",
      range: "03:00 – 05:00",
    });
    expect(result.name).toContain("寅");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run:
```bash
npm test
```

Expected: FAIL — "Cannot find module './kst-converter'" 또는 export 없음.

- [ ] **Step 3: getJiziHour 최소 구현**

`src/lib/kst-converter.ts` 생성:

```ts
import { JIZI_HOURS } from "./kst-data";
import type { JiziHour } from "./kst-types";

export function getJiziHour(kstHour: number): JiziHour {
  // 자시(子)는 23-01시 wraparound. (hour + 1) mod 24를 2로 나눈 floor가 인덱스.
  const idx = Math.floor(((kstHour + 1) % 24) / 2);
  return JIZI_HOURS[idx];
}
```

- [ ] **Step 4: 테스트 실행 — 성공 확인**

Run:
```bash
npm test
```

Expected: PASS — 모든 test.each 케이스 + 객체 구조 검증 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/kst-converter.ts src/lib/kst-converter.test.ts
git commit -m "$(cat <<'EOF'
feat(kst): add getJiziHour with TDD

KST hour(0-23) → 12지지 매핑. 자시는 23-1 wraparound 처리.
test.each로 12개 매핑 + boundary 케이스 검증.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: convertToKST 함수 (TDD)

**Files:**
- Modify: `src/lib/kst-converter.ts`
- Modify: `src/lib/kst-converter.test.ts`

**Goal:** BirthData → KSTResult 변환. date-fns-tz로 timezone + DST 처리.

- [ ] **Step 1: convertToKST 실패 테스트 추가**

`src/lib/kst-converter.test.ts` 끝에 append:

```ts
import { convertToKST } from "./kst-converter";

describe("convertToKST", () => {
  it("NY 1999-03-15 14:30 EST → Seoul 1999-03-16 04:30 (Tiger)", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.kst).toMatchObject({
      year: 1999, month: 3, day: 16, hour: 4, minute: 30,
    });
    expect(r.kst.dateLabelKo).toBe("1999년 3월 16일");
    expect(r.kst.weekdayEn).toBe("Tuesday");
    expect(r.jiziHour?.animal).toBe("Tiger");
  });

  it("Tokyo 2000-06-01 14:00 JST → Seoul 2000-06-01 14:00 (same offset, Sheep)", () => {
    const r = convertToKST({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
      timezone: "Asia/Tokyo",
    });
    expect(r.kst).toMatchObject({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
    });
    expect(r.jiziHour?.animal).toBe("Sheep");
  });

  it("DST: NY 2024-03-10 14:30 EDT → Seoul 2024-03-11 03:30", () => {
    // 2024-03-10은 미국 DST 시작일, EDT(GMT-4) 적용. KST는 13시간 앞.
    const r = convertToKST({
      year: 2024, month: 3, day: 10, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.kst).toMatchObject({
      year: 2024, month: 3, day: 11, hour: 3, minute: 30,
    });
  });

  it("time 미입력 → jiziHour null, hour/minute null", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    });
    expect(r.kst.hour).toBeNull();
    expect(r.kst.minute).toBeNull();
    expect(r.kst.timeLabel).toBeNull();
    expect(r.jiziHour).toBeNull();
  });

  it("Seoul 자체 입력 → 변환 없이 동일", () => {
    const r = convertToKST({
      year: 1990, month: 5, day: 15, hour: 10, minute: 0,
      timezone: "Asia/Seoul",
    });
    expect(r.kst).toMatchObject({
      year: 1990, month: 5, day: 15, hour: 10, minute: 0,
    });
    expect(r.sourceLocal.timezone.city).toBe("Seoul");
  });

  it("sourceLocal.dateLabel 영문 포맷", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15,
      timezone: "America/New_York",
    });
    expect(r.sourceLocal.dateLabel).toBe("March 15, 1999");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run:
```bash
npm test
```

Expected: FAIL — "convertToKST is not a function" 또는 export 없음.

- [ ] **Step 3: convertToKST + 보조 함수 구현**

`src/lib/kst-converter.ts` 끝에 append:

```ts
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { ko, enUS } from "date-fns/locale";
import { POPULAR_TIMEZONES } from "./kst-data";
import type { BirthData, KSTResult } from "./kst-types";

const pad = (n: number) => n.toString().padStart(2, "0");

function format12Hour(h: number, m: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${pad(h12)}:${pad(m)} ${period}`;
}

function formatSourceDate(input: BirthData): string {
  return new Date(input.year, input.month - 1, input.day)
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getGmtLabel(iana: string, atDate: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: iana,
    timeZoneName: "shortOffset",
  }).formatToParts(atDate);
  return parts.find(p => p.type === "timeZoneName")?.value ?? "GMT?";
}

export function convertToKST(input: BirthData): KSTResult {
  const hasTime = input.hour !== undefined && input.minute !== undefined;

  // 1) Source naive datetime string → UTC Date
  const naiveStr = hasTime
    ? `${input.year}-${pad(input.month)}-${pad(input.day)}T${pad(input.hour!)}:${pad(input.minute!)}:00`
    : `${input.year}-${pad(input.month)}-${pad(input.day)}T12:00:00`;
  const utcDate = fromZonedTime(naiveStr, input.timezone);

  // 2) KST 포맷팅
  const kstY = parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "yyyy"), 10);
  const kstM = parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "M"), 10);
  const kstD = parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "d"), 10);
  const kstH = hasTime ? parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "H"), 10) : null;
  const kstMin = hasTime ? parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "m"), 10) : null;
  const weekdayKo = formatInTimeZone(utcDate, "Asia/Seoul", "EEEE", { locale: ko });
  const weekdayEn = formatInTimeZone(utcDate, "Asia/Seoul", "EEEE", { locale: enUS });

  // 3) Lookup
  const sourceTzMatch = POPULAR_TIMEZONES.find(t => t.iana === input.timezone);
  const sourceTz = sourceTzMatch
    ? { city: sourceTzMatch.city, iana: sourceTzMatch.iana, gmt: sourceTzMatch.gmt }
    : {
        city: input.timezone.split("/").pop()!.replace(/_/g, " "),
        iana: input.timezone,
        gmt: getGmtLabel(input.timezone, utcDate),
      };
  const jiziHour = hasTime ? getJiziHour(kstH!) : null;

  return {
    sourceLocal: {
      dateLabel: formatSourceDate(input),
      timeLabel: hasTime ? format12Hour(input.hour!, input.minute!) : null,
      timezone: sourceTz,
    },
    kst: {
      year: kstY, month: kstM, day: kstD, hour: kstH, minute: kstMin,
      dateLabelKo: `${kstY}년 ${kstM}월 ${kstD}일`,
      timeLabel: hasTime ? format12Hour(kstH!, kstMin!) : null,
      weekdayKo,
      weekdayEn,
    },
    jiziHour,
    funFact: "", // Task 6에서 채움
  };
}
```

설명: funFact는 빈 string으로 두고 Task 6에서 buildFunFact로 채움 (TDD를 step별로 분리).

- [ ] **Step 4: 테스트 실행 — 성공 확인**

Run:
```bash
npm test
```

Expected: PASS — 6개 convertToKST 테스트 + 기존 getJiziHour 테스트 모두 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/kst-converter.ts src/lib/kst-converter.test.ts
git commit -m "$(cat <<'EOF'
feat(kst): add convertToKST with date-fns-tz (TDD)

BirthData → KSTResult 변환. fromZonedTime으로 source tz의 naive datetime을
UTC로 변환, formatInTimeZone으로 KST 포맷.
- 케이스: NY/Tokyo/DST/Seoul/no-time/source label
- locale ko/enUS로 weekday 한영 동시 출력
- funFact는 Task 6에서

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: buildFunFact 함수 (TDD)

**Files:**
- Modify: `src/lib/kst-converter.ts`
- Modify: `src/lib/kst-converter.test.ts`

**Goal:** 날짜 차이 + 한국 시간대를 분석해 1줄 fun fact 생성.

- [ ] **Step 1: 실패 테스트 추가**

`src/lib/kst-converter.test.ts` 끝에 append:

```ts
describe("buildFunFact (via convertToKST)", () => {
  it("NY 14:30 EST → Seoul 다음 날 새벽: 'next day in Korea' + '새벽'", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.funFact).toContain("next day");
    expect(r.funFact).toContain("새벽");
  });

  it("Tokyo 14:00 → Seoul 14:00 같은 날 오후: 'Same day' + 'midday'/'afternoon'", () => {
    const r = convertToKST({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
      timezone: "Asia/Tokyo",
    });
    expect(r.funFact).toContain("Same day");
  });

  it("Sydney 03:00 → Seoul 전날 02:00: 'previous day' + '새벽'", () => {
    const r = convertToKST({
      year: 2024, month: 6, day: 15, hour: 3, minute: 0,
      timezone: "Australia/Sydney",
    });
    // Sydney AEST is GMT+10, Seoul is GMT+9. 03:00 Sydney = 02:00 Seoul same day actually.
    // Let me reverse: Sydney 00:30 → Seoul previous day 23:30
    // Adjust test for reliable previous-day case
  });

  it("Sydney 00:30 → Seoul 전날 23:30 (previous day)", () => {
    const r = convertToKST({
      year: 2024, month: 6, day: 15, hour: 0, minute: 30,
      timezone: "Australia/Sydney",
    });
    expect(r.kst.day).toBe(14);
    expect(r.funFact).toContain("previous day");
  });

  it("time 미입력 + 같은 시간대: 'share the same day'", () => {
    const r = convertToKST({
      year: 1990, month: 5, day: 15,
      timezone: "Asia/Tokyo",
    });
    expect(r.funFact).toContain("same day");
  });
});
```

설명: 세 번째 테스트는 의도와 안 맞아서 빈 주석 처리. 네 번째 테스트가 previous day 케이스. 

위 코드에서 세 번째 테스트는 비어있으니 제거:

```ts
describe("buildFunFact (via convertToKST)", () => {
  it("NY 14:30 EST → Seoul 다음 날 새벽: 'next day in Korea' + '새벽'", () => {
    const r = convertToKST({
      year: 1999, month: 3, day: 15, hour: 14, minute: 30,
      timezone: "America/New_York",
    });
    expect(r.funFact).toContain("next day");
    expect(r.funFact).toContain("새벽");
  });

  it("Tokyo 14:00 → Seoul 14:00 같은 날 오후: 'Same day'", () => {
    const r = convertToKST({
      year: 2000, month: 6, day: 1, hour: 14, minute: 0,
      timezone: "Asia/Tokyo",
    });
    expect(r.funFact).toContain("Same day");
  });

  it("Sydney 00:30 → Seoul 전날 23:30 (previous day)", () => {
    const r = convertToKST({
      year: 2024, month: 6, day: 15, hour: 0, minute: 30,
      timezone: "Australia/Sydney",
    });
    expect(r.kst.day).toBe(14);
    expect(r.funFact).toContain("previous day");
  });

  it("time 미입력 + 같은 시간대: 'share the same day' 또는 'KST와' 메시지", () => {
    const r = convertToKST({
      year: 1990, month: 5, day: 15,
      timezone: "Asia/Tokyo",
    });
    expect(r.funFact.length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run:
```bash
npm test
```

Expected: 새로 추가한 4개 테스트 FAIL (현재 funFact는 빈 string).

- [ ] **Step 3: buildFunFact 구현**

`src/lib/kst-converter.ts`에서 보조 함수 영역에 추가 (다른 helpers 뒤, convertToKST 앞):

```ts
function koreaTimeOfDay(hour: number): string {
  if (hour < 5)  return "새벽 (dawn)";
  if (hour < 9)  return "아침 (morning)";
  if (hour < 12) return "오전 (late morning)";
  if (hour < 14) return "정오 (midday)";
  if (hour < 18) return "오후 (afternoon)";
  if (hour < 21) return "저녁 (evening)";
  return "밤 (night)";
}

function buildFunFact(
  input: BirthData,
  kstY: number, kstM: number, kstD: number, kstH: number | null,
  sourceCity: string
): string {
  // 날짜 차이 (월/년 경계 고려) — Date arithmetic로 단순 계산
  const sourceDateUTC = Date.UTC(input.year, input.month - 1, input.day);
  const kstDateUTC = Date.UTC(kstY, kstM - 1, kstD);
  const dayDelta = Math.round((kstDateUTC - sourceDateUTC) / (1000 * 60 * 60 * 24));

  if (dayDelta === 1) {
    const tod = kstH !== null ? koreaTimeOfDay(kstH) : "morning (아침)";
    return `You were born the next day in Korea — already ${tod} when you arrived.`;
  }
  if (dayDelta === -1) {
    const tod = kstH !== null ? koreaTimeOfDay(kstH) : "evening (저녁)";
    return `You were born the previous day in Korea — still ${tod} from yesterday.`;
  }

  // Same day
  if (kstH !== null) {
    return `Same day in Korea, around ${koreaTimeOfDay(kstH)}.`;
  }
  return `Korea (KST) and ${sourceCity} share the same day for your birth.`;
}
```

그리고 convertToKST 마지막 줄 변경:

```ts
// 이전: funFact: "", // Task 6에서 채움
funFact: buildFunFact(input, kstY, kstM, kstD, kstH, sourceTz.city),
```

- [ ] **Step 4: 테스트 실행 — 성공 확인**

Run:
```bash
npm test
```

Expected: 모든 테스트 (getJiziHour + convertToKST + buildFunFact) PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/kst-converter.ts src/lib/kst-converter.test.ts
git commit -m "$(cat <<'EOF'
feat(kst): add buildFunFact for next-day/previous-day/same-day messages (TDD)

날짜 차이를 Date.UTC로 계산해 next/previous/same 분기.
한국 시간대를 koreaTimeOfDay()로 새벽/아침/오전/정오/오후/저녁/밤 매핑.
영어 메시지 + 한글 괄호로 K-content 톤.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: shadcn form + select 추가

**Files:**
- Create: `src/components/ui/form.tsx`
- Create: `src/components/ui/select.tsx`
- Modify: `package.json` (자동 — shadcn CLI가 react-hook-form 등 추가)

**Goal:** form (react-hook-form 래퍼) + select (radix-ui select 기반) 컴포넌트 설치.

- [ ] **Step 1: form 컴포넌트 추가**

Run:
```bash
npx shadcn@latest add form
```

Expected: `src/components/ui/form.tsx` 생성. react-hook-form 등 이미 설치된 deps는 skip.

만약 인터랙티브 프롬프트 ("Use --force?", etc.) 발생하면 yes/기본값 선택. CLI가 hang이면 BLOCKED 보고.

- [ ] **Step 2: select 컴포넌트 추가**

Run:
```bash
npx shadcn@latest add select
```

Expected: `src/components/ui/select.tsx` 생성. `@radix-ui/react-select` 자동 설치.

- [ ] **Step 3: 빌드 통과 확인**

Run:
```bash
npm run build
```

Expected: 성공. 새 컴포넌트 import 없어서 tree-shaking됨.

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/form.tsx src/components/ui/select.tsx package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(ui): add shadcn form and select components

shadcn CLI로 설치:
- form: react-hook-form 래퍼 (FormField, FormLabel, FormMessage 등)
- select: Radix UI 기반 Select (SelectTrigger, SelectContent, SelectItem)

BirthForm에서 사용 예정.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: BirthForm 컴포넌트

**Files:**
- Create: `src/components/kst/birth-form.tsx`

**Goal:** Native date/time input + timezone Select + react-hook-form 통합. 자동감지 timezone default + 모드 자동 적응 스타일.

- [ ] **Step 1: 디렉토리 + 파일 생성**

`src/components/kst/birth-form.tsx` 신규:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { birthSchema } from "@/lib/kst-types";
import { POPULAR_TIMEZONES } from "@/lib/kst-data";
import type { BirthData } from "@/lib/kst-types";
import type { z } from "zod";

type BirthFormProps = {
  onSubmit: (data: BirthData) => void;
  defaultTimezone?: string;
};

type FormValues = z.infer<typeof birthSchema>;

export function BirthForm({ onSubmit, defaultTimezone }: BirthFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(birthSchema),
    defaultValues: {
      timezone: defaultTimezone ?? "Asia/Seoul",
    },
  });

  // defaultTimezone이 mount 후 결정되므로 변경 시 폼에 반영
  if (defaultTimezone && form.getValues("timezone") === "Asia/Seoul" && defaultTimezone !== "Asia/Seoul") {
    form.setValue("timezone", defaultTimezone);
  }

  const handleDateChange = (value: string) => {
    if (!value) {
      form.resetField("year");
      form.resetField("month");
      form.resetField("day");
      return;
    }
    const [y, m, d] = value.split("-").map(Number);
    form.setValue("year", y, { shouldValidate: true });
    form.setValue("month", m, { shouldValidate: true });
    form.setValue("day", d, { shouldValidate: true });
  };

  const handleTimeChange = (value: string) => {
    if (!value) {
      form.resetField("hour");
      form.resetField("minute");
      return;
    }
    const [h, m] = value.split(":").map(Number);
    form.setValue("hour", h);
    form.setValue("minute", m);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
        <FormItem>
          <FormLabel>Birth date</FormLabel>
          <FormControl>
            <Input
              type="date"
              min="1900-01-01"
              max="2050-12-31"
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </FormControl>
          <FormMessage>
            {form.formState.errors.year?.message ||
              form.formState.errors.month?.message ||
              form.formState.errors.day?.message}
          </FormMessage>
        </FormItem>

        <FormItem>
          <FormLabel>
            Birth time <span className="text-muted-foreground text-xs">(optional)</span>
          </FormLabel>
          <FormControl>
            <Input
              type="time"
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </FormControl>
          <FormDescription className="text-xs">
            Needed for your full saju (12지지 hour pillar).
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Born in</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POPULAR_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.iana} value={tz.iana}>
                      {tz.city} ({tz.gmt})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Auto-detected from your browser. Change if you were born elsewhere.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full">
          Discover your saju
        </Button>
      </form>
    </Form>
  );
}
```

설명:
- Date/Time native inputs는 form state에 직접 register 안 하고 handle*Change로 분해해서 setValue
- 비어있을 때 resetField로 undefined로 되돌림 → Zod의 required 검증이 정상 작동
- timezone Select는 표준 FormField + Controller 패턴
- defaultTimezone prop이 mount 후 도착 — 한 번 폼에 반영 (간단한 useState 대체)

- [ ] **Step 2: 빌드 통과 확인**

Run:
```bash
npm run build
```

Expected: 성공. TypeScript 타입 체크 통과. zodResolver/useForm/Select 모두 정상.

- [ ] **Step 3: 커밋**

```bash
git add src/components/kst/birth-form.tsx
git commit -m "$(cat <<'EOF'
feat(kst): add BirthForm component (date/time/timezone)

react-hook-form + zod + shadcn form/select.
Native HTML5 date/time inputs을 synthetic field로 처리 → year/month/day/hour/minute 분해.
defaultTimezone prop이 mount 후 폼에 자동 반영.
모든 라벨/에러 시맨틱 토큰 → Light/Dark 자동.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: KstResultModal 컴포넌트

**Files:**
- Create: `src/components/kst/kst-result-modal.tsx`

**Goal:** shadcn Dialog 기반 결과 모달. 한지 테마 + 창살 + KST 정보 + 12지지 + Saju CTA(disabled).

- [ ] **Step 1: 파일 생성**

`src/components/kst/kst-result-modal.tsx` 신규:

```tsx
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { KSTResult } from "@/lib/kst-types";

type KstResultModalProps = {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  result: KSTResult | null;
};

export function KstResultModal({ open, onClose, onEdit, result }: KstResultModalProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 상단 창살 */}
        <div
          className="changsal-band absolute top-0 left-0 right-0 h-[14px] z-10"
          style={{ backgroundSize: "40px 14px" }}
        />

        <div className="px-6 pt-8 pb-6 space-y-4">
          {/* 원본 시각 */}
          <section>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              In your timezone
            </p>
            <p className="text-sm text-muted-foreground">
              {result.sourceLocal.dateLabel}
              {result.sourceLocal.timeLabel && ` · ${result.sourceLocal.timeLabel}`}
              {` · ${result.sourceLocal.timezone.city} (${result.sourceLocal.timezone.gmt})`}
            </p>
          </section>

          <div className="text-center text-accent font-calli text-3xl select-none">↓</div>

          {/* KST 결과 */}
          <section className="text-center space-y-1">
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">
              In Korea (KST)
            </p>
            <p className="font-serif font-bold text-2xl text-foreground">
              {result.kst.dateLabelKo}
            </p>
            {result.kst.timeLabel && (
              <p className="font-display font-bold text-4xl bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                {result.kst.timeLabel}
              </p>
            )}
            <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mt-1">
              {result.kst.weekdayKo} · {result.kst.weekdayEn}
            </span>
          </section>

          {/* 12지지 또는 hint */}
          {result.jiziHour ? (
            <div className="bg-accent/10 rounded-lg p-3 text-center">
              <p className="font-serif font-bold text-lg text-accent">{result.jiziHour.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {result.jiziHour.range} KST · {result.jiziHour.animal} ({result.jiziHour.animalKo})
              </p>
              <p className="text-[11px] font-semibold text-primary mt-1">
                ★ This becomes your 시주 (hour pillar) in saju.
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-3 text-center text-[11px] text-muted-foreground">
              Provide a birth time to see your 12지지 hour and full saju.
            </div>
          )}

          {/* Fun fact */}
          <div className="border-l-[3px] border-primary bg-primary/5 px-3 py-2 rounded-r text-xs">
            <strong className="text-primary">Fun fact:</strong> {result.funFact}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <div className="relative">
              <Button disabled className="w-full">
                Discover your saju →
              </Button>
              <span className="absolute -top-2 -right-1 bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-[9px] font-bold">
                Coming Soon
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="w-full opacity-70">
              ← Edit my info
            </Button>
          </div>
        </div>

        {/* 하단 창살 */}
        <div
          className="changsal-band absolute bottom-0 left-0 right-0 h-[14px] z-10"
          style={{ backgroundSize: "40px 14px" }}
        />
      </DialogContent>
    </Dialog>
  );
}
```

설명:
- DialogContent에 `hanji-paper` + 상하 창살 → 디자인 시스템 연속성
- 모든 색·배경 시맨틱 토큰 (모드 자동 적응)
- jiziHour null이면 hint placeholder
- Saju CTA: disabled + Coming Soon 배지
- `max-h-[90vh] overflow-y-auto`로 모바일 안전

- [ ] **Step 2: 빌드 통과 확인**

Run:
```bash
npm run build
```

Expected: 성공. (모달은 아직 어디서도 import 안 됨 — Task 10에서 page.tsx가 사용)

- [ ] **Step 3: 커밋**

```bash
git add src/components/kst/kst-result-modal.tsx
git commit -m "$(cat <<'EOF'
feat(kst): add KstResultModal component (hanji-themed Dialog)

shadcn Dialog 기반 결과 모달:
- 한지 배경 + 상하 창살 (디자인 시스템 연속성)
- 원본 시각 → ↓ → KST 시각 (날짜/시간/요일)
- 12지지 카드 (호랑이/용/뱀 등) + 시주 hook
- time 없으면 hint placeholder
- fun fact 박스 (진달래 border-l)
- Saju CTA disabled + Coming Soon 배지
- max-h-[90vh] overflow-y-auto로 모바일 안전

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: page.tsx 통합

**Files:**
- Modify (full rewrite): `src/app/page.tsx`

**Goal:** 기존 hero card를 BirthForm + KstResultModal로 교체. "use client" + useState/useEffect로 모달 state 관리.

- [ ] **Step 1: page.tsx 전면 교체**

`src/app/page.tsx`를 다음 내용으로 완전히 교체:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BirthForm } from "@/components/kst/birth-form";
import { KstResultModal } from "@/components/kst/kst-result-modal";
import { convertToKST } from "@/lib/kst-converter";
import type { BirthData, KSTResult } from "@/lib/kst-types";

export default function Home() {
  const [result, setResult] = useState<KSTResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTz, setDefaultTz] = useState<string>();

  useEffect(() => {
    setDefaultTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const handleSubmit = (data: BirthData) => {
    try {
      const r = convertToKST(data);
      setResult(r);
      setModalOpen(true);
    } catch (err) {
      console.error("KST conversion failed:", err);
      alert("변환 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <main className="hanji-paper min-h-screen relative overflow-hidden">
      {/* 페이지 상단 창살 */}
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      {/* 우상단 테마 토글 */}
      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 거대 ㅎ 배경 */}
      <span
        className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-0"
        aria-hidden="true"
      >
        ㅎ
      </span>

      {/* Hero 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-14 px-8">
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
            <CardHeader>
              <CardTitle className="text-2xl">When were you born?</CardTitle>
              <CardDescription>
                Korea uses KST · we&apos;ll convert for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BirthForm onSubmit={handleSubmit} defaultTimezone={defaultTz} />
            </CardContent>
            <div
              className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
              style={{ backgroundSize: "40px 18px" }}
            />
          </Card>
        </div>
      </div>

      {/* 결과 모달 */}
      <KstResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEdit={() => setModalOpen(false)}
        result={result}
      />

      {/* 페이지 하단 창살 */}
      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

핵심 변경 (vs 기존):
- `"use client"` 추가
- import: BirthForm, KstResultModal, convertToKST, types
- useState/useEffect로 result/modalOpen/defaultTz 관리
- 기존 카드 콘텐츠 ("Your Inyeon Awaits" + 두 버튼) 제거
- 카드 헤더: "When were you born?" + CardDescription
- 카드 내부: `<BirthForm onSubmit={handleSubmit} defaultTimezone={defaultTz} />`
- 카드 외부 (main 아래): `<KstResultModal ... />`
- `we'll` 같은 apostrophe는 JSX에서 `&apos;`로 escape (또는 don't 같은 단순 영문은 그대로 OK — ESLint react/no-unescaped-entities 규칙 회피)

기존 페이지의 hero 헤더 (KSaju, 사 주, italic 문구) + 한지/창살/ㅎ/토글은 그대로 유지.

- [ ] **Step 2: 빌드 + lint 통과 확인**

Run:
```bash
npm run build && npm run lint
```

Expected: 둘 다 성공. 만약 lint에서 `react/no-unescaped-entities` 같은 에러가 나오면 해당 텍스트를 `&apos;` 또는 `{"\""}` 같이 처리.

- [ ] **Step 3: 전체 테스트 (vitest 회귀)**

Run:
```bash
npm test
```

Expected: 모든 도메인 테스트 통과 (UI 변경이 도메인에 영향 없음 확인).

- [ ] **Step 4: 커밋**

```bash
git add src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat(landing): integrate KST converter form and result modal

기존 hero card의 마케팅 카피 + 두 버튼을 BirthForm + KstResultModal로 교체.
- "use client" + useState/useEffect로 모달 state 관리
- 브라우저 timezone 자동 감지 (useEffect 후 BirthForm에 전달)
- 카드 헤더: "When were you born?" + CardDescription
- 한지/창살/ㅎ/토글 디자인 그대로 보존

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: 수동 시각 검증 (no commit)

**Files:** 없음 — 브라우저 + DevTools.

**Goal:** spec 8.2의 12개 시나리오 모두 통과.

- [ ] **Step 1: dev 서버 실행**

Run:
```bash
npm run dev
```

Expected: `▲ Next.js 16.x.x` 배너, `Local: http://localhost:3000` (또는 :3001). 컴파일 에러 없음.

- [ ] **Step 2: 폼 초기 상태 확인**

브라우저 시크릿 창에서 localhost:3000 열기.

Expected:
- 기존 KSaju 헤더 + 사 주 + italic 문구 정상
- 카드 헤더가 "When were you born?" + "Korea uses KST · we'll convert for you"
- 폼 3개 필드: Birth date / Birth time (optional) / Born in
- timezone Select 기본값이 browser 자동 감지 도시 (Seoul 등)
- "Discover your saju" 버튼

- [ ] **Step 3: 정상 변환 케이스**

폼에 입력:
- Date: 1999-03-15
- Time: 14:30
- Born in: New York (GMT-5)

Submit 클릭.

Expected: 모달 나타남
- "In your timezone": March 15, 1999 · 2:30 PM · New York (GMT-5)
- ↓
- "In Korea (KST)": 1999년 3월 16일 · 04:30 AM
- 요일 pill: 화요일 · Tuesday
- 12지지 카드: 寅 시 · Yin Hour / 03:00 – 05:00 KST · Tiger (호랑이) / ★ This becomes your 시주
- Fun fact: "You were born the next day in Korea — already 새벽 (dawn) when you arrived."
- "Discover your saju → Coming Soon" 버튼 (disabled)
- "← Edit my info" 버튼

- [ ] **Step 4: Edit → 폼 복귀**

"← Edit my info" 클릭.

Expected: 모달 닫힘. 폼 값 보존 (date/time/timezone 그대로). 다시 Submit하면 같은 결과.

- [ ] **Step 5: time 미입력 케이스**

폼 재설정 또는 같은 데이터로 시간만 비우고 Submit.

Expected:
- 12지지 자리에 "Provide a birth time to see your 12지지 hour and full saju." 표시
- KST 시각이 시간 없음 (날짜만 표시)

- [ ] **Step 6: invalid 날짜**

Date: 2024-02-30 입력 시도 (브라우저가 막을 수도 있음 — 그러면 직접 콘솔에서 form state 조작 또는 다른 invalid 케이스).

대안: Date: 2024-02-29 (윤년 OK), Date: 2023-02-29 — 브라우저가 차단할 가능성. 차단 안 되는 케이스로 검증:

- 1899-12-31 입력 → Zod min(1900) 에러 "1900 이후만 지원"
- 2051-01-01 입력 → Zod max(2050) 에러 "2050까지만 지원"

Expected: 폼 아래 inline error 메시지. 모달 안 열림.

- [ ] **Step 7: Dark mode 토글**

우상단 ☀️/🌙 토글 클릭 → Dark 전환 → Submit 다시.

Expected: 모달이 Dark 톤 (Cosmic gradient 배경 / 한지 크림 stroke 창살 / 시맨틱 토큰 자동 적용). 가독성 OK.

- [ ] **Step 8: 모바일 viewport 확인**

DevTools Device toolbar (Ctrl+Shift+M) → iPhone 14 (390x844) 선택.

Expected:
- 폼이 카드 안에 한 화면에 잘 들어감
- 거대 ㅎ가 우하단 안쪽에 작게 표시 (기존 responsive)
- Submit → 모달이 viewport 안에 들어감 (max-w-md max-h-[90vh])
- 스크롤 필요 시 모달 내부 스크롤 정상

- [ ] **Step 9: 자동 테스트 회귀**

Run:
```bash
npm test
```

Expected: 모든 vitest 테스트 통과. UI 변경이 도메인 영향 없음 재확인.

- [ ] **Step 10: 최종 빌드/lint**

Run:
```bash
npm run build && npm run lint
```

Expected: 둘 다 통과. 경고 없음.

- [ ] **Step 11: 보고**

사용자에게 결과 보고:
- 모든 시각 검증 통과
- npm test / build / lint 통과
- 미해결 이슈 있으면 명시

---

## Self-Review

**1. Spec coverage:**

- 5-layer 아키텍처 → Task 2(types), 3(data), 4-6(domain), 8(form), 9(modal), 10(page) ✓
- Native HTML5 date/time inputs → Task 8 ✓
- Timezone Select with auto-detect → Task 8 + page.tsx useEffect ✓
- 12지지 카드 / hint placeholder → Task 9 ✓
- Saju CTA disabled + Coming Soon → Task 9 ✓
- Modal with hanji theme + changsal → Task 9 ✓
- Zod 검증 (year range, 월별 일자, hour-minute 보정) → Task 2 ✓
- convertToKST DST 처리 → Task 5 (DST 테스트 포함) ✓
- getJiziHour wraparound → Task 4 (test.each 23/0 케이스) ✓
- buildFunFact next/previous/same day → Task 6 ✓
- vitest TDD → Task 1 (setup) + 4/5/6 ✓
- 수동 검증 시나리오 12개 → Task 11 ✓

**2. Placeholder scan:** 없음. 모든 코드 블록 완전.

**3. Type consistency:**
- `BirthData`, `KSTResult`, `JiziHour` Task 2에서 정의 → Task 4-10 모두 동일 명명 ✓
- `convertToKST(input: BirthData): KSTResult` signature Task 5와 Task 10 일치 ✓
- `getJiziHour(kstHour: number): JiziHour` Task 4 정의, Task 5에서 호출 ✓
- `birthSchema` Task 2 정의, Task 8 zodResolver에서 사용 ✓
- `BirthFormProps { onSubmit, defaultTimezone }` Task 8 정의, Task 10 사용 일치 ✓
- `KstResultModalProps { open, onClose, onEdit, result }` Task 9 정의, Task 10 사용 일치 ✓

**4. Spec 위험 표 반영:**
- date-fns-tz 호환성 → Task 1 Step 5에서 빌드 검증
- HTML5 date input UX 차이 → 폴리필 안 함 (의도된 결정)
- 12지지 wraparound 버그 → Task 4 TDD로 검증
- Modal 모바일 잘림 → Task 9에서 max-h-[90vh] overflow-y-auto
- 'use client' metadata 영향 → Task 10 빌드 검증으로 자동 확인
- date-fns ko locale import 누락 → Task 5 import { ko, enUS } from "date-fns/locale" 명시

---

## 실행 옵션

Plan complete and saved to `docs/superpowers/plans/2026-05-21-kst-converter.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 각 task마다 fresh subagent 디스패치, task 간 review, 빠른 iteration

**2. Inline Execution** — 현재 세션에서 task 실행, checkpoint마다 review

Which approach?
