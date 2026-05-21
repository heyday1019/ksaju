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
