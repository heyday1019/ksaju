# KST Birth Time Converter — 디자인 설계서

- **작성일:** 2026-05-21
- **상태:** 설계 승인 대기
- **선행 명세:**
  - `2026-05-21-baekui-hanji-pivot-design.md` (디자인 시스템 — 완료, dev 브랜치)
- **TDD:** 적용 (도메인 로직). UI는 시각/수동 검증.

---

## 1. 컨텍스트 및 동기

KSaju 타겟 사용자는 K-content 세대의 글로벌 audience (주로 영어권). 사주는 한국 시간(KST) 기준으로 계산되므로, 외국에서 태어난 사용자의 local 출생 시각은 KST로 변환해야 정확. 현재 랜딩 페이지는 마케팅 카피 + "Discover your saju" 버튼만 있고 데이터 입력 인터페이스가 없음.

이번 작업: 랜딩 페이지의 hero card를 **출생 정보 입력 폼**으로 교체. 입력을 KST로 변환해 결과 모달에 표시. 결과에 12지지 시간(사주의 첫 기둥) 미리보기 + "사주 보기" CTA (Coming Soon 상태). 이로써 폼은 **도구**(재미)와 **사주 입구**(데이터 수집) 두 역할을 동시에 수행.

### 1.1 사용자 가치

- **외국인:** "나는 한국 시각으로 언제 태어났지?" 호기심 해소 + 사주의 정확도 확보
- **K-culture 친화 hook:** 12지지 동물 시간(호랑이/용/뱀 등)을 자기 출생과 연결
- **사주 서론:** 모달의 "Discover your saju →" CTA로 향후 사주 기능과 연속성

---

## 2. 목표

1. 사용자가 출생 년/월/일을 입력하면 (시간·timezone optional) KST 변환 결과가 표시된다.
2. timezone은 브라우저에서 자동 감지하되 26개 주요 도시 dropdown으로 override 가능.
3. 결과 모달에 KST 날짜·시각·요일 + 12지지 시간(time 있을 때) + fun fact 표시.
4. 사주 CTA는 disabled + "Coming Soon" 배지 (향후 spec에서 활성화).
5. 기존 디자인 시스템(백의민족 한지 + Cosmic Korean 듀얼) 위에 자연스럽게 통합 — 시맨틱 토큰만 사용해 모드 자동 적응.
6. 도메인 로직(timezone 변환·12지지 매핑)은 단위 테스트(vitest)로 검증.
7. 1900-2050 년 범위(@fullstackfamily/manseryeok 호환), DST 자동 처리(date-fns-tz).

### 2.1 비목표 (Out of Scope)

- **실제 사주 계산** — manseryeok 기반 사주 표시 (별도 spec)
- **결과 저장 / 사용자 가입** — Supabase 연동, 히스토리
- **공유 기능** — URL 공유, SNS 카드
- **언어 전환 UI** — next-intl로 한국어 모드
- **사주 12지지 외 기둥** — 년주·월주·일주 미리보기
- **음력 변환** — lunar-javascript 활용
- **모바일 viewport 전면 재검토** — 핵심 폼/모달은 모바일 작동, 페이지 외 다른 요소는 별도

---

## 3. 아키텍처 — 5-layer

```
① 도메인 로직 (Pure functions)          — src/lib/kst-converter.ts
   convertToKST · getJiziHour · buildFunFact · format helpers
   ↓ 호출
② 상수 & 데이터                          — src/lib/kst-data.ts
   POPULAR_TIMEZONES (26) · JIZI_HOURS (12)
   ↓ 사용
③ 폼 컴포넌트 (Client)                   — src/components/kst/birth-form.tsx
   react-hook-form + zod, native HTML5 inputs, timezone Select
   ↓ 제출
④ 결과 모달 (Client)                     — src/components/kst/kst-result-modal.tsx
   shadcn Dialog + hanji 테마, 12지지 카드, Saju CTA (disabled)
   ↓ 통합
⑤ 페이지 통합                            — src/app/page.tsx (수정, "use client" 추가)
   useState로 모달 open/result 관리, useEffect로 browser tz 감지
```

**책임 분리 이유:**
- ①+② 모듈은 UI 무관 → 향후 사주 spec에서도 재사용 (12지지·timezone 데이터, 변환 패턴)
- ③ 폼은 입력만, 변환 로직 안 가짐
- ④ 모달은 결과 표시만, 도메인 호출 안 함 (페이지가 변환 후 결과를 prop으로 전달)
- ⑤ 페이지는 orchestration만 — 얇게 유지

---

## 4. 데이터 형태 & 검증

### 4.1 타입 (`src/lib/kst-types.ts`)

```ts
export type BirthData = {
  year: number;        // 1900 ~ 2050
  month: number;       // 1 ~ 12
  day: number;         // 1 ~ 31 (월별 일수 검증)
  hour?: number;       // 0 ~ 23 (옵션)
  minute?: number;     // 0 ~ 59 (옵션)
  timezone: string;    // IANA name, e.g. "America/New_York"
};

export type KSTResult = {
  sourceLocal: {
    dateLabel: string;       // "March 15, 1999"
    timeLabel: string | null; // "2:30 PM" or null
    timezone: { city: string; iana: string; gmt: string };
  };
  kst: {
    year: number; month: number; day: number;
    hour: number | null; minute: number | null;
    dateLabelKo: string;     // "1999년 3월 16일"
    timeLabel: string | null;// "04:30 AM" or null
    weekdayKo: string;       // "화요일"
    weekdayEn: string;       // "Tuesday"
  };
  jiziHour: JiziHour | null;
  funFact: string;
};

export type JiziHour = {
  idx: number;             // 0-11
  name: string;            // "寅 시 · Yin Hour"
  animal: string;          // "Tiger"
  animalKo: string;        // "호랑이"
  range: string;           // "03:00 – 05:00"
};
```

### 4.2 Zod schema (`src/lib/kst-types.ts`)

```ts
import { z } from "zod";

export const birthSchema = z.object({
  year: z.number().int().min(1900, "1900년 이후만 지원").max(2050, "2050년까지만 지원"),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  timezone: z.string().min(1),
}).superRefine((data, ctx) => {
  // 월별 유효 일자 검증
  const maxDay = new Date(data.year, data.month, 0).getDate();
  if (data.day > maxDay) {
    ctx.addIssue({
      code: "custom", path: ["day"],
      message: `${data.year}년 ${data.month}월은 ${maxDay}일까지입니다`
    });
  }
  // hour만 있고 minute 없으면 minute=0으로 보정
  if (data.hour !== undefined && data.minute === undefined) {
    data.minute = 0;
  }
});
```

### 4.3 12지지 데이터 (`src/lib/kst-data.ts`)

```ts
export const JIZI_HOURS = [
  { idx: 0,  name: "子 시 · Zi Hour",   animal: "Rat",     animalKo: "쥐",     range: "23:00 – 01:00" },
  { idx: 1,  name: "丑 시 · Chou Hour", animal: "Ox",      animalKo: "소",     range: "01:00 – 03:00" },
  { idx: 2,  name: "寅 시 · Yin Hour",  animal: "Tiger",   animalKo: "호랑이",  range: "03:00 – 05:00" },
  { idx: 3,  name: "卯 시 · Mao Hour",  animal: "Rabbit",  animalKo: "토끼",    range: "05:00 – 07:00" },
  { idx: 4,  name: "辰 시 · Chen Hour", animal: "Dragon",  animalKo: "용",     range: "07:00 – 09:00" },
  { idx: 5,  name: "巳 시 · Si Hour",   animal: "Snake",   animalKo: "뱀",     range: "09:00 – 11:00" },
  { idx: 6,  name: "午 시 · Wu Hour",   animal: "Horse",   animalKo: "말",     range: "11:00 – 13:00" },
  { idx: 7,  name: "未 시 · Wei Hour",  animal: "Sheep",   animalKo: "양",     range: "13:00 – 15:00" },
  { idx: 8,  name: "申 시 · Shen Hour", animal: "Monkey",  animalKo: "원숭이",  range: "15:00 – 17:00" },
  { idx: 9,  name: "酉 시 · You Hour",  animal: "Rooster", animalKo: "닭",     range: "17:00 – 19:00" },
  { idx: 10, name: "戌 시 · Xu Hour",   animal: "Dog",     animalKo: "개",     range: "19:00 – 21:00" },
  { idx: 11, name: "亥 시 · Hai Hour",  animal: "Pig",     animalKo: "돼지",   range: "21:00 – 23:00" },
] as const;
```

### 4.4 주요 도시 timezone 데이터 (`src/lib/kst-data.ts`)

26개 큐레이션:

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
];
```

`gmt` label은 표준시 기준. 실제 변환은 `date-fns-tz`가 DST 자동 처리.

### 4.5 에러 처리

| 케이스 | 처리 |
|--------|------|
| 미래 날짜 (year > 2050) | Zod max(2050) → inline error |
| 1900 이전 | Zod min(1900) → inline error |
| 2월 30일 등 무효 날짜 | superRefine custom → inline error |
| timezone IANA 무효 | Select만 허용하므로 발생 X |
| 변환 함수 예외 | try/catch → "변환 실패, 다시 시도해주세요" + 콘솔 에러 |

---

## 5. 컴포넌트 API

### 5.1 `BirthForm` (`src/components/kst/birth-form.tsx`)

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { birthSchema } from "@/lib/kst-types";
import { POPULAR_TIMEZONES } from "@/lib/kst-data";
import type { BirthData } from "@/lib/kst-types";

type BirthFormProps = {
  onSubmit: (data: BirthData) => void;
  defaultTimezone?: string;
};

export function BirthForm({ onSubmit, defaultTimezone }: BirthFormProps) {
  const form = useForm({
    resolver: zodResolver(birthSchema),
    defaultValues: {
      year: undefined, month: undefined, day: undefined,
      hour: undefined, minute: undefined,
      timezone: defaultTimezone || "Asia/Seoul",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Date — Native HTML5 */}
        <FormField
          control={form.control}
          name="dateValue" // synthetic field
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min="1900-01-01" max="2050-12-31"
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    form.setValue("year", y);
                    form.setValue("month", m);
                    form.setValue("day", d);
                  }}
                />
              </FormControl>
              <FormMessage>{form.formState.errors.day?.message || form.formState.errors.year?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Time — Optional */}
        <FormField
          control={form.control}
          name="timeValue" // synthetic field
          render={() => (
            <FormItem>
              <FormLabel>Birth time <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Input
                  type="time"
                  onChange={(e) => {
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(":").map(Number);
                      form.setValue("hour", h);
                      form.setValue("minute", m);
                    } else {
                      form.setValue("hour", undefined);
                      form.setValue("minute", undefined);
                    }
                  }}
                />
              </FormControl>
              <FormDescription className="text-xs">Needed for your full saju (12지지 hour pillar)</FormDescription>
            </FormItem>
          )}
        />

        {/* Timezone */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Born in</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

**핵심:**
- Date/Time native HTML5는 form state에 직접 안 바인딩 — synthetic field로 onChange 시 year/month/day(/hour/minute)로 분해해서 form.setValue
- Timezone Select는 react-hook-form Controller 패턴
- Submit 시 zod 검증 통과한 BirthData가 onSubmit으로 전달
- 모든 라벨/에러는 시맨틱 토큰 사용 → 다크모드 자동

### 5.2 `KstResultModal` (`src/components/kst/kst-result-modal.tsx`)

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
        <div className="changsal-band absolute top-0 left-0 right-0 h-[14px] z-10"
             style={{ backgroundSize: "40px 14px" }} />

        <div className="px-6 pt-8 pb-6 space-y-4">
          {/* 원본 시각 */}
          <section>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">In your timezone</p>
            <p className="text-sm text-muted-foreground">
              {result.sourceLocal.dateLabel}
              {result.sourceLocal.timeLabel && ` · ${result.sourceLocal.timeLabel}`}
              {` · ${result.sourceLocal.timezone.city} (${result.sourceLocal.timezone.gmt})`}
            </p>
          </section>

          <div className="text-center text-accent font-calli text-3xl select-none">↓</div>

          {/* KST 결과 */}
          <section className="text-center space-y-1">
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">In Korea (KST)</p>
            <p className="font-serif font-bold text-2xl text-foreground">{result.kst.dateLabelKo}</p>
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
        <div className="changsal-band absolute bottom-0 left-0 right-0 h-[14px] z-10"
             style={{ backgroundSize: "40px 14px" }} />
      </DialogContent>
    </Dialog>
  );
}
```

**핵심:**
- `hanji-paper` + 상하 창살로 디자인 시스템 연속성 (모드 자동 적응)
- 모든 색·배경 시맨틱 토큰 (text-primary, bg-accent/10, border-border 등)
- `result.jiziHour`가 null이면 hint placeholder
- Saju CTA는 disabled, Coming Soon 배지로 향후 활성화 예고
- DialogContent에 `max-h-[90vh] overflow-y-auto`로 모바일 안전

### 5.3 페이지 통합 (`src/app/page.tsx`)

기존 hero card 자리를 폼 + 모달로 교체:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
      <div className="changsal-band absolute top-0 left-0 right-0 z-40" />

      <div className="absolute top-12 right-6 z-50">
        <ThemeToggle />
      </div>

      <span
        className="font-calli ink-bleed absolute right-[2%] bottom-[2%] sm:-right-[3%] sm:-bottom-[10%] text-[8rem] sm:text-[14rem] md:text-[22rem] lg:text-[28rem] xl:text-[32rem] leading-none text-accent/55 dark:text-accent/35 select-none pointer-events-none z-0"
        aria-hidden="true"
      >
        ㅎ
      </span>

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
              <CardDescription>Korea uses KST · we'll convert for you</CardDescription>
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

      <KstResultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEdit={() => setModalOpen(false)}
        result={result}
      />

      <div className="changsal-band absolute bottom-0 left-0 right-0 z-40" />
    </main>
  );
}
```

**핵심 변경 (vs 기존 page.tsx):**
- `"use client"` 추가 (useState/useEffect 필요)
- 기존 카드 내용 ("Your Inyeon Awaits" + 설명 + 두 버튼) 제거 → 폼으로 교체
- 헤더: "Your Inyeon Awaits" → "When were you born?" (직접적 액션 유도)
- CardDescription 추가 (shadcn에 있으면 사용, 없으면 add)
- 모달은 main과 같은 레벨에 배치
- 한지/창살/ㅎ/토글 기존 디자인 그대로 보존

---

## 6. 도메인 로직 (`src/lib/kst-converter.ts`)

### 6.1 메인 변환 함수

```ts
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { ko, enUS } from "date-fns/locale";
import { POPULAR_TIMEZONES, JIZI_HOURS } from "./kst-data";
import type { BirthData, KSTResult, JiziHour } from "./kst-types";

export function convertToKST(input: BirthData): KSTResult {
  const hasTime = input.hour !== undefined && input.minute !== undefined;

  // 1) Source naive datetime string → UTC Date
  const naiveStr = hasTime
    ? `${input.year}-${pad(input.month)}-${pad(input.day)}T${pad(input.hour!)}:${pad(input.minute!)}:00`
    : `${input.year}-${pad(input.month)}-${pad(input.day)}T12:00:00`; // 시간 없으면 정오 가정
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
  const sourceTz = POPULAR_TIMEZONES.find(t => t.iana === input.timezone) ?? {
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
      weekdayKo, weekdayEn,
    },
    jiziHour,
    funFact: buildFunFact(input, kstH, sourceTz.city, utcDate),
  };
}
```

### 6.2 12지지 매핑

```ts
export function getJiziHour(kstHour: number): JiziHour {
  // 자시는 23-1 wraparound. (hour + 1) / 2를 12로 mod
  const idx = Math.floor(((kstHour + 1) % 24) / 2);
  return JIZI_HOURS[idx];
}
```

**경계 케이스:**
- hour=23 → (24 % 24)/2 = 0 → 자시 (Rat)
- hour=0 → (1 % 24)/2 = 0 → 자시 (Rat)
- hour=1 → (2 % 24)/2 = 1 → 축시 (Ox)
- hour=4 → (5 % 24)/2 = 2 → 인시 (Tiger)
- hour=22 → (23 % 24)/2 = 11 → 해시 (Pig)

### 6.3 Fun fact 생성

```ts
function buildFunFact(input: BirthData, kstHour: number | null, sourceCity: string, utcDate: Date): string {
  const sourceDay = input.day;
  const kstDay = parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "d"), 10);
  const sourceMonth = input.month;
  const kstMonth = parseInt(formatInTimeZone(utcDate, "Asia/Seoul", "M"), 10);

  // 날짜 차이 (월 경계 고려)
  let dayDelta = 0;
  if (kstMonth === sourceMonth) dayDelta = kstDay - sourceDay;
  else if (kstMonth > sourceMonth || (kstMonth === 1 && sourceMonth === 12)) dayDelta = 1;
  else dayDelta = -1;

  if (dayDelta === 1) {
    const tod = kstHour !== null ? koreaTimeOfDay(kstHour) : "morning";
    return `You were born the next day in Korea — already ${tod} when you arrived.`;
  }
  if (dayDelta === -1) {
    const tod = kstHour !== null ? koreaTimeOfDay(kstHour) : "evening";
    return `You were born the previous day in Korea — still ${tod} from yesterday.`;
  }

  // Same day, time variation
  if (kstHour !== null) {
    return `Same day in Korea, around ${koreaTimeOfDay(kstHour)}.`;
  }

  return `Korea (KST) and ${sourceCity} share the same day for your birth.`;
}

function koreaTimeOfDay(hour: number): string {
  if (hour < 5)  return "새벽 (dawn)";
  if (hour < 9)  return "아침 (morning)";
  if (hour < 12) return "오전 (late morning)";
  if (hour < 14) return "정오 (midday)";
  if (hour < 18) return "오후 (afternoon)";
  if (hour < 21) return "저녁 (evening)";
  return "밤 (night)";
}
```

### 6.4 보조 함수

```ts
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
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: iana, timeZoneName: "shortOffset" }).formatToParts(atDate);
  return parts.find(p => p.type === "timeZoneName")?.value ?? "GMT?";
}
```

---

## 7. 테스트 — vitest + TDD

### 7.1 설치

```bash
npm install -D vitest @vitest/ui jsdom
```

`package.json` scripts에 추가:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`vitest.config.ts` 신규:
```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### 7.2 테스트 케이스 (`src/lib/kst-converter.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { convertToKST, getJiziHour } from "./kst-converter";

describe("convertToKST", () => {
  it("NY 1999-03-15 14:30 EST → Seoul 1999-03-16 04:30", () => {
    const r = convertToKST({ year: 1999, month: 3, day: 15, hour: 14, minute: 30, timezone: "America/New_York" });
    expect(r.kst).toMatchObject({ year: 1999, month: 3, day: 16, hour: 4, minute: 30 });
    expect(r.jiziHour?.animal).toBe("Tiger");
  });

  it("Tokyo 2000-06-01 14:00 JST → Seoul 2000-06-01 14:00 (same offset)", () => {
    const r = convertToKST({ year: 2000, month: 6, day: 1, hour: 14, minute: 0, timezone: "Asia/Tokyo" });
    expect(r.kst).toMatchObject({ year: 2000, month: 6, day: 1, hour: 14, minute: 0 });
    expect(r.jiziHour?.animal).toBe("Sheep");
  });

  it("DST 적용: NY 2024-03-10 14:30 EDT → Seoul 2024-03-11 03:30", () => {
    const r = convertToKST({ year: 2024, month: 3, day: 10, hour: 14, minute: 30, timezone: "America/New_York" });
    expect(r.kst).toMatchObject({ year: 2024, month: 3, day: 11, hour: 3, minute: 30 });
  });

  it("time 미입력 → jiziHour null, 날짜만 변환", () => {
    const r = convertToKST({ year: 1999, month: 3, day: 15, timezone: "America/New_York" });
    expect(r.kst.hour).toBeNull();
    expect(r.jiziHour).toBeNull();
  });

  it("Seoul 자체 입력 → 변환 없음", () => {
    const r = convertToKST({ year: 1990, month: 5, day: 15, hour: 10, minute: 0, timezone: "Asia/Seoul" });
    expect(r.kst).toMatchObject({ year: 1990, month: 5, day: 15, hour: 10, minute: 0 });
    expect(r.kst.dateLabelKo).toBe("1990년 5월 15일");
  });
});

describe("getJiziHour", () => {
  test.each([
    [0, "Rat"], [1, "Ox"], [2, "Ox"], [3, "Tiger"], [4, "Tiger"],
    [11, "Horse"], [12, "Horse"], [13, "Sheep"],
    [22, "Pig"], [23, "Rat"],
  ])("hour %i → %s", (hour, animal) => {
    expect(getJiziHour(hour).animal).toBe(animal);
  });
});
```

---

## 8. 검증

### 8.1 자동 (vitest)

```bash
npm test
```

전 테스트 통과 (10+ cases).

### 8.2 수동 (브라우저)

`npm run dev` 후 `localhost:3000`:

1. 폼: timezone이 browser auto-detected (예: "Asia/Seoul (GMT+9)")
2. 1999-03-15 / 14:30 / "New York" 선택 → Submit
3. Modal: "1999년 3월 16일 / 04:30 AM / 화요일 · Tuesday" + "寅 시 · Yin Hour / Tiger · 호랑이" + fun fact + Saju CTA(disabled, Coming Soon)
4. "Edit my info" → 모달 닫힘, 폼 값 보존
5. time 빈값으로 submit → 12지지 자리에 hint "Provide a birth time..."
6. invalid 입력 (2024/02/30) → "2024년 2월은 29일까지" inline error
7. 1899 또는 2051 → year 범위 inline error
8. Dark mode 토글 → 폼/모달 cosmic 톤 자동 적응
9. 모바일 viewport → 폼/모달 한 화면, modal `max-h-90vh overflow-y-auto`로 안전
10. `npm run build` / `npm run lint` / `npm test` 모두 통과

### 8.3 회귀 확인

- 기존 디자인 시스템(한지 톤·창살·ㅎ·테마 토글) 영향 없음
- 기존 "사 주" 헤더 + Yeon Sung 폰트 유지
- shadcn Button/Card 정상

---

## 9. 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| `date-fns-tz` × Next.js 16 / React 19 비호환 | 빌드 실패 | 설치 후 즉시 빌드 검증. 비호환 시 native Intl.DateTimeFormat으로 직접 구현 (~50 lines) |
| `<input type="date">` 브라우저별 UX 차이 | 미세한 시각 불일치 | 모든 모던 브라우저 작동 보장. 폴리필 안 함 — native가 best |
| 사용자가 dropdown에서 자기 도시 못 찾음 | UX 마찰 | "Auto-detected" 기본값 + 26개 큐레이션으로 95% 커버. 못 찾으면 같은 GMT의 인근 도시 안내 |
| 12지지 wraparound (23시 자시) 로직 버그 | 잘못된 동물 표시 | TDD로 hour=23, 0, 1, 22 boundary 테스트 |
| Modal이 320px 폰에서 잘림 | 콘텐츠 안 보임 | DialogContent에 `max-w-md max-h-[90vh] overflow-y-auto` |
| react-hook-form + zod 검증 깨짐 | invalid 데이터 제출 | superRefine cross-field 검증 + 수동 e2e |
| 'use client' 도입으로 metadata 영향? | 정적 메타데이터 누락 | Next 16 App Router는 metadata export가 client/server 무관 — 영향 없음. 빌드 확인 |
| browser timezone 감지 실패 | dropdown 안 열림 | `Intl.DateTimeFormat().resolvedOptions().timeZone`은 광범위 지원. fallback "Asia/Seoul" |
| date-fns의 ko locale import 누락 | weekdayKo 영문으로 표시 | `import { ko, enUS } from "date-fns/locale"` 명시 |
| Synthetic field (dateValue, timeValue) 미사용 form state 경고 | 콘솔 노이즈 | form.setValue로 실제 필드 채우므로 synthetic은 unregister 가능, 단순화 위해 그대로 유지 |

---

## 10. 마이그레이션 / 롤백

- **마이그레이션:** 없음 (신규 기능, 기존 데이터 영향 X)
- **롤백:** `git revert` 한 번에 복원. 신규 의존성(date-fns, date-fns-tz, vitest) 제거, 신규 파일 4개 삭제, page.tsx 이전 hero card로 복귀

---

## 11. 후속 작업 (이번 spec 범위 외)

- **실제 사주 계산** — manseryeok API 활용해 4 기둥(년·월·일·시) 표시. 별도 spec.
- **결과 저장 + 사용자 가입** — Supabase 연동, 출생 데이터 저장. 별도 spec.
- **결과 공유** — KST 결과를 URL parameter로 공유 가능 (예: `/?birth=...`)
- **언어 전환 UI** — next-intl 활용한 한국어 모드 (UI 라벨 한글화)
- **음력 변환** — lunar-javascript로 양력↔음력 토글 (사주 입력에 음력 옵션)
- **결과 카드 v2** — 창호지 + 창살 프레임 사주 결과 카드 (브레인스토밍 단계)
- **histroy / 즐겨찾기** — 여러 사람 변환 결과 저장

---

## 12. 영향받는 파일

| 파일 | 변경 종류 |
|------|----------|
| `package.json` | `date-fns`, `date-fns-tz`, `vitest`, `@vitest/ui`, `jsdom` 추가, test scripts |
| `vitest.config.ts` | 신규 |
| `src/lib/kst-types.ts` | 신규 (타입 + Zod schema) |
| `src/lib/kst-data.ts` | 신규 (POPULAR_TIMEZONES, JIZI_HOURS) |
| `src/lib/kst-converter.ts` | 신규 (convertToKST, getJiziHour, buildFunFact, helpers) |
| `src/lib/kst-converter.test.ts` | 신규 (vitest 테스트) |
| `src/components/kst/birth-form.tsx` | 신규 |
| `src/components/kst/kst-result-modal.tsx` | 신규 |
| `src/app/page.tsx` | 수정 (use client + 폼/모달 통합) |
| `src/components/ui/form.tsx` | shadcn add (없으면) |
| `src/components/ui/select.tsx` | shadcn add (없으면) |

`src/components/ui/dialog.tsx`, `input.tsx`, `label.tsx`, `button.tsx`, `card.tsx`는 이미 존재.
