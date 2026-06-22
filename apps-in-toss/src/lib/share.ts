import { toPng } from "html-to-image";

/**
 * 노드를 9:16 PNG로 캡처해 다운로드한다. 외부 통신 없음(로컬 data URL).
 * 토스 웹프레임워크의 네이티브 공유 API가 없어 다운로드 폴백만 사용.
 */
export async function shareOrDownloadPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  await (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
  const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
