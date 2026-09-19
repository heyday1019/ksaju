import stamp from "../assets/stamp.webp";

/** 우물 정(井) 창살 띠. 화면/카드 구획을 나누는 브랜드 장식. 높이는 CSS 고정(14px). */
export function ChangsalBand({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`changsal-band ${className}`} />;
}

/** 낙관(四柱 도장) 마크 + 한 줄 카피. 자체 '헤더'가 아니라 첫 화면 본문의 인트로다. */
export function BrandMark() {
  return (
    <div className="flex flex-col items-center gap-2">
      <img src={stamp} alt="" width={64} height={64} className="rounded-xl" />
      <p className="text-sm text-gray-500">사주와 타로로 읽는 오늘의 나</p>
    </div>
  );
}
