import { useState } from "react";
import { BirthForm } from "../components/BirthForm";
import { PillarsGrid } from "../components/PillarsGrid";
import { WuxingBalance } from "../components/WuxingBalance";
import { FortuneCards } from "../components/FortuneCards";
import { birthToSaju, dateToLuck } from "../lib/saju";
import { dayMasterInfo, elementLabel } from "../lib/saju-display";
import { dayMasterKeywordKo } from "../content/ko/labels";
import { calcFortune } from "../lib/fortune";
import type { BirthData } from "../lib/kst-types";
import type { UserSaju } from "../lib/saju-types";

export function MySajuScreen({
  saju,
  onCalc,
}: {
  saju: UserSaju | null;
  onCalc: (s: UserSaju) => void;
}) {
  const [local, setLocal] = useState<UserSaju | null>(saju);
  const cur = local ?? saju;

  function handle(b: BirthData) {
    const s = birthToSaju({ ...b, timezone: "Asia/Seoul" });
    setLocal(s);
    onCalc(s);
  }

  if (!cur) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">내 사주</h2>
        <p className="text-sm text-gray-600">
          생일을 넣으면 사주 네 기둥과 오늘의 운세를 볼 수 있어요.
        </p>
        <BirthForm onSubmit={handle} />
      </section>
    );
  }

  const dm = dayMasterInfo(cur.dayMaster);
  const fortune = calcFortune(cur, dateToLuck(new Date()), "ko");

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">내 사주</h2>
        <p className="text-sm">
          일간{" "}
          <b className="text-[var(--color-jindallae)]">{cur.dayMaster}</b> (
          {elementLabel(dm.element, "ko")}) — {dayMasterKeywordKo(cur.dayMaster)}
        </p>
      </div>
      <PillarsGrid saju={cur} />
      <WuxingBalance saju={cur} />
      <FortuneCards cards={fortune} />
      <button
        onClick={() => setLocal(null)}
        className="text-sm text-gray-500 underline"
      >
        생일 다시 입력
      </button>
      <p className="text-center text-xs text-gray-400">For entertainment 🌙</p>
    </section>
  );
}
