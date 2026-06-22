import { useState } from "react";
import { IdolPicker } from "../components/IdolPicker";
import { CompatResult } from "../components/CompatResult";
import type { Idol } from "../lib/idols";
import type { UserSaju } from "../lib/saju-types";

export function CompatScreen({
  me,
  onNeedSaju,
}: {
  me: UserSaju | null;
  onNeedSaju: () => void;
}) {
  const [idol, setIdol] = useState<Idol | null>(null);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">궁합</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button
          onClick={onNeedSaju}
          className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
        >
          내 사주 입력하러 가기
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">최애와 궁합</h2>
      {idol && <CompatResult me={me} idol={idol} />}
      {idol && (
        <button
          onClick={() => setIdol(null)}
          className="text-sm text-gray-500 underline"
        >
          다른 아이돌 보기
        </button>
      )}
      {!idol && <IdolPicker onSelect={setIdol} />}
    </section>
  );
}
