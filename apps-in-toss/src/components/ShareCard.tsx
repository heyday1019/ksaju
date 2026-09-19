import type { ReactNode } from "react";
import { ChangsalBand } from "./Chrome";

/**
 * 9:16 (360×640) 한지 공유 카드 래퍼. export 캡처 대상이라
 * 미리보기와 저장 이미지가 같아야 한다 — 스타일을 자기 안에 모두 갖는다.
 */
export function ShareCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ width: 360, height: 640 }}
      className="hanji-paper relative flex flex-col justify-between overflow-hidden"
    >
      <ChangsalBand />
      <div className="flex flex-1 flex-col justify-center px-6 py-4">
        {children}
      </div>
      <ChangsalBand />
    </div>
  );
}
