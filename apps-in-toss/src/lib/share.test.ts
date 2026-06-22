import { vi } from "vitest";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(async () => "data:image/png;base64,xx"),
}));

import { shareOrDownloadPng } from "./share";

test("toPng 결과로 다운로드를 트리거한다", async () => {
  const node = document.createElement("div");
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  await shareOrDownloadPng(node, "ksaju.png");
  expect(click).toHaveBeenCalled();
});
