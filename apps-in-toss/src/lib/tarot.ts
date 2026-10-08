import tarot from "../data/ksaju-tarot.json";
import type { WuXing } from "./saju-types";

// 카드 원본 데이터만 둔다. 뽑기(방향 포함)는 `ktarot.ts`, 한국어 리딩은
// `content/ko/ktarot.ts` 가 맡는다.
//
// 오늘의 운세도 같이 쓰므로 공용 모듈로 옮겼다. 기존 import 경로를 위해 재수출한다.
export { kstDateString } from "./kst-date";

export type TarotCard = {
  id: number;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  rank: string;
  name_en: string;
  name_kr: string;
  filename: string;
  element: WuXing | null;
  theme: string;
  keywords: string;
};

export const TAROT_CARDS = tarot as TarotCard[];

export function getCardById(id: number): TarotCard | null {
  return TAROT_CARDS.find((c) => c.id === id) ?? null;
}
