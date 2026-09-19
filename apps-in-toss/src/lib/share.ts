

export type SaveResult = "saved" | "downloaded" | "denied" | "failed";

/** 토스 앱/샌드박스 안에서 실행 중인지. 순수 웹(브라우저 개발)에서는 false. */
async function inTossApp(): Promise<boolean> {
  try {
    // SDK 는 반드시 동적 import (정적 import 는 웹에서 크래시 + 심사 반려)
    const { getOperationalEnvironment } = await import(
      "@apps-in-toss/web-framework"
    );
    const env = getOperationalEnvironment();
    return env === "toss" || env === "sandbox";
  } catch {
    return false;
  }
}

/** 노드를 PNG로 캡처해 dataURL 반환. 외부 통신 없음(로컬 data URL). */
async function captureDataUrl(node: HTMLElement): Promise<string> {
  await (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
  const { toPng } = await import("html-to-image"); // 저장할 때만 받는다
  return toPng(node, { pixelRatio: 3, cacheBust: true });
}

/**
 * 공유 카드를 사용자 기기에 저장한다.
 *
 * - 토스 앱/샌드박스: `saveBase64Data`로 사진첩에 저장 (photos:write 권한 선언 필요).
 *   WebView 에서는 `<a download>`가 동작하지 않으므로 SDK 경로가 유일하게 확실하다.
 * - 그 외(브라우저 개발): `<a download>` 폴백.
 */
export async function saveShareCard(
  node: HTMLElement,
  filename: string,
): Promise<SaveResult> {
  let dataUrl: string;
  try {
    dataUrl = await captureDataUrl(node);
  } catch {
    return "failed";
  }

  if (await inTossApp()) {
    try {
      const { requestPermission, saveBase64Data } = await import(
        "@apps-in-toss/web-framework"
      );
      const status = await requestPermission({
        name: "photos",
        access: "write",
      });
      if (status !== "allowed") return "denied";

      await saveBase64Data({
        data: dataUrl.replace(/^data:image\/png;base64,/, ""),
        fileName: filename,
        mimeType: "image/png",
      });
      return "saved";
    } catch {
      return "failed";
    }
  }

  try {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
    return "downloaded";
  } catch {
    return "failed";
  }
}
