"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompatibilityResult, SajuPillars } from "@/lib/compatibility";
import { CompatShareCard, type CompatOther } from "./compat-share-card";
import { useShareImage } from "@/hooks/use-share-image";

export type { CompatOther };

type CompatibilityModalProps = {
  open: boolean;
  onClose: () => void;
  mePillars: SajuPillars;
  other: CompatOther;
  result: CompatibilityResult;
  closeLabel?: string;
  onShared?: (method: "web_share" | "download") => void;
};

/**
 * Compatibility result modal. The body IS the 9:16 CompatShareCard, scaled to
 * fit the dialog so the preview equals the exported PNG. Share captures the
 * full-resolution card via useShareImage. Generic: idol + general partner.
 */
export function CompatibilityModal({
  open,
  onClose,
  mePillars,
  other,
  result,
  closeLabel = "← Close",
  onShared,
}: CompatibilityModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-compat.png",
    shareMeta: {
      title: "My KSaju compatibility",
      text: `You × ${other.name}: ${result.score}/100 — ksaju.me`,
    },
    onShared,
  });

  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">
          Your saju compatibility with {other.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          A fun saju compatibility score between you and {other.name}.
        </DialogDescription>

        {/* 9:16 card — width 360 matches the dialog; no scaling needed at this size */}
        <CompatShareCard
          ref={cardRef}
          mePillars={mePillars}
          other={other}
          result={result}
        />

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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            {closeLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
