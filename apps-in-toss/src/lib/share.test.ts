import { vi, beforeEach, expect, test } from "vitest";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(async () => "data:image/png;base64,AAAA"),
}));

const saveBase64Data = vi.fn(async () => {});
const requestPermission = vi.fn(async () => "allowed");
const getOperationalEnvironment = vi.fn(() => "toss");

vi.mock("@apps-in-toss/web-framework", () => ({
  get saveBase64Data() {
    return saveBase64Data;
  },
  get requestPermission() {
    return requestPermission;
  },
  get getOperationalEnvironment() {
    return getOperationalEnvironment;
  },
}));

import { saveShareCard } from "./share";

beforeEach(() => {
  vi.clearAllMocks();
  requestPermission.mockResolvedValue("allowed");
  getOperationalEnvironment.mockReturnValue("toss");
});

test("토스 앱에서는 사진첩 저장 SDK(saveBase64Data)로 저장한다", async () => {
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});

  const result = await saveShareCard(document.createElement("div"), "a.png");

  expect(result).toBe("saved");
  expect(saveBase64Data).toHaveBeenCalledWith({
    data: "AAAA", // data URL 프리픽스가 제거된 순수 base64
    fileName: "a.png",
    mimeType: "image/png",
  });
  expect(click).not.toHaveBeenCalled(); // WebView 에서 동작하지 않는 다운로드 폴백을 쓰지 않는다
});

test("사진 권한을 거부하면 denied 를 돌려주고 저장하지 않는다", async () => {
  requestPermission.mockResolvedValue("denied");

  const result = await saveShareCard(document.createElement("div"), "a.png");

  expect(result).toBe("denied");
  expect(saveBase64Data).not.toHaveBeenCalled();
});

test("토스 밖(브라우저)에서는 다운로드로 폴백한다", async () => {
  getOperationalEnvironment.mockImplementation(() => {
    throw new Error("not in toss");
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});

  const result = await saveShareCard(document.createElement("div"), "a.png");

  expect(result).toBe("downloaded");
  expect(click).toHaveBeenCalled();
  expect(saveBase64Data).not.toHaveBeenCalled();
});
