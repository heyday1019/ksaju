import { useEffect, useRef, useState } from "react";
import { IdolPicker } from "../components/IdolPicker";
import { CompatResult, type CompatOther } from "../components/CompatResult";
import { ShareCard } from "../components/ShareCard";
import { ShareFooter } from "../components/ShareFooter";
import { ShareModal } from "../components/ShareModal";
import { BirthForm } from "../components/BirthForm";
import { normalizeIdolSaju } from "../lib/compatibility";
import { toCompatPillars } from "../lib/saju";
import { logCompatResult } from "../lib/analytics";
import type { BirthData } from "../lib/kst-types";
import type { Profile } from "../state/profiles";

type Mode = "idol" | "person";

export function CompatScreen({
  profiles,
  me,
  onNeedSaju,
}: {
  profiles: Profile[];
  me: Profile | null;
  onNeedSaju: () => void;
}) {
  const [mode, setMode] = useState<Mode>("idol");
  const [other, setOther] = useState<CompatOther | null>(null);
  const [sharing, setSharing] = useState(false);

  // 상대를 고르고 궁합 결과가 실제로 그려진 순간만 기록한다(탭 진입은 제외).
  // 훅 순서를 지키려고 아래 early return 보다 위에 둔다.
  const loggedOther = useRef<string | null>(null);
  useEffect(() => {
    if (!other) {
      loggedOther.current = null;
      return;
    }
    const key = `${mode}:${other.name}`;
    if (loggedOther.current === key) return;
    loggedOther.current = key;
    logCompatResult(mode);
  }, [other, mode]);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">궁합</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button
          type="button"
          onClick={onNeedSaju}
          className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white"
        >
          내 사주 입력하러 가기
        </button>
      </section>
    );
  }

  const mePillars = toCompatPillars(me.saju);
  // 나를 뺀 저장된 사람들 — 다시 입력하지 않고 바로 궁합을 볼 수 있다
  const others = profiles.filter((p) => p.id !== me.id);

  async function pickBirth(birth: BirthData, name: string) {
    const { birthToSaju } = await import("../lib/saju");
    const saju = birthToSaju(birth);
    setOther({ name: name || "상대", pillars: toCompatPillars(saju) });
  }

  if (other) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">궁합 결과</h2>
        <ShareCard>
          <CompatResult meName={me.name} mePillars={mePillars} other={other} />
          <ShareFooter />
        </ShareCard>
        <button
          type="button"
          onClick={() => setSharing(true)}
          className="rounded-lg bg-[var(--color-jindallae)] px-4 py-3.5 font-bold text-white"
        >
          이미지로 저장하기 ✨
        </button>
        <button
          type="button"
          onClick={() => setOther(null)}
          className="self-center text-sm text-gray-500 underline"
        >
          다른 궁합 보기
        </button>
        {sharing && (
          <ShareModal filename="ksaju-compat.png" onClose={() => setSharing(false)}>
            <ShareCard>
              <CompatResult
                meName={me.name}
                mePillars={mePillars}
                other={other}
              />
              <ShareFooter />
            </ShareCard>
          </ShareModal>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">궁합</h2>

      <div className="flex gap-1 rounded-full border border-black/10 bg-white/70 p-1">
        {(
          [
            ["idol", "K-pop 최애"],
            ["person", "친구 · 연인"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-current={mode === m ? "true" : undefined}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm transition-colors ${
              mode === m
                ? "bg-[var(--color-jindallae)] font-bold text-white"
                : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "idol" ? (
        <IdolPicker
          onSelect={(idol) =>
            setOther({
              name: idol.name,
              pillars: normalizeIdolSaju(idol.saju),
            })
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {others.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">
                저장된 사람
              </h3>
              <div className="flex flex-wrap gap-2">
                {others.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setOther({
                        name: p.name,
                        pillars: toCompatPillars(p.saju),
                      })
                    }
                    className="rounded-full border border-black/10 bg-white/70 px-3.5 py-1.5 text-sm"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-[0.15em] text-gray-400">
              생일로 보기
            </h3>
            <BirthForm
              withName
              submitLabel="궁합 보기"
              busyLabel="궁합을 보는 중…"
              onSubmit={pickBirth}
            />
          </div>
        </div>
      )}
    </section>
  );
}
