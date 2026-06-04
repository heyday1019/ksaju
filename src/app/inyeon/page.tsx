import type { Metadata } from "next";
import { InyeonView } from "@/components/inyeon/inyeon-view";

export const metadata: Metadata = {
  title: "Inyeon · KSaju",
  description: "Your K-pop bias & partner saju compatibility.",
};

/** '인연' 라우트 — 얇은 server wrapper(metadata 유지) + client InyeonView. */
export default function InyeonPage() {
  return <InyeonView />;
}
