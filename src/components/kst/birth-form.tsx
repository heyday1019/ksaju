"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
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

// birthSchema는 .superRefine를 거쳐 ZodEffects가 되므로 z.input을 써서 폼 입력 타입과 일치
type FormValues = z.input<typeof birthSchema>;

// shadcn FormField는 ControllerProps default(FieldValues) generic을 사용해
// 우리 FormValues로의 추론을 보존하지 않음. 각 FormField에서
// `form.control as unknown as Control<FieldValues>`로 캐스트 — 안전성 우회가
// 아니라 shadcn 디자인의 구조적 노이즈 (I3 검토 결과).

// IANA timezone → "GMT±N" 라벨 (브라우저 감지 tz가 POPULAR_TIMEZONES에 없을 때 사용)
function gmtLabelFor(iana: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "local";
  } catch {
    return "local";
  }
}

export function BirthForm({ onSubmit, defaultTimezone }: BirthFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(birthSchema),
    defaultValues: {
      timezone: defaultTimezone ?? "Asia/Seoul",
    },
  });

  // defaultTimezone이 mount 후 결정되면 폼에 반영 (parent의 Intl.DateTimeFormat 감지 후 도착)
  useEffect(() => {
    if (defaultTimezone && defaultTimezone !== form.getValues("timezone")) {
      form.setValue("timezone", defaultTimezone);
    }
  }, [defaultTimezone, form]);

  // M1: 브라우저 감지 tz가 큐레이션 리스트에 없으면 (예: Asia/Pyongyang, America/Indiana/...)
  // 맨 위에 합성 SelectItem을 추가해 Select가 빈 값으로 보이지 않게 함.
  const timezoneOptions = useMemo(() => {
    if (
      !defaultTimezone ||
      POPULAR_TIMEZONES.some((tz) => tz.iana === defaultTimezone)
    ) {
      return POPULAR_TIMEZONES;
    }
    const city = defaultTimezone.split("/").pop()!.replace(/_/g, " ");
    return [
      {
        city: `${city} (detected)`,
        iana: defaultTimezone,
        gmt: gmtLabelFor(defaultTimezone),
      },
      ...POPULAR_TIMEZONES,
    ];
  }, [defaultTimezone]);

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
        {/* I2: date 입력을 FormField로 wrap — name='year'에 앵커해서 FormLabel의
            error 스타일링이 day/month/year 에러 발생 시 작동하게. 실제 값은
            handleDateChange가 분해해서 year/month/day를 setValue. */}
        <FormField
          control={form.control as unknown as Control<FieldValues>}
          name="year"
          render={() => (
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
          )}
        />

        {/* I2: time 입력을 FormField로 wrap — name='hour'에 앵커. native input
            제약상 에러 가능성은 낮으나 일관성과 FormLabel 시맨틱을 위해 정리. */}
        <FormField
          control={form.control as unknown as Control<FieldValues>}
          name="hour"
          render={() => (
            <FormItem>
              <FormLabel>
                Birth time{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
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
              <FormMessage>
                {form.formState.errors.hour?.message ||
                  form.formState.errors.minute?.message}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control as unknown as Control<FieldValues>}
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
                  {timezoneOptions.map((tz) => (
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
