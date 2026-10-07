import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock` 은 호이스팅되므로, 정적 import 되는 모듈을 가짜로 세울 때는
// 팩토리가 참조할 함수들도 `vi.hoisted` 로 함께 끌어올려야 한다.
const m = vi.hoisted(() => ({
  shareMiniApp: vi.fn<(message: string) => Promise<boolean>>(),
  fetchUserHash: vi.fn<
    () => Promise<{ ok: true; hash: string } | { ok: false; reason: string }>
  >(),
  grantReward: vi.fn<
    (h: string, m: string) => Promise<{ ok: true } | { ok: false; code: string }>
  >(),
  hasClaimed: vi.fn<(h: string, m: string) => boolean>(),
}));

vi.mock("./toss-share", () => ({ shareMiniApp: m.shareMiniApp }));
vi.mock("./promotion", () => ({
  MISSION_AMOUNT: { saju: 10, share: 30 },
  fetchUserHash: m.fetchUserHash,
  grantReward: m.grantReward,
  hasClaimed: m.hasClaimed,
}));

import { shareWithReward } from "./share-reward";

beforeEach(() => {
  m.shareMiniApp.mockReset().mockResolvedValue(true);
  m.fetchUserHash.mockReset().mockResolvedValue({ ok: true, hash: "h1" });
  m.grantReward.mockReset().mockResolvedValue({ ok: true });
  m.hasClaimed.mockReset().mockReturnValue(false);
});

describe("shareWithReward", () => {
  it("공유가 끝나면 보상을 지급한다", async () => {
    await expect(shareWithReward("보러 올래?")).resolves.toEqual({
      shared: true,
      rewarded: 30,
    });
    expect(m.shareMiniApp).toHaveBeenCalledWith("보러 올래?");
    expect(m.grantReward).toHaveBeenCalledWith("h1", "share");
  });

  // 클릭 보상은 SSP 정책 위반이다. 보상은 '공유 완료'에만 걸려 있어야 한다.
  it("공유를 취소·실패하면 지급을 시도조차 하지 않는다", async () => {
    m.shareMiniApp.mockResolvedValueOnce(false);
    await expect(shareWithReward("x")).resolves.toEqual({
      shared: false,
      rewarded: 0,
    });
    expect(m.grantReward).not.toHaveBeenCalled();
  });

  it("이미 받은 사람에게는 지급하지 않지만 공유는 정상이다", async () => {
    m.hasClaimed.mockReturnValue(true);
    await expect(shareWithReward("x")).resolves.toEqual({
      shared: true,
      rewarded: 0,
    });
    expect(m.grantReward).not.toHaveBeenCalled();
  });

  it("지급이 실패해도 공유는 성공으로 남는다", async () => {
    m.grantReward.mockResolvedValueOnce({ ok: false, code: "4109" });
    await expect(shareWithReward("x")).resolves.toEqual({
      shared: true,
      rewarded: 0,
    });
  });

  it("사용자 식별이 안 되면 지급 없이 공유만 끝낸다", async () => {
    m.fetchUserHash.mockResolvedValueOnce({
      ok: false,
      reason: "UNSUPPORTED",
    });
    await expect(shareWithReward("x")).resolves.toEqual({
      shared: true,
      rewarded: 0,
    });
    expect(m.grantReward).not.toHaveBeenCalled();
  });

  it("지급 경로가 던져도 호출부로 새지 않는다", async () => {
    m.fetchUserHash.mockRejectedValueOnce(new Error("boom"));
    await expect(shareWithReward("x")).resolves.toEqual({
      shared: true,
      rewarded: 0,
    });
  });
});
