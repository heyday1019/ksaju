import { useEffect, useRef, useState } from "react";
import {
  MISSION_AMOUNT,
  MISSION_LABEL,
  fetchUserHash,
  grantMessage,
  grantReward,
  hasClaimed,
  isTerminal,
  isTestMode,
  type Mission,
} from "../lib/promotion";
import { shareMiniApp } from "../lib/toss-share";

const MISSIONS: Mission[] = ["saju", "share"];

/**
 * 출시 기념 토스포인트 카드. '내 사주' 결과를 본 뒤에만 노출된다.
 *
 * 중복 방어 4겹: 버튼 disable / 뮤텍스(ref) / 1초 쿨다운 / hash 기준 원장.
 * 앞의 셋은 정상 사용자의 연타를 막고, 예산을 지키는 건 네 번째뿐이다.
 */
export function PromotionCard() {
  const [hash, setHash] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Record<Mission, boolean>>({
    saju: false,
    share: false,
  });
  const [busy, setBusy] = useState<Mission | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    void isTestMode().then(setTestMode);
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchUserHash().then((r) => {
      if (!alive || !r.ok) return;
      setHash(r.hash);
      setClaimed({
        saju: hasClaimed(r.hash, "saju"),
        share: hasClaimed(r.hash, "share"),
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  // 토스 앱 밖이거나 사용자 식별에 실패하면 지급이 불가능하므로 아예 감춘다.
  // (hash 없이 지급하면 중복 방어가 없는 채로 예산이 빠진다)
  if (!hash || closed) return null;

  async function claim(mission: Mission) {
    if (lock.current || busy) return;
    lock.current = true;
    setBusy(mission);
    setMessage(null);
    try {
      // 공유 미션은 실제로 공유 시트를 띄운 뒤에만 지급한다
      if (mission === "share" && !(await shareMiniApp("내 사주 보러 갈래? 🔮"))) {
        setMessage("공유를 완료하면 토스포인트를 드려요.");
        return;
      }
      const r = await grantReward(hash!, mission);
      if (r.ok) {
        setClaimed((c) => ({ ...c, [mission]: true }));
        setMessage(`토스포인트 ${MISSION_AMOUNT[mission]}원을 지급했어요 🎉`);
        return;
      }
      setMessage(grantMessage(r.code));
      if (r.code === "ALREADY_GRANTED") {
        setClaimed((c) => ({ ...c, [mission]: true }));
      } else if (isTerminal(r.code)) {
        setTimeout(() => setClosed(true), 2500);
      }
    } finally {
      setBusy(null);
      setTimeout(() => {
        lock.current = false;
      }, 1000);
    }
  }

  const allDone = MISSIONS.every((m) => claimed[m]);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-jindallae)]/25 bg-white/70 px-4 py-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--color-jindallae)]">
          출시 기념 이벤트
          {/* 테스트 코드로 호출 중임을 눈으로 확인할 수 있게 한다 —
              실기기에서 활성화할 때 실제 예산이 나가지 않았는지 알 길이 없었다 */}
          {testMode && (
            <span className="ml-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px] tracking-normal text-gray-500">
              테스트 모드
            </span>
          )}
        </p>
        <h3 className="mt-0.5 text-base font-bold">
          {allDone ? "참여해 주셔서 고마워요 🎉" : "토스포인트 최대 30원 드려요"}
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {MISSIONS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => claim(m)}
            disabled={claimed[m] || busy !== null}
            className={`flex items-center justify-between rounded-lg px-3.5 py-3 text-sm transition-colors ${
              claimed[m]
                ? "bg-black/5 text-gray-400"
                : "bg-[var(--color-jindallae)] font-bold text-white disabled:opacity-60"
            }`}
          >
            <span>{MISSION_LABEL[m]}</span>
            <span>
              {claimed[m]
                ? "받음"
                : busy === m
                  ? "지급 중…"
                  : `${MISSION_AMOUNT[m]}원 받기`}
            </span>
          </button>
        ))}
      </div>

      {message && (
        <p role="status" className="text-center text-sm">
          {message}
        </p>
      )}

      {/* 참여 전 필수 고지 */}
      <p className="text-[11px] leading-relaxed text-gray-400">
        토스포인트는 참여 즉시 지급되며 미션당 1인 1회만 받을 수 있어요. 예산이
        모두 소진되면 조기 종료될 수 있고, 부정 참여가 확인되면 지급이 제한돼요.
        본 프로모션은 사전 고지 없이 중단될 수 있습니다.
      </p>
    </section>
  );
}
