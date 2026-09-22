import { useRef, useState, type ReactNode } from "react";
import { saveShareCard, type SaveResult } from "../lib/share";
import { logShareSaved } from "../lib/analytics";

const MESSAGE: Record<SaveResult, string> = {
  saved: "사진첩에 저장했어요 ✨",
  downloaded: "이미지를 저장했어요 ✨",
  denied: "사진 접근을 허용하면 카드를 저장할 수 있어요.",
  failed: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

/**
 * 공유 카드 미리보기 + 저장. 본문이 곧 캡처 대상이라 미리보기와 저장 이미지가 같다.
 * 네이티브 alert 대신 인페이지 상태 메시지를 쓴다(심사 규칙).
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
    }
    setSaving(false);
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
            onClick={onClose}
            className="flex-1 rounded-lg bg-white/90 px-4 py-3 font-bold text-gray-700"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-[2] rounded-lg bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {saving ? "저장하는 중…" : "이미지로 저장하기 ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}
