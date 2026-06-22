import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { birthSchema, type BirthData } from "../lib/kst-types";

// 빈 입력은 undefined로(년/월/일은 zod required, 시/분은 optional).
const num = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

export function BirthForm({ onSubmit }: { onSubmit: (b: BirthData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(birthSchema),
    defaultValues: { timezone: "Asia/Seoul" },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v as unknown as BirthData))}
      className="flex flex-col gap-3"
    >
      <input type="hidden" {...register("timezone")} />

      <label className="text-sm font-medium">생년월일</label>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="년"
          {...register("year", { setValueAs: num })}
          className="w-24 rounded-md border border-gray-300 px-2 py-2"
        />
        <input
          type="number"
          placeholder="월"
          {...register("month", { setValueAs: num })}
          className="w-16 rounded-md border border-gray-300 px-2 py-2"
        />
        <input
          type="number"
          placeholder="일"
          {...register("day", { setValueAs: num })}
          className="w-16 rounded-md border border-gray-300 px-2 py-2"
        />
      </div>

      <label className="text-sm font-medium">
        태어난 시각 <span className="text-gray-400">(모르면 비워두세요)</span>
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="시"
          {...register("hour", { setValueAs: num })}
          className="w-16 rounded-md border border-gray-300 px-2 py-2"
        />
        <input
          type="number"
          placeholder="분"
          {...register("minute", { setValueAs: num })}
          className="w-16 rounded-md border border-gray-300 px-2 py-2"
        />
      </div>

      {(errors.year || errors.month || errors.day) && (
        <p className="text-xs text-[var(--color-jindallae)]">
          생년월일을 정확히 입력해 주세요.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        내 사주 보기
      </button>
    </form>
  );
}
