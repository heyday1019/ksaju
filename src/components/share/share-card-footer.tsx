/**
 * 공유 카드 공통 푸터 = 유입 마그넷.
 * 낙관-중앙 브랜디드 QR(public/ksaju-qr.png, 자체 흰 패널 → 카드 테마 무관 스캔 대비)
 * + "Make yours → ksaju.me" CTA + "For entertainment 🌙" 디스클레이머.
 * CompatShareCard·FortuneShareCard 둘 다 사용. html-to-image가 same-origin
 * 정적 이미지를 캡처 시 인라인하므로 export 추가 코드 불필요.
 */
export function ShareCardFooter() {
  return (
    <div className="flex w-full flex-col items-center gap-2 pb-7">
      <div className="rounded-xl bg-white p-2 shadow-sm">
        {/* 정적 img(next/image 아님) — 캡처/로드 단순화 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ksaju-qr.png"
          alt="Scan to make your own at ksaju.me"
          width={92}
          height={92}
          className="block"
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-primary">
          Make yours → <span className="text-foreground">ksaju.me</span>
        </p>
        <p className="text-[11px] text-muted-foreground">For entertainment 🌙</p>
      </div>
    </div>
  );
}
