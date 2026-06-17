"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TarotShareCard } from "./tarot-share-card";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = { open: boolean; onClose: () => void; saju: UserSaju; card: TarotCard; reading: string };

export function TarotShareModal({ open, onClose, saju, card, reading }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-tarot.png",
    shareMeta: { title: "My KSaju Card of the Day", text: "My tarot card — make yours at ksaju.me" },
  });
  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your Card of the Day</DialogTitle>
        <DialogDescription className="sr-only">A fun tarot reading for you.</DialogDescription>

        <TarotShareCard ref={cardRef} saju={saju} card={card} reading={reading} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => { track("share_clicked", { kind: "tarot" }); share(); }}
            disabled={status === "rendering"}
            className="w-full"
          >
            {shareLabel}
          </Button>
          {status === "error" && (
            <p className="text-center text-xs text-destructive">Couldn&apos;t create image — try again</p>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">← Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
