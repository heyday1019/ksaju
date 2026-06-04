import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inyeon · KSaju",
  description: "K-pop bias & partner compatibility — coming soon.",
};

/** '인연' 라우트. 이번 사이클은 플레이스홀더(궁합 이전은 사이클 12). */
export default function InyeonPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Inyeon
        </h1>
        <p className="hanja text-4xl font-bold tracking-[0.3em]">인 연</p>

        <Card className="relative overflow-hidden border-border mt-2 py-10">
          <div
            className="changsal-band absolute top-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
          <CardContent className="space-y-3 pt-6">
            <p className="text-lg font-semibold">
              K-pop bias &amp; partner compatibility
            </p>
            <p className="text-muted-foreground">Coming soon ✨</p>
            <p className="text-xs text-muted-foreground">For entertainment 🌙</p>
          </CardContent>
          <div
            className="changsal-band absolute bottom-0 left-0 right-0 h-[18px] z-10"
            style={{ backgroundSize: "40px 18px" }}
          />
        </Card>
      </div>
    </div>
  );
}
