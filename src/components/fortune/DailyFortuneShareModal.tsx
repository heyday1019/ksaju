"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DailyFortuneShareCard } from "./DailyFortuneShareCard";
import type { DailyFortuneData } from "./DailyFortuneShareCard";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";

type DailyFortuneShareModalProps = {
  open: boolean;
  onClose: () => void;
  data: DailyFortuneData;
};

/**
 * Daily fortune share modal. The body IS the 9:16 DailyFortuneShareCard so the preview
 * equals the exported PNG. Share captures the full-resolution card via
 * useShareImage. Mirrors FortuneShareModal.
 */
export function DailyFortuneShareModal({
  open,
  onClose,
  data,
}: DailyFortuneShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-daily-fortune.png",
    shareMeta: {
      title: "My daily fortune on KSaju",
      text: "My daily saju fortune — make yours at ksaju.me",
    },
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your daily fortune</DialogTitle>
        <DialogDescription className="sr-only">
          Today&apos;s saju fortune reading.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <DailyFortuneShareCard ref={cardRef} data={data} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => {
              track("share_clicked", { kind: "daily_fortune" });
              share();
            }}
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
