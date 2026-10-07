import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const request = Object.assign(vi.fn(async () => undefined), {
  isSupported: vi.fn(() => true),
});
const store = new Map<string, string>();
const Storage = {
  getItem: vi.fn(async (k: string) => store.get(k) ?? null),
  setItem: vi.fn(async (k: string, v: string) => {
    store.set(k, v);
  }),
};

vi.mock("@apps-in-toss/web-framework", () => ({
  Review: { request },
  Storage,
}));

import { requestReviewAt } from "./review";

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  store.clear();
  request.mockClear();
  request.isSupported.mockReturnValue(true);
  Storage.getItem.mockClear();
  Storage.setItem.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("requestReviewAt", () => {
  it("만족도가 높은 순간에 리뷰를 청한다", async () => {
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("같은 순간은 기기당 1회만 묻는다", async () => {
    await requestReviewAt("share_saved");
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);
  });

  // 서로 다른 순간이라도 30일 안에는 다시 묻지 않는다.
  it("다른 순간이어도 30일 안에는 묻지 않는다", async () => {
    await requestReviewAt("share_saved");
    await requestReviewAt("promo_done");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("30일이 지나면 다른 순간에 다시 물을 수 있다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime() + 31 * DAY);
    await requestReviewAt("promo_done");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("30일이 지나도 이미 쓴 순간은 다시 묻지 않는다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await requestReviewAt("share_saved");

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime() + 31 * DAY);
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);
  });

  // 구버전에서 기록부터 하면 그 사람의 '1회' 가 영구히 소진된다.
  it("미지원 버전에서는 아무것도 하지 않고 기록도 남기지 않는다", async () => {
    request.isSupported.mockReturnValue(false);
    await requestReviewAt("share_saved");
    expect(request).not.toHaveBeenCalled();
    expect(Storage.setItem).not.toHaveBeenCalled();

    // 지원 버전으로 올라오면 그때 물을 수 있어야 한다
    request.isSupported.mockReturnValue(true);
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("저장소가 던져도 호출부로 에러가 새지 않는다", async () => {
    Storage.getItem.mockRejectedValueOnce(new Error("no storage"));
    await expect(requestReviewAt("share_saved")).resolves.toBeUndefined();
  });

  it("리뷰 호출이 던져도 호출부로 에러가 새지 않는다", async () => {
    request.mockRejectedValueOnce(new Error("no bridge"));
    await expect(requestReviewAt("share_saved")).resolves.toBeUndefined();
  });

  it("저장된 값이 깨져 있어도 동작한다", async () => {
    store.set("ksaju.review.v1:last", "not-a-number");
    await requestReviewAt("share_saved");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
