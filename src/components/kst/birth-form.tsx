"use client";

import { useEffect } from "react";
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
import type { Control, FieldValues } from "react-hook-form";
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

  // defaultTimezone이 mount 후 결정되면 폼에 반영 (parent의 Intl.DateTimeFormat 감지 후 도착)
  useEffect(() => {
    if (defaultTimezone && defaultTimezone !== form.getValues("timezone")) {
      form.setValue("timezone", defaultTimezone);
    }
  }, [defaultTimezone, form]);

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
