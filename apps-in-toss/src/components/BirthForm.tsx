import { useId, useState } from "react";
import type { BirthData } from "../lib/kst-types";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1930 + 1 }, (_, i) => THIS_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** 고른 연·월의 실제 일수. 미선택이면 31일까지 열어둔다. */
function daysIn(year: string, month: string): number[] {
  const y = Number(year) || 2000; // 윤년 판단 전 기본값(2000은 윤년이라 29일 허용)
  const m = Number(month);
  const last = m ? new Date(y, m, 0).getDate() : 31;
  return Array.from({ length: last }, (_, i) => i + 1);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {/* hint 는 label 밖에 둔다 — 안에 넣으면 접근성 이름에 섞여 라벨로 못 찾는다 */}
      <div className="flex items-baseline gap-1 text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {hint && <span className="text-gray-400">{hint}</span>}
      </div>
      {children(id)}
    </div>
  );
}

const SELECT =
  "w-full appearance-none rounded-lg border border-black/10 bg-white px-3 py-3 text-base";

export function BirthForm({
  onSubmit,
  withName = false,
  defaultName = "",
  submitLabel = "내 사주 보기",
  busyLabel = "사주를 뽑는 중…",
}: {
  onSubmit: (b: BirthData, name: string) => void | Promise<void>;
  /** 프로필(나·친구·연인)을 만들 때 이름 칸을 함께 받는다. */
  withName?: boolean;
  defaultName?: string;
  submitLabel?: string;
  busyLabel?: string;
}) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);

  const days = daysIn(year, month);
  // 31일을 고른 뒤 2월로 바꾸는 식의 조합을 막는다.
  const dayValue = days.includes(Number(day)) ? day : "";
  const ready = year !== "" && month !== "" && dayValue !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onSubmit(
        {
          year: Number(year),
          month: Number(month),
          day: Number(dayValue),
          ...(hour === "" ? {} : { hour: Number(hour), minute: 0 }),
          timezone: "Asia/Seoul",
        },
        name.trim(),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {withName && (
        <Field label="이름" hint="나중에 알아보기 쉽게">
          {(id) => (
            <input
              id={id}
              type="text"
              maxLength={12}
              placeholder="예: 나, 민지"
              className={SELECT}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Field label="태어난 해">
          {(id) => (
            <select
              id={id}
              className={SELECT}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">년</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="태어난 달">
          {(id) => (
            <select
              id={id}
              className={SELECT}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">월</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="태어난 날">
          {(id) => (
            <select
              id={id}
              className={SELECT}
              value={dayValue}
              onChange={(e) => setDay(e.target.value)}
            >
              <option value="">일</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label="태어난 시각" hint="모르면 그대로 두세요">
        {(id) => (
          <select
            id={id}
            className={SELECT}
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            <option value="">모름</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {`${String(h).padStart(2, "0")}시`}
              </option>
            ))}
          </select>
        )}
      </Field>

      <button
        type="submit"
        disabled={!ready || busy}
        className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3.5 font-bold text-white transition-opacity disabled:opacity-40"
      >
        {busy ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
