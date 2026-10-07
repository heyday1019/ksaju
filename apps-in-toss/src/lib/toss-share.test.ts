import { beforeEach, describe, expect, it, vi } from "vitest";

type LinkParams = { path: string; ogImageUrl?: string };

const createLink = vi.fn(
  async (_params: LinkParams) => "https://toss.me/ksaju/abc",
);
const sendMessage = vi.fn(async (_m: { message: string }) => undefined);

vi.mock("@apps-in-toss/web-framework", () => ({
  Share: { createLink, sendMessage },
}));

import { shareMiniApp } from "./toss-share";

beforeEach(() => {
  createLink.mockReset();
  createLink.mockResolvedValue("https://toss.me/ksaju/abc");
  sendMessage.mockReset();
});

describe("shareMiniApp", () => {
  it("토스 공유 링크를 만들어 메시지에 붙여 보낸다", async () => {
    await expect(shareMiniApp("내 사주 봤어")).resolves.toBe(true);

    expect(createLink).toHaveBeenCalledWith({
      path: "intoss://ksaju",
      ogImageUrl: "https://ksaju.me/og-default.png",
    });
    expect(sendMessage).toHaveBeenCalledWith({
      message: "내 사주 봤어\nhttps://toss.me/ksaju/abc",
    });
  });

  // 미리보기 이미지를 빼면 그림이 핵심인 앱의 링크가 맨 링크로 돌아다닌다.
  it("미리보기 이미지를 반드시 함께 보낸다", async () => {
    await shareMiniApp("x");
    const arg = createLink.mock.calls[0][0];
    expect(arg.ogImageUrl).toBeTruthy();
    expect(arg.ogImageUrl).toMatch(/^https:\/\//);
  });

  // 자사 웹사이트 링크를 그대로 공유하면 심사 반려 사유다.
  it("자사 링크가 아니라 intoss:// 딥링크로 공유 링크를 만든다", async () => {
    await shareMiniApp("x");
    const arg = createLink.mock.calls[0][0];
    expect(arg.path).toBe("intoss://ksaju");
  });

  it("공유 링크 생성이 실패하면 false 를 돌려주고 던지지 않는다", async () => {
    createLink.mockRejectedValueOnce(new Error("no bridge"));
    await expect(shareMiniApp("x")).resolves.toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  // 사용자가 공유 시트를 닫은 경우도 여기로 온다 — 화면이 깨지면 안 된다.
  it("공유 시트가 실패/취소돼도 false 만 돌려준다", async () => {
    sendMessage.mockRejectedValueOnce(new Error("cancelled"));
    await expect(shareMiniApp("x")).resolves.toBe(false);
  });
});
