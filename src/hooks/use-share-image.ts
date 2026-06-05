"use client";

import { useCallback, useState, type RefObject } from "react";
import {
  nodeToPngBlob,
  shareOrDownloadPng,
  type ShareMeta,
  type ShareOutcome,
} from "@/lib/share-image";

export type ShareStatus = "idle" | "rendering" | "error";

/**
 * Capture the referenced node to PNG and share/download it, exposing a status
 * for button UX. Success and user-cancel both return to "idle"; only a real
 * failure sets "error". Reusable by any share card (compat now, fortune later).
 */
export function useShareImage(
  ref: RefObject<HTMLElement | null>,
  opts: {
    fileName: string;
    shareMeta?: ShareMeta;
    pixelRatio?: number;
    onShared?: (method: Exclude<ShareOutcome, "cancelled">) => void;
  },
) {
  const { fileName, shareMeta, pixelRatio, onShared } = opts;
  const [status, setStatus] = useState<ShareStatus>("idle");

  const share = useCallback(async () => {
    const node = ref.current;
    if (!node) return;
    setStatus("rendering");
    try {
      const blob = await nodeToPngBlob(node, { pixelRatio });
      const outcome = await shareOrDownloadPng(blob, fileName, shareMeta);
      setStatus("idle");
      if (outcome !== "cancelled") onShared?.(outcome);
    } catch {
      setStatus("error");
    }
  }, [ref, fileName, shareMeta, pixelRatio, onShared]);

  return { share, status };
}
