import { useEffect, useRef, useState } from "react";

// 앱인토스 인앱광고 2.0 — 하단 고정 배너.
//
// 이 앱은 배너만 쓴다(전면형·보상형 없음). 그래서 광고 코어의 슬롯 중재
// (배너 vs 전면형 직렬화)는 필요 없다 — 동시에 로드될 다른 광고가 없다.
//
// 지켜야 하는 공식 규칙:
//  - 호출 전 `isSupported()` 체크 (토스 앱 밖에서는 false → 아무것도 렌더하지 않는다)
//  - 컨테이너 width 100%, 고정형은 height 96px, 부착 엘리먼트 내부는 비워둔다
//  - 노필/렌더실패로 한 번도 못 뜬 슬롯은 접어서 빈 여백을 남기지 않는다
//  - 광고를 가리거나 겹치지 않는다 (탭바보다 아래층에 두고 본문 패딩으로 자리를 비운다)
//
// 노출 시점 규칙 (심사 반려 대응):
//  - **첫 화면에는 올리지 않는다.** 호출부(App)가 사주를 본 뒤에만 렌더한다.
//    외부 SDK 로드가 '최초 접속' 구간에 얹히는 것을 원천 차단한다.
//  - 마운트 즉시 '광고' 라벨과 자리를 먼저 그린다. 늦게 튀어나오면
//    "유저가 예상하기 어려운 시점에 광고가 노출된다"는 반려를 받는다.
//    (이전 버전에서 requestIdleCallback 으로 미뤘다가 실제로 지적받았다)

const BANNER_HEIGHT = 96;

let initialized = false;
let initializing: Promise<boolean> | null = null;

/** SDK 를 앱 전역에서 1회만 초기화한다. 미지원 환경이면 false. */
async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      // SDK 는 반드시 동적 import (정적 import 는 웹에서 크래시 + 심사 반려)
      const { TossAds } = await import("@apps-in-toss/web-framework");
      if (TossAds.initialize.isSupported() !== true) return false;
      return await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 5_000); // 콜백 유실 대비
        TossAds.initialize({
          callbacks: {
            onInitialized: () => {
              clearTimeout(timer);
              initialized = true;
              resolve(true);
            },
            onInitializationFailed: () => {
              clearTimeout(timer);
              resolve(false);
            },
          },
        });
      });
    } catch {
      return false;
    }
  })();

  return initializing;
}

export function BannerAd({ adGroupId }: { adGroupId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attached: { destroy: () => void } | undefined;
    // 한 번이라도 떴던 슬롯은 이후 자동갱신의 노필로 접지 않는다(SDK 가 다음 소재로 재시도).
    let everRendered = false;

    void (async () => {
      const ok = await ensureInitialized();
      if (cancelled) return;
      if (!ok) {
        setFailed(true);
        return;
      }
      const target = ref.current;
      if (!target) return;

      const { TossAds } = await import("@apps-in-toss/web-framework");
      if (cancelled) return;

      attached = TossAds.attachBanner(adGroupId, target, {
        variant: "expanded",
        tone: "blackAndWhite",
        theme: "light", // 앱이 한지 라이트 테마 전용이라 배너도 밝게 고정
        callbacks: {
          onAdRendered: () => {
            everRendered = true;
          },
          onNoFill: () => {
            if (!everRendered) setFailed(true);
          },
          onAdFailedToRender: () => {
            if (!everRendered) setFailed(true);
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      attached?.destroy();
    };
  }, [adGroupId]);

  // 미지원 환경(웹/샌드박스)·노필·렌더실패 → 빈 여백을 남기지 않는다
  if (failed) return null;

  return (
    <div className="bg-[var(--color-hanji)]/80 backdrop-blur">
      {/* 광고임을 먼저 알린다 — 소재보다 라벨이 항상 앞선다 */}
      <p className="px-4 pb-0.5 pt-1 text-[10px] tracking-wider text-gray-400">
        광고
      </p>
      {/* 공식 문서: width 100%, 고정형은 height 고정, 내부는 비워둔다 */}
      <div ref={ref} style={{ width: "100%", height: BANNER_HEIGHT }} />
    </div>
  );
}

export const BANNER_AD_HEIGHT = BANNER_HEIGHT;
