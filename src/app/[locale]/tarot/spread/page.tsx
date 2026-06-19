import type { Metadata } from "next";
import { SpreadView } from "@/components/tarot/spread/spread-view";

export const metadata: Metadata = {
  title: "Past · Present · Future Tarot · KSaju",
  description: "Draw a 3-card past, present & future tarot spread, personalized by your saju.",
};

export default function TarotSpreadPage() {
  return <SpreadView />;
}
