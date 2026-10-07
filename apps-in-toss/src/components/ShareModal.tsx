import { useRef, useState, type ReactNode } from "react";
import { saveShareCard, type SaveResult } from "../lib/share";
import { logShareClicked, logShareSaved } from "../lib/analytics";
import { shareWithReward } from "../lib/share-reward";
import { requestReviewAt } from "../lib/review";

const MESSAGE: Record<SaveResult, string> = {
  saved: "사진첩에 저장했어요 ✨",
  downloaded: "이미지를 저장했어요 ✨",
  denied: "사진 접근을 허용하면 카드를 저장할 수 있어요.",
  failed: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

/**
 * 공유 카드 미리보기 + 저장. 본문이 곧 캡처 대상이라 미리보기와 저장 이미지가 같다.
 * 네이티브 alert 대신 인페이지 상태 메시지를 쓴다(심사 규칙).
 *
 * 저장에 성공하면 1차 버튼이 '친구에게 보내기'로 바뀐다. 전에는 저장하고 나면
 * 갈 곳이 없어 모달이 데드엔드였다 — 카드를 저장한 사람은 공유 의도가 이미
 * 확인된 사람인데 그 자리에서 아무것도 이어지지 않았다.
 */
export function ShareModal({
  filename,
  onClose,
  children,
}: {
  filename: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    setMessage(null);
    const result = await saveShareCard(cardRef.current, filename);
    setMessage(MESSAGE[result]);
    // 모달을 연 것이 아니라 **저장에 성공한** 경우만 확산 신호로 센다.
    if (result === "saved" || result === "downloaded") {
      logShareSaved(filename, result);
      setSaved(true);
    }
    setSaving(false);
  }

  async function send() {
    if (sending) return;
    setSending(true);
    logShareClicked(filename);
    try {
      const r = await shareWithReward("내 사주 봤어, 너도 볼래? 🔮");
      if (r.rewarded > 0) {
        setMessage(`공유 고마워요! 토스포인트 ${r.rewarded}원을 지급했어요 🎉`);
      }
    } finally {
      setSending(false);
    }
  }

  /**
   * 저장까지 끝낸 사람에게만 리뷰를 청한다.
   *
   * 저장 **직후**가 아니라 모달을 **닫을 때** 부른다 — 저장 직후에 띄우면
   * 바로 아래 '친구에게 보내기' 를 누르려는 순간에 시스템 시트가 끼어들어
   * 두 다이얼로그가 겹친다. 빈도 제한은 `requestReviewAt` 이 관리한다.
   */
  function close() {
    if (saved) void requestReviewAt("share_saved");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/50 p-4">
      <div className="m-auto flex w-full max-w-sm flex-col items-center gap-3 py-6">
        {/* 미리보기는 카드를 축소해 보여주고, 캡처는 원본 크기(360×640)로 한다 */}
        <div className="overflow-hidden rounded-xl shadow-2xl">
          <div ref={cardRef}>{children}</div>
        </div>
        {message && (
          <p
            role="status"
            className="rounded-md bg-white/90 px-3 py-2 text-center text-sm"
          >
            {message}
          </p>
        )}
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={close}
            className="flex-1 rounded-lg bg-white/90 px-4 py-3 font-bold text-gray-700"
          >
            닫기
          </button>
          {saved ? (
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending}
              className="flex-[2] rounded-lg bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {sending ? "공유 창을 여는 중…" : "친구에게 보내기 🔮"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex-[2] rounded-lg bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {saving ? "저장하는 중…" : "이미지로 저장하기 ✨"}
            </button>
          )}
        </div>
        {/* 저장했어도 다시 저장할 수 있게 둔다(다른 카드로 바꿔 올리는 경우) */}
        {saved && (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="text-sm text-white/80 underline disabled:opacity-50"
          >
            {saving ? "저장하는 중…" : "다시 저장하기"}
          </button>
        )}
      </div>
    </div>
  );
}
