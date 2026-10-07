// 광고 지면 ID의 유일한 출처.
//
// 전에는 `App.tsx` 안에 라이브 ID가 그대로 박혀 있었다. 지면이 늘어나면 흩어지고,
// 어느 빌드가 어떤 ID를 쓰는지 한눈에 볼 수 없다.

/** 콘솔에서 발급받은 하단 고정 배너 지면 (프로덕션). */
const LIVE_BANNER_AD_GROUP_ID = "ait.v2.live.14d7a4538d864d74";

/** 공식 테스트 지면. 실 ID로 개발 테스트를 하면 정책 위반이다. */
const TEST_BANNER_AD_GROUP_ID = "ait-ad-test-banner-id";

/**
 * 하단 배너 지면.
 *
 * **프로덕션은 env 에 의존하지 않는다.** 프로덕션 ID까지 env 주입으로 바꾸면
 * 빌드 설정이 한 번 빠지는 순간 라이브 번들이 조용히 테스트 지면으로 나가고,
 * 화면은 정상으로 보이면서 수익만 0이 된다 — 눈에 띄지 않는 종류의 사고다.
 * 그래서 프로덕션은 상수로 고정하고, 바꿀 수 있는 쪽은 개발 빌드만 둔다.
 *
 * 개발 빌드는 기본적으로 테스트 지면을 쓴다. 다른 지면을 확인해야 하면
 * `VITE_BANNER_AD_GROUP_ID` 로 덮어쓴다.
 *
 * 참고: 광고 SDK 는 토스 앱 안에서만 동작한다(`isSupported()` 가 웹에서 false).
 * 그래서 브라우저 개발 중에는 어느 ID든 애초에 광고가 뜨지 않는다.
 */
export function resolveBannerAdGroupId(env: {
  dev: boolean;
  override?: string;
}): string {
  if (!env.dev) return LIVE_BANNER_AD_GROUP_ID;
  return env.override || TEST_BANNER_AD_GROUP_ID;
}

export const BANNER_AD_GROUP_ID: string = resolveBannerAdGroupId({
  dev: import.meta.env.DEV,
  override: import.meta.env.VITE_BANNER_AD_GROUP_ID as string | undefined,
});

/**
 * 배너와 조작 영역(탭바·버튼) 사이 최소 이격.
 *
 * 토스애즈 SSP 정책이 오클릭 유도를 금지한다. 탭바 바로 밑에 배너가 붙어 있으면
 * 탭을 누르려다 광고를 누르게 된다.
 */
export const AD_CONTROL_GAP_PX = 24;
