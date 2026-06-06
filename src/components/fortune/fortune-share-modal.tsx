"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UserSaju, CurrentLuck } from "@/lib/saju-types";
import { FortuneShareCard } from "./fortune-share-card";
import { useShareImage } from "@/hooks/use-share-image";

type FortuneShareModalProps = {
  open: boolean;
  onClose: () => void;
  userSaju: UserSaju;
  luck: CurrentLuck;
  onShared?: (method: "web_share" | "download") => void;
};

/**
 * Fortune share modal. The body IS the 9:16 FortuneShareCard so the preview
 * equals the exported PNG. Share captures the full-resolution card via
 * useShareImage. Mirrors CompatibilityModal.
 */
export function FortuneShareModal({
  open,
  onClose,
  userSaju,
  luck,
  onShared,
}: FortuneShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-fortune.png",
    shareMeta: {
      title: "My KSaju fortune",
      text: "My saju fortune — ksaju.me",
    },
    onShared,
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your saju fortune</DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju fortune reading for you.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <FortuneShareCard ref={cardRef} userSaju={userSaju} luck={luck} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={share}
            disabled={status === "rendering"}
            className="w-full"
          >
            {shareLabel}
          </Button>
          {status === "error" && (
            <p className="text-center text-xs text-destructive">
              Couldn&apos;t create image — try again
            </p>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            ← Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
