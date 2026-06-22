import type { ReactNode } from "react";

// 9:16 (360×640) 한지 공유 카드 래퍼. export 캡처 대상.
export function ShareCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ width: 360, height: 640 }}
      className="flex flex-col justify-between bg-[var(--color-hanji)] p-5"
    >
      {children}
    </div>
  );
}
