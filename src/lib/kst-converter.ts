import { JIZI_HOURS } from "./kst-data";
import type { JiziHour } from "./kst-types";

export function getJiziHour(kstHour: number): JiziHour {
  // 자시(子)는 23-01시 wraparound. (hour + 1) mod 24를 2로 나눈 floor가 인덱스.
  const idx = Math.floor(((kstHour + 1) % 24) / 2);
  return JIZI_HOURS[idx];
}

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
