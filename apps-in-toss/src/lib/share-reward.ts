import {
  MISSION_AMOUNT,
  fetchUserHash,
  grantReward,
  hasClaimed,
} from "./promotion";
import { shareMiniApp } from "./toss-share";

export type ShareOutcome = {
  /** 공유 시트까지 실제로 끝났는지. 취소·실패면 false. */
  shared: boolean;
  /** 이번 공유로 지급된 금액. 0이면 지급 없음(이미 받았거나 이벤트 종료 등). */
  rewarded: number;
};

/**
 * 공유하고, 보상이 남아 있으면 이어서 지급까지 한다.
 *
 * 전에는 공유 보상이 `PromotionCard` 안에만 있었다. 그 카드는 미션을 끝내거나
 * 넘기면 **영구히 사라지도록** 설계돼 있어서, 재방문자에게는 보상이 붙은 공유
 * 경로가 아예 없었다. 바이럴은 돌아오는 사용자가 반복해서 퍼뜨려야 생기는데
 * 정확히 그 사용자에게 버튼이 없던 셈이다.
 *
 * 그래서 결과 화면의 상시 공유 버튼도 같은 지급 경로를 타게 한다.
 *
 * 규칙:
 * - **공유가 끝나야** 지급을 시도한다. 취소·실패면 아무것도 하지 않는다
 *   (클릭 보상은 SSP 정책 위반이고, 여기 보상은 '완료'에만 걸려 있다).
 * - 지급 실패가 공유를 망치지 않는다 — 공유는 이미 끝났으므로 `shared: true` 다.
 * - `dismissShare`('안 할래요')는 보지 않는다. 그건 '다시 묻지 말라'는 뜻이고,
 *   사용자가 직접 공유를 눌렀다면 받을 자격이 있다.
 * - 중복 지급은 `grantReward` 안의 hash 기준 원장이 막는다.
 */
export async function shareWithReward(message: string): Promise<ShareOutcome> {
  const shared = await shareMiniApp(message);
  if (!shared) return { shared: false, rewarded: 0 };

  try {
    const user = await fetchUserHash();
    // 토스 앱 밖이거나 식별 실패 — 지급은 못 하지만 공유는 끝났다
    if (!user.ok) return { shared: true, rewarded: 0 };
    if (hasClaimed(user.hash, "share")) return { shared: true, rewarded: 0 };

    const r = await grantReward(user.hash, "share");
    return { shared: true, rewarded: r.ok ? MISSION_AMOUNT.share : 0 };
  } catch {
    return { shared: true, rewarded: 0 };
  }
}
