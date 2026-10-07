import { beforeEach, describe, expect, it, vi } from "vitest";

const screen = vi.fn();
const impression = vi.fn();
const click = vi.fn();

// SDK 는 토스 앱 안에서만 존재한다. 여기서는 브리지를 가짜로 세워 호출만 관찰한다.
vi.mock("@apps-in-toss/web-framework", () => ({
  Analytics: { screen, impression, click },
}));

import {
  LOG,
  logCompatResult,
  logDailyFortuneOpen,
  logSajuResult,
  logScreen,
  logShareClicked,
  logShareSaved,
  logTarotResult,
} from "./analytics";

beforeEach(() => {
  screen.mockReset();
  impression.mockReset();
  click.mockReset();
});

describe("analytics", () => {
  it("사주 결과는 log_name 'saju_result' 로 impression 을 보낸다", async () => {
    logSajuResult();
    await vi.waitFor(() => expect(impression).toHaveBeenCalledTimes(1));
    expect(impression).toHaveBeenCalledWith({ log_name: LOG.sajuResult });
  });

  it("탭 이름 그대로 screen 을 보낸다 — 콘솔에 `saju::screen` 으로 쌓인다", async () => {
    logScreen("saju");
    await vi.waitFor(() => expect(screen).toHaveBeenCalledTimes(1));
    expect(screen).toHaveBeenCalledWith({ log_name: "saju" });
  });

  it("궁합은 아이돌/사람을 kind 로 구분한다", async () => {
    logCompatResult("idol");
    await vi.waitFor(() => expect(impression).toHaveBeenCalledTimes(1));
    expect(impression).toHaveBeenCalledWith({
      log_name: LOG.compatResult,
      kind: "idol",
    });
  });

  it("타로 결과를 보낸다", async () => {
    logTarotResult();
    await vi.waitFor(() => expect(impression).toHaveBeenCalledTimes(1));
    expect(impression).toHaveBeenCalledWith({ log_name: LOG.tarotResult });
  });

  it("공유 저장은 카드와 저장 방식을 함께 보낸다", async () => {
    logShareSaved("ksaju-fortune.png", "saved");
    await vi.waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(click).toHaveBeenCalledWith({
      log_name: LOG.shareSaved,
      card: "ksaju-fortune.png",
      how: "saved",
    });
  });

  // 계측은 부가 기능이다. 토스 앱 밖이거나 브리지가 죽어도 화면을 막으면 안 된다.
  it("브리지가 던져도 호출부로 에러가 새지 않는다", async () => {
    impression.mockImplementationOnce(() => {
      throw new Error("no bridge");
    });
    expect(() => logSajuResult()).not.toThrow();
    await vi.waitFor(() => expect(impression).toHaveBeenCalledTimes(1));
  });

  it("오늘의 운세 노출을 보낸다", async () => {
    logDailyFortuneOpen("card");
    await vi.waitFor(() => expect(impression).toHaveBeenCalledTimes(1));
    expect(impression).toHaveBeenCalledWith({
      log_name: LOG.dailyFortuneOpen,
      state: "card",
    });
  });

  it("공유 시도를 보낸다 — 저장(share_saved)과 구분된다", async () => {
    logShareClicked("saju_result");
    await vi.waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(click).toHaveBeenCalledWith({
      log_name: LOG.shareClicked,
      from: "saju_result",
    });
  });

  // 이름이 바뀌면 콘솔 전환 지표(EVENT_LOG eventName)가 조용히 0이 된다.
  // 특히 `saju_result` 는 **대표(MAIN) 지표**라 콘솔에서 삭제조차 할 수 없다 —
  // 이 이름을 바꾸면 전환율이 영구히 0이 되고 복구할 방법이 없다.
  it("콘솔 지표가 묶여 있는 로그 이름을 고정한다", () => {
    expect(LOG).toEqual({
      sajuResult: "saju_result",
      compatResult: "compat_result",
      tarotResult: "tarot_result",
      shareSaved: "share_saved",
      dailyFortuneOpen: "daily_fortune_open",
      shareClicked: "share_clicked",
    });
  });

  // 생년월일·이름은 어떤 파라미터에도 실리지 않는다 (외부 전송 0 원칙).
  it("로그 파라미터에 날짜꼴 문자열이 들어가지 않는다", async () => {
    logSajuResult();
    logDailyFortuneOpen("card");
    logShareClicked("saju_result");
    logCompatResult("person");
    logTarotResult();
    logShareSaved("ksaju-fortune.png", "saved");
    await vi.waitFor(() =>
      expect(impression.mock.calls.length + click.mock.calls.length).toBe(6),
    );
    const sent = [...impression.mock.calls, ...click.mock.calls]
      .flat()
      .flatMap((p) => Object.values(p as Record<string, unknown>))
      .map(String);
    for (const v of sent) {
      expect(v).not.toMatch(/\d{4}-\d{2}-\d{2}/); // 1990-01-01
      expect(v).not.toMatch(/(?<!\d)\d{8}(?!\d)/); // 19900101
    }
  });
});
