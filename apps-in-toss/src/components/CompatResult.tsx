import type { Idol } from "../lib/idols";
import type { UserSaju } from "../lib/saju-types";
import { calcCompatibility, normalizeIdolSaju } from "../lib/compatibility";
import { toCompatPillars } from "../lib/saju";
import { getReading } from "../lib/reading";
import { compatLabelKo } from "../content/ko/labels";

export function CompatResult({ me, idol }: { me: UserSaju; idol: Idol }) {
  const mePillars = toCompatPillars(me);
  const idolPillars = normalizeIdolSaju(idol.saju);
  const r = calcCompatibility(mePillars, idolPillars);
  const label = compatLabelKo(mePillars.day[0], idolPillars.day[0]);
  const reading = getReading(mePillars, idolPillars, r.score, "ko");

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4 text-center">
      <div className="text-sm text-gray-500">나 ✕ {idol.name}</div>
      <div className="text-4xl font-bold text-[var(--color-jindallae)]">
        {r.score}점
      </div>
      <div className="font-bold">{label}</div>
      <p className="text-sm">{reading}</p>
      <p className="text-xs text-gray-400">For entertainment 🌙</p>
    </div>
  );
}
