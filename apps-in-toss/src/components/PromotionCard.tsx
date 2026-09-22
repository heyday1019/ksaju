import { useEffect, useRef, useState } from "react";
import {
  MISSION_AMOUNT,
  dismissShare,
  fetchUserHash,
  grantMessage,
  grantReward,
  hasClaimed,
  isShareDismissed,
  isTerminal,
  isTestMode,
  type Mission,
} from "../lib/promotion";
import { shareMiniApp } from "../lib/toss-share";

/**
 * 출시 기념 토스포인트 카드. '내 사주' 결과를 본 뒤에만 노출된다.
 *
 * 중복 방어 4겹: 버튼 disable / 뮤텍스(ref) / 1초 쿨다운 / hash 기준 원장.
 * 앞의 셋은 정상 사용자의 연타를 막고, 예산을 지키는 건 네 번째뿐이다.
 *
 * 미션 줄은 서로 독립이다 — 하나를 받아도 다른 하나는 그대로 남는다.
 * 사주는 받은 뒤 '완료'로 남고, 공유는 받거나 넘기면 줄이 사라진다.
 */
export function PromotionCard() {
  const [hash, setHash] = useState<string | null>(null);
  const [sajuDone, setSajuDone] = useState(false);
  const [shareGone, setShareGone] = useState(false);
  const [busy, setBusy] = useState<Mission | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    void isTestMode().then(setTestMode);
  }, []);

  useEffect(() => {
    let alive = true;
    void fetchUserHash().then((r) => {
      if (!alive || !r.ok) return;
      const saju = hasClaimed(r.hash, "saju");
      const share = hasClaimed(r.hash, "share") || isShareDismissed(r.hash);
      // 이미 다 끝낸 사람에게는 처음부터 보이지 않는다
      if (saju && share) {
        setClosed(true);
        return;
      }
      setHash(r.hash);
      setSajuDone(saju);
      setShareGone(share);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 이 자리에서 마지막 미션을 끝냈으면 완료 문구를 잠깐 보여주고 카드를 접는다.
  // 다 끝낸 이벤트 배너가 계속 자리를 차지하지 않도록.
  useEffect(() => {
    if (!hydrated || !sajuDone || !shareGone) return;
    const t = setTimeout(() => setClosed(true), 2500);
    return () => clearTimeout(t);
  }, [hydrated, sajuDone, shareGone]);

  // 토스 앱 밖이거나 사용자 식별에 실패하면 지급이 불가능하므로 아예 감춘다.
  // (hash 없이 지급하면 중복 방어가 없는 채로 예산이 빠진다)
  if (!hash || closed) return null;

  async function run(mission: Mission, work: () => Promise<boolean>) {
    if (lock.current || busy) return;
    lock.current = true;
    setBusy(mission);
    setMessage(null);
    try {
      if (!(await work())) return;
      const r = await grantReward(hash!, mission);
      if (r.ok) {
        setMessage(`토스포인트 ${MISSION_AMOUNT[mission]}원을 지급했어요 🎉`);
        if (mission === "saju") setSajuDone(true);
        else setShareGone(true);
        return;
      }
      setMessage(grantMessage(r.code));
      if (r.code === "ALREADY_GRANTED") {
        if (mission === "saju") setSajuDone(true);
        else setShareGone(true);
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

  function skipShare() {
    dismissShare(hash!);
    setShareGone(true);
    setMessage(null);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-jindallae)]/25 bg-white/70 px-4 py-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--color-jindallae)]">
          출시 기념 이벤트
          {/* 테스트 코드로 호출 중임을 눈으로 확인할 수 있게 한다 */}
          {testMode && (
            <span className="ml-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[10px] tracking-normal text-gray-500">
              테스트 모드
            </span>
          )}
        </p>
        <h3 className="mt-0.5 text-base font-bold">
          {sajuDone && shareGone
            ? "참여해 주셔서 고마워요 🎉"
            : "토스포인트 최대 30원 드려요"}
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {/* 사주: 받은 뒤에도 '완료'로 남는다 */}
        <button
          type="button"
          onClick={() => void run("saju", async () => true)}
          disabled={sajuDone || busy !== null}
          className={`flex items-center justify-between rounded-lg px-3.5 py-3 text-sm transition-colors ${
            sajuDone
              ? "bg-black/5 text-gray-400"
              : "bg-[var(--color-jindallae)] font-bold text-white disabled:opacity-60"
          }`}
        >
          <span>내 사주 확인하기</span>
          <span>
            {sajuDone
              ? "완료"
              : busy === "saju"
                ? "지급 중…"
                : `${MISSION_AMOUNT.saju}원 받기`}
          </span>
        </button>

        {/* 공유: 하거나 넘기면 줄이 사라진다 */}
        {!shareGone && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 text-sm">
              <span>친구에게 공유하기</span>
              <span className="text-gray-500">{MISSION_AMOUNT.share}원</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={skipShare}
                disabled={busy !== null}
                className="flex-1 rounded-lg bg-black/5 px-3 py-2.5 text-sm text-gray-500 disabled:opacity-60"
              >
                안 할래요
              </button>
              <button
                type="button"
                onClick={() =>
                  void run("share", async () => {
                    if (await shareMiniApp("내 사주 보러 갈래? 🔮")) return true;
                    setMessage("공유를 완료하면 토스포인트를 드려요.");
                    return false;
                  })
                }
                disabled={busy !== null}
                className="flex-[2] rounded-lg bg-[var(--color-jindallae)] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy === "share" ? "지급 중…" : "친구 공유하기"}
              </button>
            </div>
          </div>
        )}
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
