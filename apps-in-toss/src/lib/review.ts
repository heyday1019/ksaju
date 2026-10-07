// 미니앱 리뷰 요청.
//
// 2026-10-22 부터 토스 노출 정책이 등급제(출시/추천/부스팅)로 바뀌고 '리뷰'가
// 추천 선정 기준에 직접 들어간다. 이 앱에는 리뷰를 요청하는 코드가 아예 없었다.
//
// `Review.request()` 는 **인자가 없고 빈도 제한도 없다.** 그대로 쓰면 아무 때나
// 반복해서 띄울 수 있고, 그건 평점을 깎는 가장 빠른 길이다. 그래서 '언제'와
// '얼마나'를 전부 우리가 건다.

/** 리뷰를 요청할 만한 순간. 만족도가 높은 지점만 둔다. */
export type ReviewMoment = "share_saved" | "promo_done";

const MOMENT_KEY = (m: ReviewMoment) => `ksaju.review.v1:${m}`;
const LAST_ASKED_KEY = "ksaju.review.v1:last";

/** 전체 요청 간격. 같은 사람에게 이보다 자주 묻지 않는다. */
const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * 만족도가 높은 순간에 리뷰를 한 번 청한다.
 *
 * - 같은 `moment` 는 **기기당 1회**
 * - 전체 요청은 **30일에 1회**
 * - 토스앱 5.253.0 미만에서는 조용히 아무 일도 하지 않는다
 * - 저장소·브리지 실패는 모두 삼킨다. 리뷰 요청이 화면을 막아선 안 된다
 *
 * 기록은 SDK `Storage`(네이티브)에 남긴다. 사주 프로필·프로모션 원장은
 * `localStorage` 를 쓰지만 그건 동기 API 라 호출부가 전부 묶여 있고, 리뷰는
 * 신규 데이터라 처음부터 비동기 저장소로 둘 수 있었다.
 *
 * 첫 진입에서는 절대 부르지 않는다 — 아직 좋아할 이유가 없는 사람에게 평점을
 * 물으면 낮은 점수만 받는다.
 */
export async function requestReviewAt(moment: ReviewMoment): Promise<void> {
  try {
    // SDK 는 반드시 동적 import (정적 import 는 웹에서 크래시 + 심사 반려)
    const { Review, Storage } = await import("@apps-in-toss/web-framework");

    // 지원하지 않는 버전에서 먼저 걸러낸다. 이걸 건너뛰고 기록부터 하면
    // 구버전 사용자의 '1회' 가 영구히 소진된다.
    if (Review.request.isSupported() !== true) return;

    const [already, last] = await Promise.all([
      Storage.getItem(MOMENT_KEY(moment)),
      Storage.getItem(LAST_ASKED_KEY),
    ]);
    if (already) return;

    const lastMs = Number(last);
    if (Number.isFinite(lastMs) && lastMs > 0 && Date.now() - lastMs < COOLDOWN_MS) {
      return;
    }

    // 요청 직전에 기록한다. 호출이 중간에 실패해도 다시 묻지 않는 쪽이 안전하다.
    const now = String(Date.now());
    await Promise.all([
      Storage.setItem(MOMENT_KEY(moment), now),
      Storage.setItem(LAST_ASKED_KEY, now),
    ]);

    await Review.request();
  } catch {
    // 토스 앱 밖이거나 저장소가 없는 환경. 리뷰는 부가 기능이라 삼킨다.
  }
}
