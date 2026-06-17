import type { Metadata } from "next";
import { TarotView } from "@/components/tarot/tarot-view";

export const metadata: Metadata = {
  title: "Tarot · KSaju",
  description: "Draw your Korean tarot Card of the Day, personalized by your saju.",
};

export default function TarotPage() {
  return <TarotView />;
}
