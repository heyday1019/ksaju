"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SpreadShareCard } from "./spread-share-card";
import { useShareImage } from "@/hooks/use-share-image";
import { track } from "@/lib/analytics";
import type { TarotCard } from "@/lib/tarot";
import type { UserSaju } from "@/lib/saju-types";

type Props = {
  open: boolean; onClose: () => void;
  saju: UserSaju; cards: [TarotCard, TarotCard, TarotCard]; synthesis: string;
};

export function SpreadShareModal({ open, onClose, saju, cards, synthesis }: Props) {
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, status } = useShareImage(cardRef, {
    fileName: "ksaju-tarot-spread.png",
    shareMeta: { title: "My KSaju Past · Present · Future", text: "My tarot spread — make yours at ksaju.me" },
  });
  const shareLabel = status === "rendering" ? "Creating…" : "Share ✨";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="hanji-paper max-w-[360px] overflow-y-auto p-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Your Past · Present · Future spread</DialogTitle>
        <DialogDescription className="sr-only">A fun 3-card tarot reading for you.</DialogDescription>

        <SpreadShareCard ref={cardRef} saju={saju} cards={cards} synthesis={synthesis} locale={locale} />

        <div className="space-y-2 px-6 pb-6">
          <Button
            onClick={() => { track("share_clicked", { kind: "tarot_spread" }); share(); }}
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
