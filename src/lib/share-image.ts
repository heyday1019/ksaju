import { toBlob } from "html-to-image";

/** Metadata passed to the native share sheet. */
export type ShareMeta = { title?: string; text?: string };

/**
 * Capture a DOM node to a PNG Blob. Waits for web fonts (Korean serif / hanja)
 * to load first so glyphs don't render blank. Defaults to pixelRatio 3 so a
 * 360×640 card exports at 1080×1920 (IG Story / TikTok 9:16).
 */
export async function nodeToPngBlob(
  node: HTMLElement,
  opts: { pixelRatio?: number } = {},
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const blob = await toBlob(node, {
    pixelRatio: opts.pixelRatio ?? 3,
    cacheBust: true,
  });
  if (!blob) throw new Error("Failed to render image");
  return blob;
}

/** True when the browser can share this file via the Web Share API. */
export function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

/**
 * Share the PNG via the native share sheet when possible, otherwise download it.
 * A user-cancelled share sheet (AbortError) is treated as a normal completion.
 */
export async function shareOrDownloadPng(
  blob: Blob,
  fileName: string,
  shareMeta: ShareMeta = {},
): Promise<void> {
  const file = new File([blob], fileName, { type: "image/png" });

  if (canShareFiles(file) && typeof navigator.share === "function") {
    try {
      await navigator.share({ files: [file], ...shareMeta });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Any other share failure → fall through to download.
    }
  }
  downloadBlob(blob, fileName);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
