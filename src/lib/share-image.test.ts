// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("html-to-image", () => ({ toBlob: vi.fn() }));
import { toBlob } from "html-to-image";
import { nodeToPngBlob, canShareFiles, shareOrDownloadPng } from "./share-image";

const PNG = new Blob(["x"], { type: "image/png" });

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  globalThis.URL.createObjectURL = vi.fn(() => "blob:fake");
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  delete (navigator as unknown as { share?: unknown }).share;
  delete (navigator as unknown as { canShare?: unknown }).canShare;
});

describe("nodeToPngBlob", () => {
  it("awaits fonts.ready and returns the toBlob result", async () => {
    (toBlob as ReturnType<typeof vi.fn>).mockResolvedValue(PNG);
    const node = document.createElement("div");
    const blob = await nodeToPngBlob(node, { pixelRatio: 3 });
    expect(blob).toBe(PNG);
    expect(toBlob).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ pixelRatio: 3 }),
    );
  });

  it("throws when toBlob yields null", async () => {
    (toBlob as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const node = document.createElement("div");
    await expect(nodeToPngBlob(node)).rejects.toThrow(/render/i);
  });
});

describe("canShareFiles", () => {
  it("false when navigator.canShare is absent", () => {
    expect(canShareFiles(new File([PNG], "a.png"))).toBe(false);
  });
  it("delegates to navigator.canShare when present", () => {
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    expect(canShareFiles(new File([PNG], "a.png"))).toBe(true);
  });
});

describe("shareOrDownloadPng", () => {
  it("calls navigator.share with the file when supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    (navigator as unknown as { share: unknown }).share = share;
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png", { title: "T" });
    expect(outcome).toBe("web_share");
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0];
    expect(arg.files[0]).toBeInstanceOf(File);
    expect(arg.title).toBe("T");
  });

  it("treats AbortError (user cancel) as success — no download fallback", async () => {
    const err = new Error("cancel");
    err.name = "AbortError";
    (navigator as unknown as { canShare: unknown }).canShare = vi.fn(() => true);
    (navigator as unknown as { share: unknown }).share = vi.fn().mockRejectedValue(err);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png");
    expect(outcome).toBe("cancelled");
    expect(click).not.toHaveBeenCalled();
  });

  it("falls back to anchor download when share is unsupported", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const outcome = await shareOrDownloadPng(PNG, "ksaju.png");
    expect(outcome).toBe("download");
    expect(click).toHaveBeenCalledTimes(1);
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(PNG);
  });
});
