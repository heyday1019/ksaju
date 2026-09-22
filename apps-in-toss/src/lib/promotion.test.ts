import { beforeEach, expect, test, vi } from "vitest";

const getAnonymousKey = vi.fn();
const grantPromotionReward = vi.fn();
const getSchemeUri = vi.fn(() => "intoss://ksaju");
vi.mock("@apps-in-toss/web-framework", () => ({
  get getAnonymousKey() {
    return getAnonymousKey;
  },
  get grantPromotionReward() {
    return grantPromotionReward;
  },
  get getSchemeUri() {
    return getSchemeUri;
  },
}));

import { fetchUserHash, grantReward, hasClaimed, MISSION_AMOUNT } from "./promotion";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getAnonymousKey.mockResolvedValue({ type: "HASH", hash: "h1" });
  getSchemeUri.mockReturnValue("intoss://ksaju");
});

test("사용자 식별 실패 4갈래를 구분한다", async () => {
  getAnonymousKey.mockResolvedValue(undefined);
  expect(await fetchUserHash()).toEqual({ ok: false, reason: "UNSUPPORTED" });

  getAnonymousKey.mockResolvedValue("ERROR");
  expect(await fetchUserHash()).toEqual({ ok: false, reason: "ERROR" });

  getAnonymousKey.mockResolvedValue({ type: "HASH", hash: "h1" });
  expect(await fetchUserHash()).toEqual({ ok: true, hash: "h1" });
});

test("지급 성공하면 hash 원장에 기록해 재지급을 막는다", async () => {
  grantPromotionReward.mockResolvedValue({ key: "rk_1" });

  expect(await grantReward("h1", "saju")).toEqual({ ok: true });
  expect(grantPromotionReward).toHaveBeenCalledWith({
    params: { promotionCode: expect.any(String), amount: MISSION_AMOUNT.saju },
  });
  expect(hasClaimed("h1", "saju")).toBe(true);

  // 두 번째 호출은 SDK 를 부르지도 않는다
  grantPromotionReward.mockClear();
  expect(await grantReward("h1", "saju")).toEqual({
    ok: false,
    code: "ALREADY_GRANTED",
  });
  expect(grantPromotionReward).not.toHaveBeenCalled();
});

test("진입 스킴에 promo=test 가 있으면 테스트 코드로 호출한다", async () => {
  // 딥링크 쿼리는 location.search 가 아니라 진입 스킴에만 실린다
  getSchemeUri.mockReturnValue("intoss://ksaju?_deploymentId=abc&promo=test");
  grantPromotionReward.mockResolvedValue({ key: "rk_1" });

  await grantReward("h9", "saju");

  expect(grantPromotionReward).toHaveBeenCalledWith({
    params: { promotionCode: expect.stringMatching(/^TEST_/), amount: 10 },
  });
});

test("스킴에 플래그가 없으면 실제 코드로 호출한다", async () => {
  grantPromotionReward.mockResolvedValue({ key: "rk_1" });
  await grantReward("h8", "saju");
  expect(grantPromotionReward).toHaveBeenCalledWith({
    params: { promotionCode: expect.not.stringMatching(/^TEST_/), amount: 10 },
  });
});

test("원장은 사용자(hash)별로 분리된다", async () => {
  grantPromotionReward.mockResolvedValue({ key: "rk_1" });
  await grantReward("h1", "saju");
  expect(hasClaimed("h2", "saju")).toBe(false);
});

test("미션끼리는 서로 막지 않는다", async () => {
  grantPromotionReward.mockResolvedValue({ key: "rk_1" });
  await grantReward("h1", "saju");
  expect(hasClaimed("h1", "share")).toBe(false);
  expect(await grantReward("h1", "share")).toEqual({ ok: true });
});

test("에러 모양 두 가지({errorCode} / {code})를 모두 읽는다", async () => {
  grantPromotionReward.mockResolvedValue({ errorCode: "4109", message: "종료" });
  expect(await grantReward("h1", "saju")).toEqual({ ok: false, code: "4109" });

  localStorage.clear();
  grantPromotionReward.mockResolvedValue({ code: "4112" });
  expect(await grantReward("h1", "saju")).toEqual({ ok: false, code: "4112" });
});

test("실패하면 원장에 남기지 않아 다시 시도할 수 있다", async () => {
  grantPromotionReward.mockResolvedValue({ errorCode: "4110", message: "오류" });
  await grantReward("h1", "saju");
  expect(hasClaimed("h1", "saju")).toBe(false);
});

test("4110 은 한 번 재시도한다", async () => {
  grantPromotionReward
    .mockResolvedValueOnce({ errorCode: "4110", message: "오류" })
    .mockResolvedValueOnce({ key: "rk_2" });
  expect(await grantReward("h1", "saju")).toEqual({ ok: true });
  expect(grantPromotionReward).toHaveBeenCalledTimes(2);
});
